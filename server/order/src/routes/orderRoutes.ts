import { AuthenticatedRequest, AuthMiddleware } from '@/middleware/auth';
import { orderService } from '@/services/orderService';
import { CheckoutRequest, CreateOrderFromCartRequest, CreateOrderRequest } from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { Router } from 'express';

const router: Router = Router();
const logger = new Logger('OrderRoutes');

router.post('/checkout', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const userEmail = req.user!.email;
        const request: CheckoutRequest = req.body;

        if (!request.shippingAddress || !request.paymentMethod) {
            ResponseUtils.badRequest(res, 'Shipping address and payment method are required');
            return;
        }

        if (!request.useCart && (!request.items || request.items.length === 0)) {
            ResponseUtils.badRequest(res, 'Items are required when not using cart');
            return;
        }

        // ✅ Truyền email từ JWT
        const order = await orderService.checkout(userId, userEmail, request);

        ResponseUtils.success(res, order, 'Checkout completed successfully! Order confirmation email has been sent.', 201);
    } catch (error: any) {
        logger.error('Checkout failed', { error, userId: req.user?.userId });
        ResponseUtils.error(res, error.message || 'Checkout failed');
    }
});

// Các routes khác giữ nguyên...
router.post('/create', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const request: CreateOrderRequest = req.body;

        if (!request.items || !request.shippingAddress || !request.paymentMethod) {
            ResponseUtils.badRequest(res, 'Missing required fields');
            return;
        }

        const order = await orderService.createOrder(userId, request);
        ResponseUtils.success(res, order, 'Order created successfully', 201);
    } catch (error: any) {
        logger.error('Failed to create order', { error, userId: req.user?.userId });
        ResponseUtils.error(res, error.message || 'Failed to create order');
    }
});

router.post('/from-cart', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const request: CreateOrderFromCartRequest = req.body;

        if (!request.shippingAddress || !request.paymentMethod) {
            ResponseUtils.badRequest(res, 'Missing required fields');
            return;
        }

        const order = await orderService.createOrderFromCart(userId, request);
        ResponseUtils.success(res, order, 'Order created from cart successfully', 201);
    } catch (error: any) {
        logger.error('Failed to create order from cart', { error, userId: req.user?.userId });
        ResponseUtils.error(res, error.message || 'Failed to create order from cart');
    }
});

router.get('/my-orders', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const limit = parseInt(req.query.limit as string) || 20;

        const orders = await orderService.getUserOrders(userId, limit);
        ResponseUtils.success(res, orders, 'Orders retrieved successfully');
    } catch (error: any) {
        logger.error('Failed to get user orders', { error, userId: req.user?.userId });
        ResponseUtils.error(res, 'Failed to retrieve orders');
    }
});

router.get('/:orderId', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user!.userId;

        const order = await orderService.getOrderById(orderId);

        if (order.userId !== userId && !req.user?.roles?.includes('admin')) {
            ResponseUtils.forbidden(res, 'Access denied');
            return;
        }

        ResponseUtils.success(res, order, 'Order retrieved successfully');
    } catch (error: any) {
        logger.error('Failed to get order', { error, orderId: req.params.orderId });

        if (error.message === 'Order not found') {
            ResponseUtils.notFound(res, 'Order not found');
            return;
        }

        ResponseUtils.error(res, 'Failed to retrieve order');
    }
});

router.post('/:orderId/cancel', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user!.userId;

        const order = await orderService.cancelOrder(orderId, userId);
        ResponseUtils.success(res, order, 'Order cancelled successfully');
    } catch (error: any) {
        logger.error('Failed to cancel order', { error, orderId: req.params.orderId, userId: req.user?.userId });

        if (error.message === 'Order not found') {
            ResponseUtils.notFound(res, 'Order not found');
            return;
        }

        if (error.message.includes('Unauthorized') || error.message.includes('Cannot cancel')) {
            ResponseUtils.badRequest(res, error.message);
            return;
        }

        ResponseUtils.error(res, 'Failed to cancel order');
    }
});

export { router as orderRoutes };
