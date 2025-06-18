"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const notificationController_1 = require("@/controllers/notificationController");
const auth_1 = require("@/middleware/auth");
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.notificationRoutes = router;
// All routes require authentication
router.use(auth_1.AuthMiddleware.authenticate);
// Device management
router.post('/devices', notificationController_1.NotificationController.registerDevice);
router.delete('/devices/:deviceId', notificationController_1.NotificationController.unregisterDevice);
router.get('/devices', notificationController_1.NotificationController.getDevices);
// Preferences management  
router.get('/preferences', notificationController_1.NotificationController.getPreferences);
router.put('/preferences', notificationController_1.NotificationController.updatePreferences);
// Development only
router.post('/test', notificationController_1.NotificationController.testNotification);
//# sourceMappingURL=notificationRoutes.js.map