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
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
// src/services/notificationService.ts
const types_1 = require("@/types");
const logger_1 = require("@/utils/logger");
const firebaseService_1 = require("./firebaseService");
const redisService_1 = require("./redisService");
const logger = new logger_1.Logger('NotificationService');
class NotificationService {
    sendNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger.info('Processing notification', {
                    id: notification.id,
                    type: notification.type,
                    userId: notification.userId,
                    priority: notification.priority,
                });
                // Skip special user IDs (BROADCAST, ADMIN) for now
                if (['BROADCAST', 'ADMIN'].includes(notification.userId)) {
                    logger.info('Skipping special user ID notification', {
                        userId: notification.userId,
                        type: notification.type,
                    });
                    return;
                }
                // Check if user can receive notification
                const canSend = yield redisService_1.redisService.canSendNotification(notification.userId, notification.type);
                if (!canSend) {
                    logger.info('Notification blocked by rate limiting or preferences', {
                        userId: notification.userId,
                        type: notification.type,
                    });
                    return;
                }
                // Check for duplicates
                const isDuplicate = yield redisService_1.redisService.isNotificationDuplicate(notification.userId, notification.type, notification.metadata.productId);
                if (isDuplicate) {
                    logger.info('Duplicate notification skipped', {
                        userId: notification.userId,
                        type: notification.type,
                        productId: notification.metadata.productId,
                    });
                    return;
                }
                // Get user preferences
                const preferences = yield redisService_1.redisService.getUserPreferences(notification.userId);
                const effectiveChannels = this.getEffectiveChannels(notification, preferences);
                if (effectiveChannels.length === 0) {
                    logger.info('No enabled channels for notification', {
                        userId: notification.userId,
                        type: notification.type,
                    });
                    return;
                }
                // Send via enabled channels
                const results = yield Promise.allSettled([
                    this.sendPushNotification(notification, effectiveChannels),
                    // Could add email, SMS here in the future
                ]);
                // Log results
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        logger.error('Notification channel failed', {
                            notificationId: notification.id,
                            channelIndex: index,
                            error: result.reason,
                        });
                    }
                });
                // Increment notification count
                yield redisService_1.redisService.incrementNotificationCount(notification.userId);
                // Save to history (could be implemented with a database)
                yield this.saveNotificationHistory(notification, effectiveChannels);
                logger.info('Notification processed successfully', {
                    id: notification.id,
                    userId: notification.userId,
                    channels: effectiveChannels,
                });
            }
            catch (error) {
                logger.error('Failed to process notification', {
                    error,
                    notificationId: notification.id,
                    userId: notification.userId,
                });
            }
        });
    }
    sendPushNotification(notification, enabledChannels) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!enabledChannels.includes(types_1.NotificationChannel.PUSH)) {
                return;
            }
            try {
                // Get user's device tokens
                const deviceTokens = yield redisService_1.redisService.getUserDeviceTokens(notification.userId);
                if (deviceTokens.length === 0) {
                    logger.info('No device tokens found for user', {
                        userId: notification.userId,
                    });
                    return;
                }
                const activeTokens = deviceTokens
                    .filter(token => token.isActive)
                    .map(token => token.token);
                if (activeTokens.length === 0) {
                    logger.info('No active device tokens found for user', {
                        userId: notification.userId,
                    });
                    return;
                }
                // Send push notification
                const result = yield firebaseService_1.firebaseService.sendNotification(activeTokens, notification);
                // Handle failed tokens
                if (result.failedTokens.length > 0) {
                    yield this.handleFailedTokens(notification.userId, result.failedTokens, deviceTokens);
                }
                logger.info('Push notification sent', {
                    notificationId: notification.id,
                    userId: notification.userId,
                    totalTokens: activeTokens.length,
                    success: result.success,
                    failures: result.failure,
                });
            }
            catch (error) {
                logger.error('Failed to send push notification', {
                    error,
                    notificationId: notification.id,
                    userId: notification.userId,
                });
            }
        });
    }
    handleFailedTokens(userId, failedTokens, allTokens) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Remove invalid tokens
                for (const failedToken of failedTokens) {
                    const deviceToken = allTokens.find(token => token.token === failedToken);
                    if (deviceToken) {
                        yield redisService_1.redisService.removeDeviceToken(userId, deviceToken.deviceId);
                        logger.info('Removed invalid device token', {
                            userId,
                            deviceId: deviceToken.deviceId,
                            platform: deviceToken.platform,
                        });
                    }
                }
            }
            catch (error) {
                logger.error('Failed to handle failed tokens', { error, userId });
            }
        });
    }
    getEffectiveChannels(notification, preferences) {
        if (!preferences) {
            // Default channels if no preferences set
            return notification.channels;
        }
        const effectiveChannels = [];
        // Check global preferences
        if (preferences.pushEnabled && notification.channels.includes(types_1.NotificationChannel.PUSH)) {
            effectiveChannels.push(types_1.NotificationChannel.PUSH);
        }
        if (preferences.emailEnabled && notification.channels.includes(types_1.NotificationChannel.EMAIL)) {
            effectiveChannels.push(types_1.NotificationChannel.EMAIL);
        }
        if (preferences.smsEnabled && notification.channels.includes(types_1.NotificationChannel.SMS)) {
            effectiveChannels.push(types_1.NotificationChannel.SMS);
        }
        // Always include in-app notifications
        if (notification.channels.includes(types_1.NotificationChannel.IN_APP)) {
            effectiveChannels.push(types_1.NotificationChannel.IN_APP);
        }
        // Check type-specific preferences
        const typePreferences = preferences.channels[notification.type];
        if (typePreferences && typePreferences.length > 0) {
            return effectiveChannels.filter(channel => typePreferences.includes(channel));
        }
        return effectiveChannels;
    }
    saveNotificationHistory(notification, channels) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // This could be implemented with a database
                // For now, we'll just log it
                logger.debug('Notification saved to history', {
                    id: notification.id,
                    userId: notification.userId,
                    type: notification.type,
                    channels,
                    sentAt: new Date().toISOString(),
                });
            }
            catch (error) {
                logger.error('Failed to save notification history', {
                    error,
                    notificationId: notification.id,
                });
            }
        });
    }
    // Device management
    registerDevice(userId, token, platform, deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate token with Firebase
                const isValid = yield firebaseService_1.firebaseService.validateToken(token);
                if (!isValid) {
                    throw new Error('Invalid device token');
                }
                const deviceToken = {
                    userId,
                    token,
                    platform,
                    deviceId,
                    isActive: true,
                    lastUsed: new Date(),
                    createdAt: new Date(),
                };
                yield redisService_1.redisService.saveDeviceToken(deviceToken);
                logger.info('Device registered successfully', {
                    userId,
                    deviceId,
                    platform,
                });
            }
            catch (error) {
                logger.error('Failed to register device', { error, userId, deviceId });
                throw error;
            }
        });
    }
    unregisterDevice(userId, deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield redisService_1.redisService.removeDeviceToken(userId, deviceId);
                logger.info('Device unregistered successfully', {
                    userId,
                    deviceId,
                });
            }
            catch (error) {
                logger.error('Failed to unregister device', { error, userId, deviceId });
                throw error;
            }
        });
    }
    // Preferences management
    updateUserPreferences(userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let preferences = yield redisService_1.redisService.getUserPreferences(userId);
                if (!preferences) {
                    preferences = this.createDefaultPreferences(userId);
                }
                // Apply updates
                const updatedPreferences = Object.assign(Object.assign(Object.assign({}, preferences), updates), { userId, updatedAt: new Date() });
                yield redisService_1.redisService.saveUserPreferences(updatedPreferences);
                logger.info('User preferences updated', {
                    userId,
                    updates: Object.keys(updates),
                });
                return updatedPreferences;
            }
            catch (error) {
                logger.error('Failed to update user preferences', { error, userId });
                throw error;
            }
        });
    }
    createDefaultPreferences(userId) {
        return {
            userId,
            pushEnabled: true,
            emailEnabled: true,
            smsEnabled: false,
            channels: {
                [types_1.NotificationEventType.WISHLIST_PRODUCT_PRICE_CHANGED]: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.IN_APP],
                [types_1.NotificationEventType.WISHLIST_PRODUCT_RESTOCKED]: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.IN_APP],
                [types_1.NotificationEventType.CART_ITEM_LOW_STOCK]: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.IN_APP],
                [types_1.NotificationEventType.CART_ABANDONED]: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.EMAIL],
                [types_1.NotificationEventType.PRODUCT_BACK_IN_STOCK]: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.IN_APP],
            },
            quietHours: {
                enabled: false,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'UTC',
            },
            frequency: {
                maxPerDay: 10,
                batchDelay: 5,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map