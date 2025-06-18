import { NotificationEvent } from '@/types';
export declare class FirebaseService {
    private initialized;
    constructor();
    private initialize;
    sendNotification(deviceTokens: string[], notification: NotificationEvent): Promise<{
        success: number;
        failure: number;
        failedTokens: string[];
    }>;
    validateToken(token: string): Promise<boolean>;
    private mapAndroidMessagePriority;
    private mapAndroidNotificationPriority;
    private getAndroidChannelId;
    isHealthy(): Promise<boolean>;
}
export declare const firebaseService: FirebaseService;
//# sourceMappingURL=firebaseService.d.ts.map