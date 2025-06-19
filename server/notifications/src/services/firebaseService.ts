// src/services/firebaseService.ts
import { config } from '@/config';
import { NotificationEvent } from '@/types';
import { Logger } from '@/utils/logger';
import admin from 'firebase-admin';

const logger = new Logger('FirebaseService');

export class FirebaseService {
    private initialized = false;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        try {
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: config.firebase.projectId,
                        privateKey: config.firebase.privateKey,
                        clientEmail: config.firebase.clientEmail,
                    }),
                    databaseURL: config.firebase.databaseUrl,
                });
            }

            this.initialized = true;
            logger.info('Firebase Admin SDK initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Firebase Admin SDK', { error });
            throw error;
        }
    }

    async sendNotification(
        deviceTokens: string[],
        notification: NotificationEvent
    ): Promise<{ success: number; failure: number; failedTokens: string[] }> {
        if (!this.initialized) {
            throw new Error('Firebase service not initialized');
        }

        if (deviceTokens.length === 0) {
            return { success: 0, failure: 0, failedTokens: [] };
        }

        try {
            const message: admin.messaging.MulticastMessage = {
                tokens: deviceTokens,
                notification: {
                    title: notification.title,
                    body: notification.message,
                },
                data: {
                    notificationId: notification.id,
                    type: notification.type,
                    userId: notification.userId,
                    priority: notification.priority,
                    ...Object.fromEntries(
                        Object.entries(notification.data).map(([key, value]) => [
                            key,
                            typeof value === 'string' ? value : JSON.stringify(value),
                        ])
                    ),
                },
                android: {
                    priority: this.mapAndroidMessagePriority(notification.priority),
                    notification: {
                        channelId: this.getAndroidChannelId(notification.type),
                        priority: this.mapAndroidNotificationPriority(notification.priority),
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: notification.title,
                                body: notification.message,
                            },
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
                webpush: {
                    notification: {
                        title: notification.title,
                        body: notification.message,
                        icon: '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        requireInteraction: notification.priority === 'urgent',
                    },
                },
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(deviceTokens[idx]);
                    logger.warn('Failed to send notification to token', {
                        token: deviceTokens[idx],
                        error: resp.error?.message,
                    });
                }
            });

            logger.info('Batch notification sent', {
                notificationId: notification.id,
                totalTokens: deviceTokens.length,
                successCount: response.successCount,
                failureCount: response.failureCount,
            });

            return {
                success: response.successCount,
                failure: response.failureCount,
                failedTokens,
            };
        } catch (error) {
            logger.error('Failed to send batch notification', {
                error,
                notificationId: notification.id,
                tokenCount: deviceTokens.length,
            });
            return {
                success: 0,
                failure: deviceTokens.length,
                failedTokens: deviceTokens,
            };
        }
    }

    async validateToken(token: string): Promise<boolean> {
        try {
            await admin.messaging().send({
                token,
                data: { type: 'validation' },
            }, true); // dry run
            return true;
        } catch (error) {
            logger.warn('Invalid device token', { token, error });
            return false;
        }
    }

    private mapAndroidMessagePriority(priority: string): 'high' | 'normal' {
        return ['high', 'urgent'].includes(priority) ? 'high' : 'normal';
    }

    private mapAndroidNotificationPriority(priority: string): 'high' | 'min' | 'low' | 'default' | 'max' {
        // Android notification priority uses: 'default', 'min', 'low', 'high', 'max'
        switch (priority) {
            case 'urgent':
                return 'max';
            case 'high':
                return 'high';
            case 'low':
                return 'low';
            default:
                return 'default';
        }
    }

    private getAndroidChannelId(type: string): string {
        switch (type) {
            case 'wishlist.product.price.changed':
                return 'price_alerts';
            case 'wishlist.product.restocked':
                return 'stock_alerts';
            case 'cart.item.low.stock':
                return 'cart_alerts';
            case 'cart.abandoned':
                return 'cart_reminders';
            case 'inventory.low.stock':
                return 'inventory_alerts';
            default:
                return 'general';
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            // Test Firebase connection by getting server timestamp
            const db = admin.database();
            await db.ref('.info/serverTimeOffset').once('value');
            return true;
        } catch (error) {
            logger.error('Firebase health check failed', { error });
            return false;
        }
    }
}

export const firebaseService = new FirebaseService();