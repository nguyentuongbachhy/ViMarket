import { AuthenticatedRequest } from '@/middleware/auth';
import { Response } from 'express';
export declare class NotificationController {
    static registerDevice(req: AuthenticatedRequest, res: Response): Promise<void>;
    static unregisterDevice(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPreferences(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getDevices(req: AuthenticatedRequest, res: Response): Promise<void>;
    static testNotification(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=notificationController.d.ts.map