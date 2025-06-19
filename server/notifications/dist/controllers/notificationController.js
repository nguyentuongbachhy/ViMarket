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
exports.NotificationController = void 0;
const notificationService_1 = require("@/services/notificationService");
const redisService_1 = require("@/services/redisService");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const joi_1 = __importDefault(require("joi"));
// Phần còn lại giữ nguyên như cũ
const logger = new logger_1.Logger('NotificationController');
const registerDeviceSchema = joi_1.default.object({
    token: joi_1.default.string().required().min(10),
    platform: joi_1.default.string().valid('ios', 'android', 'web').required(),
    deviceId: joi_1.default.string().required().min(1),
});
const updatePreferencesSchema = joi_1.default.object({
    pushEnabled: joi_1.default.boolean(),
    emailEnabled: joi_1.default.boolean(),
    smsEnabled: joi_1.default.boolean(),
    channels: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.array().items(joi_1.default.string().valid('push', 'email', 'sms', 'in_app'))),
    quietHours: joi_1.default.object({
        enabled: joi_1.default.boolean(),
        startTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        timezone: joi_1.default.string(),
    }),
    frequency: joi_1.default.object({
        maxPerDay: joi_1.default.number().integer().min(1).max(100),
        batchDelay: joi_1.default.number().integer().min(1).max(60),
    }),
});
class NotificationController {
    static registerDevice(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const { error, value } = registerDeviceSchema.validate(req.body);
                if (error) {
                    response_1.ResponseUtils.badRequest(res, error.details[0].message);
                    return;
                }
                const { token, platform, deviceId } = value;
                yield notificationService_1.notificationService.registerDevice(userId, token, platform, deviceId);
                response_1.ResponseUtils.success(res, null, 'Device registered successfully');
            }
            catch (error) {
                logger.error('Failed to register device', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    body: req.body,
                });
                if (error instanceof Error) {
                    if (error.message.includes('Invalid device token')) {
                        response_1.ResponseUtils.badRequest(res, 'Invalid device token');
                    }
                    else {
                        response_1.ResponseUtils.error(res, error.message);
                    }
                }
                else {
                    response_1.ResponseUtils.error(res, 'Failed to register device');
                }
            }
        });
    }
    static unregisterDevice(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const deviceId = req.params.deviceId;
                if (!deviceId) {
                    response_1.ResponseUtils.badRequest(res, 'Device ID is required');
                    return;
                }
                yield notificationService_1.notificationService.unregisterDevice(userId, deviceId);
                response_1.ResponseUtils.success(res, null, 'Device unregistered successfully');
            }
            catch (error) {
                logger.error('Failed to unregister device', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    deviceId: req.params.deviceId,
                });
                response_1.ResponseUtils.error(res, 'Failed to unregister device');
            }
        });
    }
    static getPreferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const preferences = yield redisService_1.redisService.getUserPreferences(userId);
                if (!preferences) {
                    // Return default preferences
                    const defaultPreferences = yield notificationService_1.notificationService.updateUserPreferences(userId, {});
                    response_1.ResponseUtils.success(res, defaultPreferences, 'Default preferences created');
                    return;
                }
                response_1.ResponseUtils.success(res, preferences, 'Preferences retrieved successfully');
            }
            catch (error) {
                logger.error('Failed to get preferences', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                });
                response_1.ResponseUtils.error(res, 'Failed to retrieve preferences');
            }
        });
    }
    static updatePreferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const { error, value } = updatePreferencesSchema.validate(req.body);
                if (error) {
                    response_1.ResponseUtils.badRequest(res, error.details[0].message);
                    return;
                }
                const updates = value;
                const updatedPreferences = yield notificationService_1.notificationService.updateUserPreferences(userId, updates);
                response_1.ResponseUtils.success(res, updatedPreferences, 'Preferences updated successfully');
            }
            catch (error) {
                logger.error('Failed to update preferences', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    body: req.body,
                });
                response_1.ResponseUtils.error(res, 'Failed to update preferences');
            }
        });
    }
    static getDevices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const devices = yield redisService_1.redisService.getUserDeviceTokens(userId);
                // Remove sensitive token information
                const sanitizedDevices = devices.map(device => ({
                    deviceId: device.deviceId,
                    platform: device.platform,
                    isActive: device.isActive,
                    lastUsed: device.lastUsed,
                    createdAt: device.createdAt,
                }));
                response_1.ResponseUtils.success(res, sanitizedDevices, 'Devices retrieved successfully');
            }
            catch (error) {
                logger.error('Failed to get devices', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                });
                response_1.ResponseUtils.error(res, 'Failed to retrieve devices');
            }
        });
    }
    static testNotification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                // Only allow in development
                if (process.env.NODE_ENV !== 'development') {
                    response_1.ResponseUtils.forbidden(res, 'Test notifications only available in development');
                    return;
                }
                const testNotification = {
                    id: `test-${Date.now()}`,
                    type: 'test.notification',
                    userId,
                    title: 'Test Notification 🧪',
                    message: 'This is a test notification from the notification service',
                    data: {
                        isTest: true,
                        timestamp: new Date().toISOString(),
                    },
                    priority: 'normal',
                    channels: ['push', 'in_app'],
                    metadata: {
                        source: 'notification-service',
                        timestamp: new Date().toISOString(),
                    },
                };
                yield notificationService_1.notificationService.sendNotification(testNotification);
                response_1.ResponseUtils.success(res, null, 'Test notification sent successfully');
            }
            catch (error) {
                logger.error('Failed to send test notification', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                });
                response_1.ResponseUtils.error(res, 'Failed to send test notification');
            }
        });
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notificationController.js.map