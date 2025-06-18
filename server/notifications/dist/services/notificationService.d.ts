import { NotificationEvent, UserNotificationPreferences } from '@/types';
export declare class NotificationService {
    sendNotification(notification: NotificationEvent): Promise<void>;
    private sendPushNotification;
    private handleFailedTokens;
    private getEffectiveChannels;
    private saveNotificationHistory;
    registerDevice(userId: string, token: string, platform: 'ios' | 'android' | 'web', deviceId: string): Promise<void>;
    unregisterDevice(userId: string, deviceId: string): Promise<void>;
    updateUserPreferences(userId: string, updates: Partial<UserNotificationPreferences>): Promise<UserNotificationPreferences>;
    private createDefaultPreferences;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notificationService.d.ts.map