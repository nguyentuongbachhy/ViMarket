// src/services/redisService.ts
import { config } from '@/config';
import {
    DeviceToken,
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

    // Device Token Management
    async saveDeviceToken(deviceToken: DeviceToken): Promise<void> {
        try {
            const key = `device:${deviceToken.userId}:${deviceToken.deviceId}`;
            const data = {
                ...deviceToken,
                lastUsed: deviceToken.lastUsed.toISOString(),
                createdAt: deviceToken.createdAt.toISOString(),
            };

            await this.client.hmset(key, data);
            await this.client.expire(key, 30 * 24 * 60 * 60); // 30 days

            // Add to user's device list
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

    // User Preferences
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
            await this.client.expire(key, 7 * 24 * 60 * 60); // 7 days

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

    // Notification History and Rate Limiting
    async canSendNotification(userId: string, type: NotificationEventType): Promise<boolean> {
        try {
            const preferences = await this.getUserPreferences(userId);
            if (!preferences) {
                return true; // Allow if no preferences set
            }

            // Check daily limit
            const dailyKey = `rate:${userId}:${new Date().toISOString().split('T')[0]}`;
            const dailyCount = await this.client.get(dailyKey);

            if (dailyCount && parseInt(dailyCount) >= preferences.frequency.maxPerDay) {
                logger.debug('Daily notification limit reached', { userId, dailyCount });
                return false;
            }

            // Check quiet hours
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
            return true; // Allow on error
        }
    }

    async incrementNotificationCount(userId: string): Promise<void> {
        try {
            const dailyKey = `rate:${userId}:${new Date().toISOString().split('T')[0]}`;
            await this.client.incr(dailyKey);
            await this.client.expire(dailyKey, 24 * 60 * 60); // 24 hours
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
            // Quiet hours span midnight
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }
    }

    // Deduplication
    async isNotificationDuplicate(userId: string, type: NotificationEventType, productId?: string): Promise<boolean> {
        try {
            const key = `dedup:${userId}:${type}:${productId || 'all'}`;
            const exists = await this.client.exists(key);

            if (exists) {
                return true;
            }

            // Set deduplication key with 1 hour expiry
            await this.client.setex(key, 60 * 60, '1');
            return false;
        } catch (error) {
            logger.error('Failed to check notification duplication', { error, userId, type });
            return false; // Allow on error
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