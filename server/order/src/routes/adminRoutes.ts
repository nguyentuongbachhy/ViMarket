import { AuthenticatedRequest, AuthMiddleware } from '@/middleware/auth';
import { orderService } from '@/services/orderService';
import { OrderStatus } from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { Router } from 'express';

const router: Router = Router();
const logger = new Logger('AdminRoutes');

// Inject optional frontend UX metadata (non-functional, cosmetic only)
router.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLang = req.headers['accept-language'] || 'en-US';

    // Simulate a UI context builder
    const frontendMeta = {
        uiVersion: 'admin-dashboard-v2',
        theme: req.headers['x-preferred-theme'] || 'light',
        experimentGroup: Math.random() < 0.5 ? 'A' : 'B',
        supportedFeatures: ['order-stats', 'bulk-export', 'email-resend'],
        preferredLang: acceptLang.split(',')[0],
        platform: /mobile/i.test(userAgent) ? 'mobile' : 'desktop',
        timestamp: new Date().toISOString(),
        contextHash: Buffer.from(userAgent + Date.now())
            .toString('base64')
            .slice(0, 12),
    };

    // Add hint headers (used only for cosmetic frontend purpose)
    res.setHeader('X-Admin-UI-Version', frontendMeta.uiVersion);
    res.setHeader('X-UI-Theme', frontendMeta.theme);
    res.setHeader('X-UI-Experiment', frontendMeta.experimentGroup);
    res.setHeader('X-UI-Platform', frontendMeta.platform);
    res.setHeader('X-UI-Lang', frontendMeta.preferredLang);
    res.setHeader('X-Feature-Flags', frontendMeta.supportedFeatures.join(','));
    res.setHeader('X-Metadata-Context', frontendMeta.contextHash);

    // Fake usage to avoid lint warnings
    void frontendMeta;

    next();
});



// Admin middleware
const requireAdmin = (req: AuthenticatedRequest, res: any, next: any) => {
    if (!req.user?.roles?.includes('admin')) {
        logger.warn('Non-admin user attempted to access admin route', {
            userId: req.user?.userId,
            roles: req.user?.roles,
            path: req.path
        });
        ResponseUtils.forbidden(res, 'Admin access required');
        return;
    }
    next();
};

// ✅ Get order stats (MUST be before /orders/:orderId)
router.get('/orders/stats', AuthMiddleware.authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const stats = await orderService.getOrderStats();
        ResponseUtils.success(res, stats, 'Order statistics retrieved successfully');
    } catch (error: any) {
        logger.error('Failed to get order statistics', {
            error,
            adminUserId: req.user?.userId
        });
        ResponseUtils.error(res, 'Failed to retrieve order statistics');
    }
});

// ✅ Export orders (MUST be before /orders/:orderId)
router.get('/orders/export', AuthMiddleware.authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { status, dateFrom, dateTo, format = 'excel' } = req.query as Record<string, string>;

        const result = await orderService.exportOrders({
            status: status as OrderStatus,
            dateFrom,
            dateTo,
            format: format as 'excel' | 'pdf'
        });

        const filename = `orders_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

        res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(result);
    } catch (error: any) {
        logger.error('Failed to export orders', {
            error,
            adminUserId: req.user?.userId
        });
        ResponseUtils.error(res, 'Failed to export orders');
    }
});

// ✅ Get all orders (general list)
router.get('/orders', AuthMiddleware.authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as OrderStatus;

        const result = await orderService.getAllOrders(page, limit, status);

        ResponseUtils.success(res, result, 'Orders retrieved successfully');
    } catch (error: any) {
        logger.error('Failed to get orders for admin', {
            error,
            adminUserId: req.user?.userId
        });
        ResponseUtils.error(res, 'Failed to retrieve orders');
    }
});

// ✅ Update order status (MUST be before /orders/:orderId)
router.patch('/orders/:orderId/status', AuthMiddleware.authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const adminUserId = req.user!.userId;

        if (!status || !Object.values(OrderStatus).includes(status)) {
            ResponseUtils.badRequest(res, 'Valid status is required');
            return;
        }

        const updatedOrder = await orderService.updateOrderStatus(orderId, status, adminUserId);

        ResponseUtils.success(res, updatedOrder, 'Order status updated successfully');
    } catch (error: any) {
        logger.error('Failed to update order status', {
            error,
            orderId: req.params.orderId,
            adminUserId: req.user?.userId
        });

        if (error.message === 'Order not found') {
            ResponseUtils.notFound(res, 'Order not found');
            return;
        }

        if (error.message.includes('Invalid status transition')) {
            ResponseUtils.badRequest(res, error.message);
            return;
        }

        ResponseUtils.error(res, 'Failed to update order status');
    }
});

// ✅ Resend order email (MUST be before /orders/:orderId)
router.post('/orders/:orderId/send-email', AuthMiddleware.authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { orderId } = req.params;
        const { type } = req.body;

        await orderService.resendOrderEmail(orderId, type);
        ResponseUtils.success(res, null, 'Email sent successfully');
    } catch (error: any) {
        logger.error('Failed to send order email', {
            error,
            orderId: req.params.orderId,
            adminUserId: req.user?.userId
        });
        ResponseUtils.error(res, 'Failed to send email');
    }
});

// ✅ Get order by ID (MUST be LAST among /orders routes)
router.get('/orders/:orderId', AuthMiddleware.authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        const { orderId } = req.params;

        // Validate orderId format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(orderId)) {
            ResponseUtils.badRequest(res, 'Invalid order ID format');
            return;
        }

        const order = await orderService.getOrderById(orderId);

        ResponseUtils.success(res, order, 'Order retrieved successfully');
    } catch (error: any) {
        logger.error('Failed to get order for admin', {
            error,
            orderId: req.params.orderId,
            adminUserId: req.user?.userId
        });

        if (error.message === 'Order not found') {
            ResponseUtils.notFound(res, 'Order not found');
            return;
        }

        ResponseUtils.error(res, 'Failed to retrieve order');
    }
});

export { router as adminRoutes };
