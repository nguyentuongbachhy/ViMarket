// src/controllers/notificationController.ts
import { AuthenticatedRequest } from '@/middleware/auth'; // Import từ middleware thay vì types
import { notificationService } from '@/services/notificationService';
import { redisService } from '@/services/redisService';
import {
    RegisterDeviceRequest,
    UpdatePreferencesRequest
} from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { Response } from 'express';
import Joi from 'joi';

// Phần còn lại giữ nguyên như cũ
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
                // Return default preferences
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

            // Remove sensitive token information
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

            // Only allow in development
            if (process.env.NODE_ENV !== 'development') {
                ResponseUtils.forbidden(res, 'Test notifications only available in development');
                return;
            }

            const testNotification = {
                id: `test-${Date.now()}`,
                type: 'test.notification' as any,
                userId,
                title: 'Test Notification 🧪',
                message: 'This is a test notification from the notification service',
                data: {
                    isTest: true,
                    timestamp: new Date().toISOString(),
                },
                priority: 'normal' as any,
                channels: ['push', 'in_app'] as any,
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