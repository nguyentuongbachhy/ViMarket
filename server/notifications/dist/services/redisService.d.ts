import { DeviceToken, NotificationEventType, UserNotificationPreferences } from '@/types';
export declare class RedisService {
    private client;
    private isConnected;
    constructor();
    private setupEventListeners;
    connect(): Promise<void>;
    saveDeviceToken(deviceToken: DeviceToken): Promise<void>;
    getUserDeviceTokens(userId: string): Promise<DeviceToken[]>;
    removeDeviceToken(userId: string, deviceId: string): Promise<boolean>;
    saveUserPreferences(preferences: UserNotificationPreferences): Promise<void>;
    getUserPreferences(userId: string): Promise<UserNotificationPreferences | null>;
    canSendNotification(userId: string, type: NotificationEventType): Promise<boolean>;
    incrementNotificationCount(userId: string): Promise<void>;
    private isInQuietHours;
    isNotificationDuplicate(userId: string, type: NotificationEventType, productId?: string): Promise<boolean>;
    isHealthy(): Promise<boolean>;
    disconnect(): Promise<void>;
}
export declare const redisService: RedisService;
//# sourceMappingURL=redisService.d.ts.map