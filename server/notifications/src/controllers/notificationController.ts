// src/controllers/notificationController.ts
import { AuthenticatedRequest } from '@/middleware/auth';
import { notificationService } from '@/services/notificationService';
import { redisService } from '@/services/redisService';
import {
    RegisterDeviceRequest,
    UpdatePreferencesRequest,
    NotificationEvent,
    NotificationEventType,
    NotificationPriority,
    NotificationChannel
} from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { Response } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('NotificationController');

const registerDeviceSchema = Joi.object({
    token: Joi.string().required().min(10),
    platform: Joi.string().valid('ios', 'android', 'web').required(),
    deviceId: Joi.string().required().min(1),
});

const updatePreferencesSchema = Joi.object({
    pushEnabled: Joi.boolean(),
    emailEnabled: Joi.boolean(),
    smsEnabled: Joi.boolean(),
    channels: Joi.object().pattern(
        Joi.string(),
        Joi.array().items(Joi.string().valid('push', 'email', 'sms', 'in_app'))
    ),
    quietHours: Joi.object({
        enabled: Joi.boolean(),
        startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        timezone: Joi.string(),
    }),
    frequency: Joi.object({
        maxPerDay: Joi.number().integer().min(1).max(100),
        batchDelay: Joi.number().integer().min(1).max(60),
    }),
});

export class NotificationController {
    static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
        const startTime = Date.now();
        
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100
            const offset = Math.max(parseInt(req.query.offset as string) || 0, 0); // Min 0

            logger.info('🔍 Getting notifications request', { 
                userId, 
                limit, 
                offset,
                userAgent: req.get('User-Agent')?.substring(0, 50) 
            });

            // Get notifications and unread count in parallel
            const [notifications, unreadCount] = await Promise.all([
                redisService.getUserNotifications(userId, limit, offset),
                redisService.getUnreadNotificationCount(userId)
            ]);

            const duration = Date.now() - startTime;

            logger.info('✅ Notifications retrieved successfully', {
                userId,
                count: notifications.length,
                unreadCount,
                limit,
                offset,
                duration: `${duration}ms`
            });

            ResponseUtils.success(res, {
                notifications,
                unreadCount,
                pagination: {
                    limit,
                    offset,
                    hasMore: notifications.length === limit,
                    total: notifications.length + offset // Approximate
                }
            }, 'Notifications retrieved successfully');

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('❌ Failed to get notifications', {
                error: error instanceof Error ? error.message : error,
                userId: req.user?.userId,
                duration: `${duration}ms`
            });
            ResponseUtils.error(res, 'Failed to retrieve notifications');
        }
    }

    static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const notificationId = req.params.notificationId;
            if (!notificationId) {
                ResponseUtils.badRequest(res, 'Notification ID is required');
                return;
            }

            logger.info('📖 Marking notification as read', { userId, notificationId });

            const success = await redisService.markNotificationAsRead(userId, notificationId);
            
            if (success) {
                logger.info('✅ Notification marked as read successfully', { userId, notificationId });
                ResponseUtils.success(res, null, 'Notification marked as read');
            } else {
                logger.warn('⚠️ Notification not found for mark as read', { userId, notificationId });
                ResponseUtils.notFound(res, 'Notification not found');
            }

        } catch (error) {
            logger.error('❌ Failed to mark notification as read', {
                error: error instanceof Error ? error.message : error,
                userId: req.user?.userId,
                notificationId: req.params.notificationId,
            });
            ResponseUtils.error(res, 'Failed to mark notification as read');
        }
    }

    static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            logger.info('📖 Marking all notifications as read', { userId });

            await redisService.markAllNotificationsAsRead(userId);
            
            logger.info('✅ All notifications marked as read', { userId });
            ResponseUtils.success(res, null, 'All notifications marked as read');

        } catch (error) {
            logger.error('❌ Failed to mark all notifications as read', {
                error: error instanceof Error ? error.message : error,
                userId: req.user?.userId,
            });
            ResponseUtils.error(res, 'Failed to mark all notifications as read');
        }
    }

    static async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const notificationId = req.params.notificationId;
            if (!notificationId) {
                ResponseUtils.badRequest(res, 'Notification ID is required');
                return;
            }

            logger.info('🗑️ Deleting notification', { userId, notificationId });

            const success = await redisService.deleteNotification(userId, notificationId);
            
            if (success) {
                logger.info('✅ Notification deleted successfully', { userId, notificationId });
                ResponseUtils.success(res, null, 'Notification deleted successfully');
            } else {
                logger.warn('⚠️ Notification not found for deletion', { userId, notificationId });
                ResponseUtils.notFound(res, 'Notification not found');
            }

        } catch (error) {
            logger.error('❌ Failed to delete notification', {
                error: error instanceof Error ? error.message : error,
                userId: req.user?.userId,
                notificationId: req.params.notificationId,
            });
            ResponseUtils.error(res, 'Failed to delete notification');
        }
    }

    // ✅ THÊM DEBUG ENDPOINTS
    static async debugNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            logger.info('🔧 Debug request for user notifications', { userId });

            const debugInfo = await redisService.debugUserNotifications(userId);
            
            ResponseUtils.success(res, debugInfo, 'Debug information retrieved');

        } catch (error) {
            logger.error('❌ Failed to get debug information', {
                error: error instanceof Error ? error.message : error,
                userId: req.user?.userId,
            });
            ResponseUtils.error(res, 'Failed to get debug information');
        }
    }

    static async clearNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            // Only allow in development
            if (process.env.NODE_ENV !== 'development') {
                ResponseUtils.forbidden(res, 'Clear notifications only available in development');
                return;
            }

            logger.info('🗑️ Clearing all notifications for user', { userId });

            await redisService.clearUserNotifications(userId);
            
            ResponseUtils.success(res, null, 'All notifications cleared');

        } catch (error) {
            logger.error('❌ Failed to clear notifications', {
                error: error instanceof Error ? error.message : error,
                userId: req.user?.userId,
            });
            ResponseUtils.error(res, 'Failed to clear notifications');
        }
    }

    static async createTestNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            // Only allow in development
            if (process.env.NODE_ENV !== 'development') {
                ResponseUtils.forbidden(res, 'Test notifications only available in development');
                return;
            }

            const { type = 'cart.item.added', productId = 'test-product' } = req.body;

            logger.info('🧪 Creating test notification', { userId, type, productId });

            const testNotification: NotificationEvent = {
                id: uuidv4(),
                type: type as NotificationEventType,
                userId,
                title: '🧪 Test Notification',
                message: `Test notification of type: ${type}`,
                data: {
                    isTest: true,
                    productId,
                    timestamp: new Date().toISOString(),
                },
                priority: NotificationPriority.NORMAL,
                channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                isRead: false,
                createdAt: new Date(),
                metadata: {
                    source: 'test',
                    productId,
                    timestamp: new Date().toISOString(),
                },
            };

            // Save directly to Redis for testing
            await redisService.saveNotification(testNotification);
            
            ResponseUtils.success(res, testNotification, 'Test notification created successfully');

        } catch (error) {
            logger.error('❌ Failed to create test notification', {
                error: error instanceof Error ? error.message : error,
                userId: req.user?.userId,
            });
            ResponseUtils.error(res, 'Failed to create test notification');
        }
    }

    // Giữ nguyên các methods khác...
    static async registerDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const { error, value } = registerDeviceSchema.validate(req.body);
            if (error) {
                ResponseUtils.badRequest(res, error.details[0].message);
                return;
            }

            const { token, platform, deviceId }: RegisterDeviceRequest = value;

            await notificationService.registerDevice(userId, token, platform, deviceId);

            ResponseUtils.success(res, null, 'Device registered successfully');
        } catch (error) {
            logger.error('Failed to register device', {
                error,
                userId: req.user?.userId,
                body: req.body,
            });

            if (error instanceof Error) {
                if (error.message.includes('Invalid device token')) {
                    ResponseUtils.badRequest(res, 'Invalid device token');
                } else {
                    ResponseUtils.error(res, error.message);
                }
            } else {
                ResponseUtils.error(res, 'Failed to register device');
            }
        }
    }

    static async unregisterDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const deviceId = req.params.deviceId;
            if (!deviceId) {
                ResponseUtils.badRequest(res, 'Device ID is required');
                return;
            }

            await notificationService.unregisterDevice(userId, deviceId);

            ResponseUtils.success(res, null, 'Device unregistered successfully');
        } catch (error) {
            logger.error('Failed to unregister device', {
                error,
                userId: req.user?.userId,
                deviceId: req.params.deviceId,
            });

            ResponseUtils.error(res, 'Failed to unregister device');
        }
    }

    static async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const preferences = await redisService.getUserPreferences(userId);

            if (!preferences) {
                const defaultPreferences = await notificationService.updateUserPreferences(userId, {});
                ResponseUtils.success(res, defaultPreferences, 'Default preferences created');
                return;
            }

            ResponseUtils.success(res, preferences, 'Preferences retrieved successfully');
        } catch (error) {
            logger.error('Failed to get preferences', {
                error,
                userId: req.user?.userId,
            });

            ResponseUtils.error(res, 'Failed to retrieve preferences');
        }
    }

    static async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const { error, value } = updatePreferencesSchema.validate(req.body);
            if (error) {
                ResponseUtils.badRequest(res, error.details[0].message);
                return;
            }

            const updates: UpdatePreferencesRequest = value;

            const updatedPreferences = await notificationService.updateUserPreferences(userId, updates);

            ResponseUtils.success(res, updatedPreferences, 'Preferences updated successfully');
        } catch (error) {
            logger.error('Failed to update preferences', {
                error,
                userId: req.user?.userId,
                body: req.body,
            });

            ResponseUtils.error(res, 'Failed to update preferences');
        }
    }

    static async getDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const devices = await redisService.getUserDeviceTokens(userId);

            const sanitizedDevices = devices.map(device => ({
                deviceId: device.deviceId,
                platform: device.platform,
                isActive: device.isActive,
                lastUsed: device.lastUsed,
                createdAt: device.createdAt,
            }));

            ResponseUtils.success(res, sanitizedDevices, 'Devices retrieved successfully');
        } catch (error) {
            logger.error('Failed to get devices', {
                error,
                userId: req.user?.userId,
            });

            ResponseUtils.error(res, 'Failed to retrieve devices');
        }
    }

    static async testNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            if (process.env.NODE_ENV !== 'development') {
                ResponseUtils.forbidden(res, 'Test notifications only available in development');
                return;
            }

            const testNotification: NotificationEvent = {
                id: `test-${Date.now()}`,
                type: NotificationEventType.CART_ITEM_ADDED,
                userId,
                title: 'Test Notification 🧪',
                message: 'This is a test notification from the notification service',
                data: {
                    isTest: true,
                    timestamp: new Date().toISOString(),
                },
                priority: NotificationPriority.NORMAL,
                channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                isRead: false,
                createdAt: new Date(),
                metadata: {
                    source: 'notification-service',
                    timestamp: new Date().toISOString(),
                },
            };

            await notificationService.sendNotification(testNotification);

            ResponseUtils.success(res, null, 'Test notification sent successfully');
        } catch (error) {
            logger.error('Failed to send test notification', {
                error,
                userId: req.user?.userId,
            });

            ResponseUtils.error(res, 'Failed to send test notification');
        }
    }
}