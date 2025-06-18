import { NotificationController } from '@/controllers/notificationController';
import { AuthMiddleware } from '@/middleware/auth';
import { Router } from 'express';

const router: Router = Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Device management
router.post('/devices', NotificationController.registerDevice);
router.delete('/devices/:deviceId', NotificationController.unregisterDevice);
router.get('/devices', NotificationController.getDevices);

// Preferences management  
router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

// Development only
router.post('/test', NotificationController.testNotification);

export { router as notificationRoutes };
