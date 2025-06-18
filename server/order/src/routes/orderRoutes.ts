import { AuthenticatedRequest, AuthMiddleware } from '@/middleware/auth';
import { orderService } from '@/services/orderService';
import { CheckoutRequest, CreateOrderFromCartRequest, CreateOrderRequest } from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { Router } from 'express';

const router: Router = Router();
const logger = new Logger('OrderRoutes');

// ✅ Main checkout endpoint
router.post('/checkout', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const userEmail = req.user!.email;
        const request: CheckoutRequest = req.body;

        const order = await orderService.checkout(userId, userEmail, request);
        ResponseUtils.success(res, order, 'Checkout completed successfully!', 201);
    } catch (error: any) {
        logger.error('Checkout failed', { error, userId: req.user?.userId });
        ResponseUtils.error(res, error.message || 'Checkout failed');
    }
});

// ✅ Create order from items
router.post('/create', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const request: CreateOrderRequest = req.body;

        const order = await orderService.createOrder(userId, request);
        ResponseUtils.success(res, order, 'Order created successfully', 201);
    } catch (error: any) {
        logger.error('Failed to create order', { error, userId: req.user?.userId });
        ResponseUtils.error(res, error.message || 'Failed to create order');
    }
});

// ✅ Create order from cart
router.post('/from-cart', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const request: CreateOrderFromCartRequest = req.body;

        const order = await orderService.createOrderFromCart(userId, request);
        ResponseUtils.success(res, order, 'Order created from cart successfully', 201);
    } catch (error: any) {
        logger.error('Failed to create order from cart', { error, userId: req.user?.userId });
        ResponseUtils.error(res, error.message || 'Failed to create order from cart');
    }
});

// ✅ Get user orders
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

// ✅ Get order by ID
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

// ✅ Cancel order
router.post('/:orderId/cancel', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user!.userId;

        const order = await orderService.cancelOrder(orderId, userId);
        ResponseUtils.success(res, order, 'Order cancelled successfully');
    } catch (error: any) {
        logger.error('Failed to cancel order', { error, orderId: req.params.orderId });
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

// ✅ Check user purchase
router.get('/check-purchase/:productId', AuthMiddleware.authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user!.userId;

        const hasPurchased = await orderService.hasUserPurchasedProduct(userId, productId);
        ResponseUtils.success(res, { hasPurchased, productId, userId }, 'Purchase check completed');
    } catch (error: any) {
        logger.error('Failed to check user purchase', { error, productId: req.params.productId });
        ResponseUtils.error(res, 'Failed to check purchase status');
    }
});

export { router as orderRoutes };
