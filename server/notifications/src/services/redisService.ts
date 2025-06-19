// src/services/redisService.ts
import { config } from '@/config';
import {
    DeviceToken,
    NotificationEvent,
    NotificationEventType,
    UserNotificationPreferences
} from '@/types';
import { Logger } from '@/utils/logger';
import Redis from 'ioredis';

const logger = new Logger('RedisService');

export class RedisService {
    private client: Redis;
    private isConnected = false;

    constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password || undefined,
            db: config.redis.db,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            keyPrefix: 'notification:',
            connectTimeout: 10000,
            commandTimeout: 5000,
        });

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.client.on('connect', () => {
            logger.info('Redis client connecting...');
        });

        this.client.on('ready', () => {
            logger.info('Redis client ready');
            this.isConnected = true;
        });

        this.client.on('error', (error) => {
            logger.error('Redis client error', { error: error.message });
            this.isConnected = false;
        });

        this.client.on('close', () => {
            logger.warn('Redis client connection closed');
            this.isConnected = false;
        });
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            await this.client.ping();
            logger.info('Redis connected successfully');
        } catch (error) {
            logger.error('Failed to connect to Redis', { error });
            throw error;
        }
    }

    // ✅ NOTIFICATION OPERATIONS - COMPLETELY REWRITTEN
    async saveNotification(notification: NotificationEvent): Promise<void> {
        const startTime = Date.now();
        
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const userId = notification.userId;
            const notificationKey = `user:${userId}:notifications`;
            const unreadKey = `user:${userId}:unread_count`;
            
            // Prepare notification data for storage
            const notificationData = {
                id: notification.id,
                type: notification.type,
                userId: notification.userId,
                title: notification.title,
                message: notification.message,
                priority: notification.priority,
                isRead: notification.isRead,
                createdAt: notification.createdAt.toISOString(),
                data: JSON.stringify(notification.data || {}),
                channels: JSON.stringify(notification.channels || []),
                metadata: JSON.stringify(notification.metadata || {}),
            };

            // Use transaction for atomicity
            const pipeline = this.client.pipeline();
            
            // Add notification to sorted set (score = timestamp for ordering)
            const score = new Date(notification.createdAt).getTime();
            pipeline.zadd(notificationKey, score, JSON.stringify(notificationData));
            
            // Update unread count if notification is unread
            if (!notification.isRead) {
                pipeline.incr(unreadKey);
            }
            
            // Set expiration for both keys (30 days)
            const expireSeconds = 30 * 24 * 60 * 60;
            pipeline.expire(notificationKey, expireSeconds);
            pipeline.expire(unreadKey, expireSeconds);
            
            // Keep only latest 1000 notifications
            pipeline.zremrangebyrank(notificationKey, 0, -1001);
            
            // Execute transaction
            const results = await pipeline.exec();
            
            // Check for errors in pipeline results
            if (results) {
                for (let i = 0; i < results.length; i++) {
                    const [error, result] = results[i];
                    if (error) {
                        throw new Error(`Pipeline command ${i} failed: ${error.message}`);
                    }
                }
            }

            const duration = Date.now() - startTime;
            
            logger.info('✅ Notification saved to Redis successfully', {
                userId: notification.userId,
                notificationId: notification.id,
                type: notification.type,
                title: notification.title,
                isRead: notification.isRead,
                duration: `${duration}ms`,
                score,
            });

            // Verify the save operation
            await this.verifyNotificationSaved(userId, notification.id);

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('❌ Failed to save notification to Redis', {
                error: error instanceof Error ? error.message : error,
                userId: notification.userId,
                notificationId: notification.id,
                duration: `${duration}ms`,
                connected: this.isConnected,
            });
            throw error;
        }
    }

    private async verifyNotificationSaved(userId: string, notificationId: string): Promise<void> {
        try {
            const notificationKey = `user:${userId}:notifications`;
            const unreadKey = `user:${userId}:unread_count`;
            
            const [totalCount, unreadCount] = await Promise.all([
                this.client.zcard(notificationKey),
                this.client.get(unreadKey)
            ]);
            
            logger.debug('📊 Redis verification after save', {
                userId,
                notificationId,
                totalNotifications: totalCount,
                unreadCount: parseInt(unreadCount || '0'),
            });
        } catch (error) {
            logger.warn('Failed to verify notification save', { error, userId, notificationId });
        }
    }

    async getUserNotifications(
        userId: string, 
        limit: number = 20, 
        offset: number = 0
    ): Promise<NotificationEvent[]> {
        const startTime = Date.now();
        
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const key = `user:${userId}:notifications`;
            
            // Get notifications in reverse chronological order (newest first)
            const start = offset;
            const stop = offset + limit - 1;
            const rawNotifications = await this.client.zrevrange(key, start, stop);

            const notifications: NotificationEvent[] = [];
            
            for (const rawData of rawNotifications) {
                try {
                    const data = JSON.parse(rawData);
                    const notification: NotificationEvent = {
                        id: data.id,
                        type: data.type,
                        userId: data.userId,
                        title: data.title,
                        message: data.message,
                        priority: data.priority,
                        isRead: data.isRead === true || data.isRead === 'true',
                        createdAt: new Date(data.createdAt),
                        data: JSON.parse(data.data || '{}'),
                        channels: JSON.parse(data.channels || '[]'),
                        metadata: JSON.parse(data.metadata || '{}'),
                    };
                    notifications.push(notification);
                } catch (parseError) {
                    logger.error('Failed to parse notification data', { 
                        parseError, 
                        rawData: rawData.substring(0, 100) + '...',
                        userId 
                    });
                }
            }

            const duration = Date.now() - startTime;
            
            logger.debug('📥 Notifications retrieved from Redis', {
                userId,
                requestedLimit: limit,
                requestedOffset: offset,
                retrievedCount: notifications.length,
                duration: `${duration}ms`,
            });

            return notifications;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('❌ Failed to get notifications from Redis', {
                error: error instanceof Error ? error.message : error,
                userId,
                limit,
                offset,
                duration: `${duration}ms`,
                connected: this.isConnected,
            });
            return [];
        }
    }

    async getUnreadNotificationCount(userId: string): Promise<number> {
        try {
            if (!this.isConnected) {
                return 0;
            }

            const unreadKey = `user:${userId}:unread_count`;
            const count = await this.client.get(unreadKey);
            const unreadCount = parseInt(count || '0');
            
            logger.debug('📊 Unread count retrieved', { userId, unreadCount });
            
            return unreadCount;
        } catch (error) {
            logger.error('Failed to get unread notification count', { error, userId });
            return 0;
        }
    }

    async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const key = `user:${userId}:notifications`;
            const unreadKey = `user:${userId}:unread_count`;
            const notifications = await this.client.zrevrange(key, 0, -1);

            for (const data of notifications) {
                try {
                    const notification = JSON.parse(data);
                    if (notification.id === notificationId && !notification.isRead) {
                        // Update notification
                        notification.isRead = true;
                        
                        const pipeline = this.client.pipeline();
                        
                        // Remove old entry and add updated entry
                        pipeline.zrem(key, data);
                        const score = new Date(notification.createdAt).getTime();
                        pipeline.zadd(key, score, JSON.stringify(notification));
                        
                        // Decrease unread count
                        pipeline.decr(unreadKey);
                        
                        await pipeline.exec();

                        logger.info('✅ Notification marked as read', { userId, notificationId });
                        return true;
                    }
                } catch (parseError) {
                    logger.error('Failed to parse notification for mark read', { parseError, userId });
                }
            }

            logger.warn('Notification not found for mark as read', { userId, notificationId });
            return false;
        } catch (error) {
            logger.error('Failed to mark notification as read', { error, userId, notificationId });
            return false;
        }
    }

    async markAllNotificationsAsRead(userId: string): Promise<void> {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const key = `user:${userId}:notifications`;
            const unreadKey = `user:${userId}:unread_count`;
            const notifications = await this.client.zrevrange(key, 0, -1);

            const pipeline = this.client.pipeline();
            
            // Clear current notifications and unread count
            pipeline.del(key);
            pipeline.del(unreadKey);

            // Re-add all notifications as read
            for (const data of notifications) {
                try {
                    const notification = JSON.parse(data);
                    notification.isRead = true;
                    
                    const score = new Date(notification.createdAt).getTime();
                    pipeline.zadd(key, score, JSON.stringify(notification));
                } catch (parseError) {
                    logger.error('Failed to parse notification for mark all read', { parseError, userId });
                }
            }

            // Set expiration
            pipeline.expire(key, 30 * 24 * 60 * 60);
            
            await pipeline.exec();

            logger.info('✅ All notifications marked as read', { userId, count: notifications.length });
        } catch (error) {
            logger.error('Failed to mark all notifications as read', { error, userId });
            throw error;
        }
    }

    async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
        try {
            if (!this.isConnected) {
                throw new Error('Redis not connected');
            }

            const key = `user:${userId}:notifications`;
            const unreadKey = `user:${userId}:unread_count`;
            const notifications = await this.client.zrevrange(key, 0, -1);

            for (const data of notifications) {
                try {
                    const notification = JSON.parse(data);
                    if (notification.id === notificationId) {
                        const pipeline = this.client.pipeline();
                        
                        // Remove notification
                        pipeline.zrem(key, data);

                        // Decrease unread count if notification was unread
                        if (!notification.isRead) {
                            pipeline.decr(unreadKey);
                        }
                        
                        await pipeline.exec();

                        logger.info('✅ Notification deleted', { userId, notificationId });
                        return true;
                    }
                } catch (parseError) {
                    logger.error('Failed to parse notification for delete', { parseError, userId });
                }
            }

            logger.warn('Notification not found for deletion', { userId, notificationId });
            return false;
        } catch (error) {
            logger.error('Failed to delete notification', { error, userId, notificationId });
            return false;
        }
    }

    // ✅ IMPROVED DUPLICATE CHECK
    async isNotificationDuplicate(userId: string, type: NotificationEventType, productId?: string): Promise<boolean> {
        try {
            if (!this.isConnected) {
                return false; // Allow if Redis not connected
            }

            // ✅ SMART DUPLICATE DETECTION - DIFFERENT RULES FOR DIFFERENT TYPES
            let expirySeconds: number;
            let shouldCheck: boolean = true;

            switch (type) {
                case NotificationEventType.CART_ITEM_ADDED:
                    expirySeconds = 2 * 60; // 2 minutes - Allow same product again after 2 min
                    break;
                case NotificationEventType.CART_ABANDONED:
                    expirySeconds = 24 * 60 * 60; // 24 hours
                    break;
                case NotificationEventType.WISHLIST_PRODUCT_PRICE_CHANGED:
                    expirySeconds = 6 * 60 * 60; // 6 hours
                    break;
                case NotificationEventType.WISHLIST_PRODUCT_RESTOCKED:
                    expirySeconds = 12 * 60 * 60; // 12 hours
                    break;
                default:
                    expirySeconds = 60 * 60; // 1 hour for others
            }

            // ✅ FOR DEVELOPMENT: DISABLE DUPLICATE CHECK FOR CART_ITEM_ADDED
            if (process.env.NODE_ENV === 'development' && type === NotificationEventType.CART_ITEM_ADDED) {
                logger.debug('🔧 Development mode: Skipping duplicate check for cart.item.added');
                return false;
            }

            const key = `dedup:${userId}:${type}:${productId || 'all'}`;
            const exists = await this.client.exists(key);

            if (exists) {
                logger.debug('🔄 Duplicate notification detected', { 
                    userId, 
                    type, 
                    productId,
                    expirySeconds,
                    key
                });
                return true;
            }

            // Set deduplication key with appropriate expiry
            await this.client.setex(key, expirySeconds, Date.now().toString());
            
            logger.debug('✅ Duplicate check passed, key set', { 
                userId, 
                type, 
                productId,
                expirySeconds,
                key
            });
            
            return false;
        } catch (error) {
            logger.error('Failed to check notification duplication', { error, userId, type });
            return false; // Allow on error
        }
    }

    // ✅ DEBUG METHODS
    async debugUserNotifications(userId: string): Promise<any> {
        try {
            const notificationKey = `user:${userId}:notifications`;
            const unreadKey = `user:${userId}:unread_count`;
            
            const [totalCount, unreadCount, allNotifications] = await Promise.all([
                this.client.zcard(notificationKey),
                this.client.get(unreadKey),
                this.client.zrevrange(notificationKey, 0, -1)
            ]);

            return {
                userId,
                totalCount,
                unreadCount: parseInt(unreadCount || '0'),
                notifications: allNotifications.slice(0, 5).map(data => {
                    try {
                        const parsed = JSON.parse(data);
                        return {
                            id: parsed.id,
                            type: parsed.type,
                            title: parsed.title,
                            isRead: parsed.isRead,
                            createdAt: parsed.createdAt
                        };
                    } catch {
                        return { raw: data.substring(0, 100) };
                    }
                }),
                keys: {
                    notificationKey,
                    unreadKey
                }
            };
        } catch (error) {
            logger.error('Debug failed', { error, userId });
            return { error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    async clearUserNotifications(userId: string): Promise<void> {
        try {
            const notificationKey = `user:${userId}:notifications`;
            const unreadKey = `user:${userId}:unread_count`;
            
            await Promise.all([
                this.client.del(notificationKey),
                this.client.del(unreadKey)
            ]);
            
            logger.info('🗑️ User notifications cleared', { userId });
        } catch (error) {
            logger.error('Failed to clear user notifications', { error, userId });
            throw error;
        }
    }

    // Giữ nguyên các methods khác (Device tokens, Preferences, etc.)...
    async saveDeviceToken(deviceToken: DeviceToken): Promise<void> {
        try {
            const key = `device:${deviceToken.userId}:${deviceToken.deviceId}`;
            const data = {
                ...deviceToken,
                lastUsed: deviceToken.lastUsed.toISOString(),
                createdAt: deviceToken.createdAt.toISOString(),
            };

            await this.client.hmset(key, data);
            await this.client.expire(key, 30 * 24 * 60 * 60);

            const userDevicesKey = `user:${deviceToken.userId}:devices`;
            await this.client.sadd(userDevicesKey, deviceToken.deviceId);
            await this.client.expire(userDevicesKey, 30 * 24 * 60 * 60);

            logger.debug('Device token saved', {
                userId: deviceToken.userId,
                deviceId: deviceToken.deviceId,
                platform: deviceToken.platform,
            });
        } catch (error) {
            logger.error('Failed to save device token', { error, deviceToken });
            throw error;
        }
    }

    async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
        try {
            const userDevicesKey = `user:${userId}:devices`;
            const deviceIds = await this.client.smembers(userDevicesKey);

            if (deviceIds.length === 0) {
                return [];
            }

            const tokens: DeviceToken[] = [];
            for (const deviceId of deviceIds) {
                const key = `device:${userId}:${deviceId}`;
                const data = await this.client.hgetall(key);

                if (data && data.token && data.isActive === 'true') {
                    tokens.push({
                        userId: data.userId,
                        token: data.token,
                        platform: data.platform as 'ios' | 'android' | 'web',
                        deviceId: data.deviceId,
                        isActive: data.isActive === 'true',
                        lastUsed: new Date(data.lastUsed),
                        createdAt: new Date(data.createdAt),
                    });
                }
            }

            return tokens;
        } catch (error) {
            logger.error('Failed to get user device tokens', { error, userId });
            return [];
        }
    }

    async removeDeviceToken(userId: string, deviceId: string): Promise<boolean> {
        try {
            const key = `device:${userId}:${deviceId}`;
            const userDevicesKey = `user:${userId}:devices`;

            await Promise.all([
                this.client.del(key),
                this.client.srem(userDevicesKey, deviceId),
            ]);

            logger.debug('Device token removed', { userId, deviceId });
            return true;
        } catch (error) {
            logger.error('Failed to remove device token', { error, userId, deviceId });
            return false;
        }
    }

    async saveUserPreferences(preferences: UserNotificationPreferences): Promise<void> {
        try {
            const key = `preferences:${preferences.userId}`;
            const data = {
                ...preferences,
                channels: JSON.stringify(preferences.channels),
                quietHours: JSON.stringify(preferences.quietHours),
                frequency: JSON.stringify(preferences.frequency),
                createdAt: preferences.createdAt.toISOString(),
                updatedAt: preferences.updatedAt.toISOString(),
            };

            await this.client.hmset(key, data);
            await this.client.expire(key, 7 * 24 * 60 * 60);

            logger.debug('User preferences saved', { userId: preferences.userId });
        } catch (error) {
            logger.error('Failed to save user preferences', { error, preferences });
            throw error;
        }
    }

    async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
        try {
            const key = `preferences:${userId}`;
            const data = await this.client.hgetall(key);

            if (!data || Object.keys(data).length === 0) {
                return null;
            }

            return {
                userId: data.userId,
                pushEnabled: data.pushEnabled === 'true',
                emailEnabled: data.emailEnabled === 'true',
                smsEnabled: data.smsEnabled === 'true',
                channels: JSON.parse(data.channels || '{}'),
                quietHours: JSON.parse(data.quietHours || '{"enabled":false}'),
                frequency: JSON.parse(data.frequency || '{"maxPerDay":10,"batchDelay":5}'),
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            };
        } catch (error) {
            logger.error('Failed to get user preferences', { error, userId });
            return null;
        }
    }

    async canSendNotification(userId: string, type: NotificationEventType): Promise<boolean> {
        try {
            const preferences = await this.getUserPreferences(userId);
            if (!preferences) {
                return true;
            }

            const dailyKey = `rate:${userId}:${new Date().toISOString().split('T')[0]}`;
            const dailyCount = await this.client.get(dailyKey);

            if (dailyCount && parseInt(dailyCount) >= preferences.frequency.maxPerDay) {
                logger.debug('Daily notification limit reached', { userId, dailyCount });
                return false;
            }

            if (preferences.quietHours.enabled) {
                const now = new Date();
                const currentTime = now.toTimeString().substring(0, 5);

                if (this.isInQuietHours(currentTime, preferences.quietHours)) {
                    logger.debug('In quiet hours', { userId, currentTime });
                    return false;
                }
            }

            return true;
        } catch (error) {
            logger.error('Failed to check notification rate limit', { error, userId, type });
            return true;
        }
    }

    async incrementNotificationCount(userId: string): Promise<void> {
        try {
            const dailyKey = `rate:${userId}:${new Date().toISOString().split('T')[0]}`;
            await this.client.incr(dailyKey);
            await this.client.expire(dailyKey, 24 * 60 * 60);
        } catch (error) {
            logger.error('Failed to increment notification count', { error, userId });
        }
    }

    private isInQuietHours(currentTime: string, quietHours: any): boolean {
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const [startHour, startMinute] = quietHours.startTime.split(':').map(Number);
        const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMinute;
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        if (startMinutes <= endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        } else {
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG' && this.isConnected;
        } catch (error) {
            return false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Redis client disconnected');
        } catch (error) {
            logger.error('Error disconnecting Redis client', error);
        }
    }
}

export const redisService = new RedisService();