import { cartClient } from '@/clients/cartClient';
import { productClient } from '@/clients/productClient';
import { orderRepository } from '@/database/repositories/orderRepository';
import { CheckoutRequest, CreateOrderFromCartRequest, CreateOrderRequest, Order, OrderStatus, PaymentStatus } from '@/types';
import { Logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from './emailService';

const logger = new Logger('OrderService');


export class OrderService {
    async checkout(userId: string, userEmail: string, request: CheckoutRequest): Promise<Order> {
        logger.info('Starting checkout process', {
            userId,
            userEmail,
            useCart: request.useCart,
            itemCount: request.items?.length || 0
        });

        try {
            let order: Order;

            if (request.useCart) {
                order = await this.createOrderFromCart(userId, {
                    shippingAddress: request.shippingAddress,
                    paymentMethod: request.paymentMethod,
                    notes: request.notes
                });
            } else {
                if (!request.items || request.items.length === 0) {
                    throw new Error('Items are required when not using cart');
                }

                order = await this.createOrder(userId, {
                    items: request.items,
                    shippingAddress: request.shippingAddress,
                    paymentMethod: request.paymentMethod,
                    notes: request.notes
                });
            }

            // ✅ Gửi email xác nhận (async, không block)
            this.sendOrderConfirmationEmail(userEmail, order);

            logger.info('Checkout completed successfully', {
                orderId: order.id,
                userId,
                userEmail,
                totalAmount: order.totalAmount
            });

            return order;
        } catch (error) {
            logger.error('Checkout failed', { error, userId, userEmail });
            throw error;
        }
    }

    // 1. Tạo order từ items
    async createOrder(userId: string, request: CreateOrderRequest): Promise<Order> {
        logger.info('Creating order', { userId, itemCount: request.items.length });

        // Validate products
        const productIds = request.items.map(item => item.productId);
        const products = await productClient.getProductsBatch(productIds);
        const productMap = new Map(products.map((p: any) => [p.id, p]));

        // Build order items
        let totalAmount = 0;
        const orderItems = request.items.map(item => {
            const product = productMap.get(item.productId);
            if (!product) throw new Error(`Product not found: ${item.productId}`);

            const totalPrice = product.price * item.quantity;
            totalAmount += totalPrice;

            return {
                id: uuidv4(),
                orderId: '',
                productId: item.productId,
                productName: product.name,
                imageUrl: this.getImageUrl(product),
                price: product.price,
                quantity: item.quantity,
                totalPrice
            };
        });

        // Create order
        const order = await orderRepository.createOrder({
            userId,
            totalAmount,
            shippingAddress: request.shippingAddress,
            paymentMethod: request.paymentMethod,
            notes: request.notes,
            items: orderItems
        });

        // Process payment
        await this.processPayment(order);

        logger.info('Order created', { orderId: order.id, totalAmount });
        return order;
    }

    // 2. Tạo order từ cart
    async createOrderFromCart(userId: string, request: CreateOrderFromCartRequest): Promise<Order> {
        logger.info('Creating order from cart', { userId });

        // Get cart
        const cartData = await cartClient.getCart(userId);
        if (!cartData.items || cartData.items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Build order items from cart
        let totalAmount = 0;
        const orderItems = cartData.items.map((cartItem: any) => {
            totalAmount += cartItem.total_price;
            return {
                id: uuidv4(),
                orderId: '',
                productId: cartItem.product_id,
                productName: cartItem.product.name,
                imageUrl: this.getImageUrl(cartItem.product),
                price: cartItem.product.price,
                quantity: cartItem.quantity,
                totalPrice: cartItem.total_price
            };
        });

        // Create order
        const order = await orderRepository.createOrder({
            userId,
            totalAmount,
            shippingAddress: request.shippingAddress,
            paymentMethod: request.paymentMethod,
            notes: request.notes,
            items: orderItems
        });

        // Clear cart and process payment
        await Promise.all([
            cartClient.clearCart(userId, 'Order created'),
            this.processPayment(order)
        ]);

        logger.info('Order from cart created', { orderId: order.id, totalAmount });
        return order;
    }

    // 3. Lấy order by ID
    async getOrderById(orderId: string): Promise<Order> {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');
        return order;
    }

    // 4. Lấy orders của user
    async getUserOrders(userId: string, limit: number = 20): Promise<Order[]> {
        return orderRepository.getOrdersByUserId(userId, limit);
    }

    // 5. Cancel order
    async cancelOrder(orderId: string, userId: string): Promise<Order> {
        const order = await this.getOrderById(orderId);

        if (order.userId !== userId) {
            throw new Error('Unauthorized');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new Error('Cannot cancel order');
        }

        await orderRepository.updateOrderStatus(orderId, OrderStatus.CANCELLED);

        return this.getOrderById(orderId);
    }

    // ✅ Private helper: Gửi email
    private async sendOrderConfirmationEmail(userEmail: string, order: Order): Promise<void> {
        try {
            await emailService.sendOrderConfirmation(userEmail, order);
            logger.info('Order confirmation email sent', {
                orderId: order.id,
                userEmail
            });
        } catch (error) {
            logger.error('Failed to send confirmation email', {
                error,
                userEmail,
                orderId: order.id
            });
            // Không throw error để không làm fail checkout
        }
    }

    // Helper methods
    private getImageUrl(product: any): string {
        if (product.images && product.images.length > 0) {
            return product.images[0].url || '';
        }
        return '';
    }

    private async processPayment(order: Order): Promise<void> {
        // Mock payment - always success for simplicity
        await new Promise(resolve => setTimeout(resolve, 1000));

        await Promise.all([
            orderRepository.updatePaymentStatus(order.id, PaymentStatus.PAID),
            orderRepository.updateOrderStatus(order.id, OrderStatus.CONFIRMED)
        ]);
    }
}

export const orderService = new OrderService();