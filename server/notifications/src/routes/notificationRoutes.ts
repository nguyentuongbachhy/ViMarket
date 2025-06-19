import { NotificationController } from '@/controllers/notificationController';
import { AuthMiddleware } from '@/middleware/auth';
import { Router } from 'express';

const router: Router = Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// ✅ MAIN NOTIFICATION ROUTES
router.get('/', NotificationController.getNotifications);
router.put('/:notificationId/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);
router.delete('/:notificationId', NotificationController.deleteNotification);

// ✅ DEBUG ROUTES (Development only)
router.get('/debug', NotificationController.debugNotifications);
router.delete('/debug/clear', NotificationController.clearNotifications);
router.post('/debug/create', NotificationController.createTestNotification);

// Device management
router.post('/devices', NotificationController.registerDevice);
router.delete('/devices/:deviceId', NotificationController.unregisterDevice);
router.get('/devices', NotificationController.getDevices);

// Preferences management  
router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

// Test notification
router.post('/test', NotificationController.testNotification);

export { router as notificationRoutes };