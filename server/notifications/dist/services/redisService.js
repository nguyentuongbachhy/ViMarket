"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
// src/services/redisService.ts
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const ioredis_1 = __importDefault(require("ioredis"));
const logger = new logger_1.Logger('RedisService');
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = new ioredis_1.default({
            host: config_1.config.redis.host,
            port: config_1.config.redis.port,
            password: config_1.config.redis.password || undefined,
            db: config_1.config.redis.db,
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
    setupEventListeners() {
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
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.connect();
                yield this.client.ping();
                logger.info('Redis connected successfully');
            }
            catch (error) {
                logger.error('Failed to connect to Redis', { error });
                throw error;
            }
        });
    }
    // Device Token Management
    saveDeviceToken(deviceToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `device:${deviceToken.userId}:${deviceToken.deviceId}`;
                const data = Object.assign(Object.assign({}, deviceToken), { lastUsed: deviceToken.lastUsed.toISOString(), createdAt: deviceToken.createdAt.toISOString() });
                yield this.client.hmset(key, data);
                yield this.client.expire(key, 30 * 24 * 60 * 60); // 30 days
                // Add to user's device list
                const userDevicesKey = `user:${deviceToken.userId}:devices`;
                yield this.client.sadd(userDevicesKey, deviceToken.deviceId);
                yield this.client.expire(userDevicesKey, 30 * 24 * 60 * 60);
                logger.debug('Device token saved', {
                    userId: deviceToken.userId,
                    deviceId: deviceToken.deviceId,
                    platform: deviceToken.platform,
                });
            }
            catch (error) {
                logger.error('Failed to save device token', { error, deviceToken });
                throw error;
            }
        });
    }
    getUserDeviceTokens(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userDevicesKey = `user:${userId}:devices`;
                const deviceIds = yield this.client.smembers(userDevicesKey);
                if (deviceIds.length === 0) {
                    return [];
                }
                const tokens = [];
                for (const deviceId of deviceIds) {
                    const key = `device:${userId}:${deviceId}`;
                    const data = yield this.client.hgetall(key);
                    if (data && data.token && data.isActive === 'true') {
                        tokens.push({
                            userId: data.userId,
                            token: data.token,
                            platform: data.platform,
                            deviceId: data.deviceId,
                            isActive: data.isActive === 'true',
                            lastUsed: new Date(data.lastUsed),
                            createdAt: new Date(data.createdAt),
                        });
                    }
                }
                return tokens;
            }
            catch (error) {
                logger.error('Failed to get user device tokens', { error, userId });
                return [];
            }
        });
    }
    removeDeviceToken(userId, deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `device:${userId}:${deviceId}`;
                const userDevicesKey = `user:${userId}:devices`;
                yield Promise.all([
                    this.client.del(key),
                    this.client.srem(userDevicesKey, deviceId),
                ]);
                logger.debug('Device token removed', { userId, deviceId });
                return true;
            }
            catch (error) {
                logger.error('Failed to remove device token', { error, userId, deviceId });
                return false;
            }
        });
    }
    // User Preferences
    saveUserPreferences(preferences) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `preferences:${preferences.userId}`;
                const data = Object.assign(Object.assign({}, preferences), { channels: JSON.stringify(preferences.channels), quietHours: JSON.stringify(preferences.quietHours), frequency: JSON.stringify(preferences.frequency), createdAt: preferences.createdAt.toISOString(), updatedAt: preferences.updatedAt.toISOString() });
                yield this.client.hmset(key, data);
                yield this.client.expire(key, 7 * 24 * 60 * 60); // 7 days
                logger.debug('User preferences saved', { userId: preferences.userId });
            }
            catch (error) {
                logger.error('Failed to save user preferences', { error, preferences });
                throw error;
            }
        });
    }
    getUserPreferences(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `preferences:${userId}`;
                const data = yield this.client.hgetall(key);
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
            }
            catch (error) {
                logger.error('Failed to get user preferences', { error, userId });
                return null;
            }
        });
    }
    // Notification History and Rate Limiting
    canSendNotification(userId, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preferences = yield this.getUserPreferences(userId);
                if (!preferences) {
                    return true; // Allow if no preferences set
                }
                // Check daily limit
                const dailyKey = `rate:${userId}:${new Date().toISOString().split('T')[0]}`;
                const dailyCount = yield this.client.get(dailyKey);
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
            }
            catch (error) {
                logger.error('Failed to check notification rate limit', { error, userId, type });
                return true; // Allow on error
            }
        });
    }
    incrementNotificationCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dailyKey = `rate:${userId}:${new Date().toISOString().split('T')[0]}`;
                yield this.client.incr(dailyKey);
                yield this.client.expire(dailyKey, 24 * 60 * 60); // 24 hours
            }
            catch (error) {
                logger.error('Failed to increment notification count', { error, userId });
            }
        });
    }
    isInQuietHours(currentTime, quietHours) {
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        const [startHour, startMinute] = quietHours.startTime.split(':').map(Number);
        const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);
        const currentMinutes = currentHour * 60 + currentMinute;
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        if (startMinutes <= endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        }
        else {
            // Quiet hours span midnight
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }
    }
    // Deduplication
    isNotificationDuplicate(userId, type, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `dedup:${userId}:${type}:${productId || 'all'}`;
                const exists = yield this.client.exists(key);
                if (exists) {
                    return true;
                }
                // Set deduplication key with 1 hour expiry
                yield this.client.setex(key, 60 * 60, '1');
                return false;
            }
            catch (error) {
                logger.error('Failed to check notification duplication', { error, userId, type });
                return false; // Allow on error
            }
        });
    }
    isHealthy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.client.ping();
                return result === 'PONG' && this.isConnected;
            }
            catch (error) {
                return false;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.quit();
                this.isConnected = false;
                logger.info('Redis client disconnected');
            }
            catch (error) {
                logger.error('Error disconnecting Redis client', error);
            }
        });
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
//# sourceMappingURL=redisService.js.map