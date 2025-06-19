// src/services/notificationService.ts
import {
    DeviceToken,
    NotificationChannel,
    NotificationEvent,
    NotificationEventType,
    UserNotificationPreferences
} from '@/types';
import { Logger } from '@/utils/logger';
import { firebaseService } from './firebaseService';
import { redisService } from './redisService';

const logger = new Logger('NotificationService');

export class NotificationService {
    async sendNotification(notification: NotificationEvent): Promise<void> {
        const startTime = Date.now();
        
        try {
            logger.info('🔔 Processing notification', {
                id: notification.id,
                type: notification.type,
                userId: notification.userId,
                priority: notification.priority,
                title: notification.title,
            });

            // Skip special user IDs (BROADCAST, ADMIN) for now
            if (['BROADCAST', 'ADMIN'].includes(notification.userId)) {
                logger.info('⏭️ Skipping special user ID notification', {
                    userId: notification.userId,
                    type: notification.type,
                });
                return;
            }

            // Check if user can receive notification
            const canSend = await redisService.canSendNotification(notification.userId, notification.type);
            if (!canSend) {
                logger.info('🚫 Notification blocked by rate limiting or preferences', {
                    userId: notification.userId,
                    type: notification.type,
                });
                return;
            }

            // Check for duplicates (with improved logic)
            const isDuplicate = await redisService.isNotificationDuplicate(
                notification.userId,
                notification.type,
                notification.metadata.productId
            );
            if (isDuplicate) {
                logger.info('🔄 Duplicate notification skipped', {
                    userId: notification.userId,
                    type: notification.type,
                    productId: notification.metadata.productId,
                });
                return;
            }

            // Get user preferences
            const preferences = await redisService.getUserPreferences(notification.userId);
            const effectiveChannels = this.getEffectiveChannels(notification, preferences);

            if (effectiveChannels.length === 0) {
                logger.info('📵 No enabled channels for notification', {
                    userId: notification.userId,
                    type: notification.type,
                });
                return;
            }

            logger.info('📡 Channels determined for notification', {
                userId: notification.userId,
                type: notification.type,
                channels: effectiveChannels,
            });

            // ✅ Save notification to storage FIRST (Most important step)
            await this.saveNotificationHistory(notification, effectiveChannels);

            // Send via enabled channels (parallel processing)
            const channelPromises = [];
            
            if (effectiveChannels.includes(NotificationChannel.PUSH)) {
                channelPromises.push(this.sendPushNotification(notification, effectiveChannels));
            }
            
            // Future: Add email, SMS here
            // if (effectiveChannels.includes(NotificationChannel.EMAIL)) {
            //     channelPromises.push(this.sendEmailNotification(notification));
            // }

            const results = await Promise.allSettled(channelPromises);

            // Log channel results
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    logger.error('❌ Notification channel failed', {
                        notificationId: notification.id,
                        channelIndex: index,
                        error: result.reason,
                    });
                } else {
                    logger.debug('✅ Notification channel succeeded', {
                        notificationId: notification.id,
                        channelIndex: index,
                    });
                }
            });

            // Increment notification count for rate limiting
            await redisService.incrementNotificationCount(notification.userId);

            const duration = Date.now() - startTime;

            logger.info('🎉 Notification processed successfully', {
                id: notification.id,
                userId: notification.userId,
                type: notification.type,
                channels: effectiveChannels,
                duration: `${duration}ms`,
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('💥 Failed to process notification', {
                error: error instanceof Error ? error.message : error,
                notificationId: notification.id,
                userId: notification.userId,
                type: notification.type,
                duration: `${duration}ms`,
            });
            
            // Don't re-throw to prevent breaking the Kafka consumer
            // Just log the error
        }
    }

    private async sendPushNotification(
        notification: NotificationEvent,
        enabledChannels: NotificationChannel[]
    ): Promise<void> {
        if (!enabledChannels.includes(NotificationChannel.PUSH)) {
            return;
        }

        try {
            logger.debug('📱 Attempting push notification', {
                userId: notification.userId,
                notificationId: notification.id,
            });

            // Get user's device tokens
            const deviceTokens = await redisService.getUserDeviceTokens(notification.userId);

            if (deviceTokens.length === 0) {
                logger.info('📵 No device tokens found for user', {
                    userId: notification.userId,
                });
                return;
            }

            const activeTokens = deviceTokens
                .filter(token => token.isActive)
                .map(token => token.token);

            if (activeTokens.length === 0) {
                logger.info('📵 No active device tokens found for user', {
                    userId: notification.userId,
                    totalTokens: deviceTokens.length,
                });
                return;
            }

            logger.debug('📱 Sending push notification', {
                userId: notification.userId,
                tokenCount: activeTokens.length,
            });

            // Send push notification via Firebase
            const result = await firebaseService.sendNotification(activeTokens, notification);

            // Handle failed tokens
            if (result.failedTokens.length > 0) {
                logger.warn('⚠️ Some tokens failed', {
                    userId: notification.userId,
                    failedCount: result.failedTokens.length,
                    totalCount: activeTokens.length,
                });
                await this.handleFailedTokens(notification.userId, result.failedTokens, deviceTokens);
            }

            logger.info('📱 Push notification sent', {
                notificationId: notification.id,
                userId: notification.userId,
                totalTokens: activeTokens.length,
                success: result.success,
                failures: result.failure,
            });

        } catch (error) {
            logger.error('💥 Failed to send push notification', {
                error: error instanceof Error ? error.message : error,
                notificationId: notification.id,
                userId: notification.userId,
            });
            // Don't re-throw, just log
        }
    }

    private async handleFailedTokens(
        userId: string,
        failedTokens: string[],
        allTokens: DeviceToken[]
    ): Promise<void> {
        try {
            // Remove invalid tokens
            const removePromises = failedTokens.map(async (failedToken) => {
                const deviceToken = allTokens.find(token => token.token === failedToken);
                if (deviceToken) {
                    await redisService.removeDeviceToken(userId, deviceToken.deviceId);
                    logger.info('🗑️ Removed invalid device token', {
                        userId,
                        deviceId: deviceToken.deviceId,
                        platform: deviceToken.platform,
                    });
                }
            });

            await Promise.allSettled(removePromises);
        } catch (error) {
            logger.error('💥 Failed to handle failed tokens', { error, userId });
        }
    }

    private getEffectiveChannels(
        notification: NotificationEvent,
        preferences: UserNotificationPreferences | null
    ): NotificationChannel[] {
        if (!preferences) {
            // Default channels if no preferences set
            logger.debug('Using default channels (no preferences)', {
                defaultChannels: notification.channels,
            });
            return notification.channels;
        }

        const effectiveChannels: NotificationChannel[] = [];

        // Check global preferences
        if (preferences.pushEnabled && notification.channels.includes(NotificationChannel.PUSH)) {
            effectiveChannels.push(NotificationChannel.PUSH);
        }

        if (preferences.emailEnabled && notification.channels.includes(NotificationChannel.EMAIL)) {
            effectiveChannels.push(NotificationChannel.EMAIL);
        }

        if (preferences.smsEnabled && notification.channels.includes(NotificationChannel.SMS)) {
            effectiveChannels.push(NotificationChannel.SMS);
        }

        // Always include in-app notifications
        if (notification.channels.includes(NotificationChannel.IN_APP)) {
            effectiveChannels.push(NotificationChannel.IN_APP);
        }

        // Check type-specific preferences
        const typePreferences = preferences.channels[notification.type];
        if (typePreferences && typePreferences.length > 0) {
            const filtered = effectiveChannels.filter(channel => typePreferences.includes(channel));
            logger.debug('Applied type-specific channel preferences', {
                originalChannels: effectiveChannels,
                typePreferences,
                filteredChannels: filtered,
            });
            return filtered;
        }

        logger.debug('Using global channel preferences', {
            effectiveChannels,
            preferences: {
                push: preferences.pushEnabled,
                email: preferences.emailEnabled,
                sms: preferences.smsEnabled,
            },
        });

        return effectiveChannels;
    }

    private async saveNotificationHistory(
        notification: NotificationEvent,
        channels: NotificationChannel[]
    ): Promise<void> {
        try {
            logger.debug('💾 Saving notification to storage', {
                id: notification.id,
                userId: notification.userId,
                type: notification.type,
                channels,
            });

            // Save to Redis storage
            await redisService.saveNotification(notification);

            logger.info('✅ Notification saved to history', {
                id: notification.id,
                userId: notification.userId,
                type: notification.type,
                channels,
                sentAt: new Date().toISOString(),
            });
        } catch (error) {
            logger.error('💥 Failed to save notification history', {
                error: error instanceof Error ? error.message : error,
                notificationId: notification.id,
                userId: notification.userId,
            });
            throw error; // This is critical, so re-throw
        }
    }

    // Device management (giữ nguyên)
    async registerDevice(userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId: string): Promise<void> {
        try {
            const isValid = await firebaseService.validateToken(token);
            if (!isValid) {
                throw new Error('Invalid device token');
            }

            const deviceToken: DeviceToken = {
                userId,
                token,
                platform,
                deviceId,
                isActive: true,
                lastUsed: new Date(),
                createdAt: new Date(),
            };

            await redisService.saveDeviceToken(deviceToken);

            logger.info('Device registered successfully', {
                userId,
                deviceId,
                platform,
            });
        } catch (error) {
            logger.error('Failed to register device', { error, userId, deviceId });
            throw error;
        }
    }

    async unregisterDevice(userId: string, deviceId: string): Promise<void> {
        try {
            await redisService.removeDeviceToken(userId, deviceId);

            logger.info('Device unregistered successfully', {
                userId,
                deviceId,
            });
        } catch (error) {
            logger.error('Failed to unregister device', { error, userId, deviceId });
            throw error;
        }
    }

    // Preferences management (giữ nguyên)
    async updateUserPreferences(
        userId: string,
        updates: Partial<UserNotificationPreferences>
    ): Promise<UserNotificationPreferences> {
        try {
            let preferences = await redisService.getUserPreferences(userId);

            if (!preferences) {
                preferences = this.createDefaultPreferences(userId);
            }

            const updatedPreferences: UserNotificationPreferences = {
                ...preferences,
                ...updates,
                userId,
                updatedAt: new Date(),
            };

            await redisService.saveUserPreferences(updatedPreferences);

            logger.info('User preferences updated', {
                userId,
                updates: Object.keys(updates),
            });

            return updatedPreferences;
        } catch (error) {
            logger.error('Failed to update user preferences', { error, userId });
            throw error;
        }
    }

    private createDefaultPreferences(userId: string): UserNotificationPreferences {
        return {
            userId,
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: false,
            channels: {
                [NotificationEventType.WISHLIST_PRODUCT_PRICE_CHANGED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                [NotificationEventType.WISHLIST_PRODUCT_RESTOCKED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                [NotificationEventType.CART_ITEM_LOW_STOCK]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                [NotificationEventType.CART_ABANDONED]: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
                [NotificationEventType.PRODUCT_BACK_IN_STOCK]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                [NotificationEventType.CART_ITEM_ADDED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                [NotificationEventType.ORDER_CREATED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                [NotificationEventType.ORDER_CONFIRMED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                [NotificationEventType.ORDER_SHIPPED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                [NotificationEventType.ORDER_DELIVERED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                [NotificationEventType.ORDER_CANCELLED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
            },
            quietHours: {
                enabled: false,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            },
            frequency: {
                maxPerDay: 50, // Increase for testing
                batchDelay: 5,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}

export const notificationService = new NotificationService();