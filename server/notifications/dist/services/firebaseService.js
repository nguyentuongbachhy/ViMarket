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
exports.firebaseService = exports.FirebaseService = void 0;
// src/services/firebaseService.ts
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const logger = new logger_1.Logger('FirebaseService');
class FirebaseService {
    constructor() {
        this.initialized = false;
        this.initialize();
    }
    initialize() {
        try {
            if (!firebase_admin_1.default.apps.length) {
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert({
                        projectId: config_1.config.firebase.projectId,
                        privateKey: config_1.config.firebase.privateKey,
                        clientEmail: config_1.config.firebase.clientEmail,
                    }),
                    databaseURL: config_1.config.firebase.databaseUrl,
                });
            }
            this.initialized = true;
            logger.info('Firebase Admin SDK initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize Firebase Admin SDK', { error });
            throw error;
        }
    }
    sendNotification(deviceTokens, notification) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.initialized) {
                throw new Error('Firebase service not initialized');
            }
            if (deviceTokens.length === 0) {
                return { success: 0, failure: 0, failedTokens: [] };
            }
            try {
                const message = {
                    tokens: deviceTokens,
                    notification: {
                        title: notification.title,
                        body: notification.message,
                    },
                    data: Object.assign({ notificationId: notification.id, type: notification.type, userId: notification.userId, priority: notification.priority }, Object.fromEntries(Object.entries(notification.data).map(([key, value]) => [
                        key,
                        typeof value === 'string' ? value : JSON.stringify(value),
                    ]))),
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
                const response = yield firebase_admin_1.default.messaging().sendEachForMulticast(message);
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    var _a;
                    if (!resp.success) {
                        failedTokens.push(deviceTokens[idx]);
                        logger.warn('Failed to send notification to token', {
                            token: deviceTokens[idx],
                            error: (_a = resp.error) === null || _a === void 0 ? void 0 : _a.message,
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
            }
            catch (error) {
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
        });
    }
    validateToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield firebase_admin_1.default.messaging().send({
                    token,
                    data: { type: 'validation' },
                }, true); // dry run
                return true;
            }
            catch (error) {
                logger.warn('Invalid device token', { token, error });
                return false;
            }
        });
    }
    mapAndroidMessagePriority(priority) {
        return ['high', 'urgent'].includes(priority) ? 'high' : 'normal';
    }
    mapAndroidNotificationPriority(priority) {
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
    getAndroidChannelId(type) {
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
    isHealthy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Test Firebase connection by getting server timestamp
                const db = firebase_admin_1.default.database();
                yield db.ref('.info/serverTimeOffset').once('value');
                return true;
            }
            catch (error) {
                logger.error('Firebase health check failed', { error });
                return false;
            }
        });
    }
}
exports.FirebaseService = FirebaseService;
exports.firebaseService = new FirebaseService();
//# sourceMappingURL=firebaseService.js.map