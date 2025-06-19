import { productGrpcClient } from '@/grpc/productClient';
import { CartExpirationItem } from '@/types';
import { Logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { CartExpirationEvent, cartKafkaService } from './kafkaService';
import { redisService } from './redisService';

const logger = new Logger('CartExpirationScheduler');

export class CartExpirationScheduler {
    private interval: NodeJS.Timeout | null = null;
    private isRunning = false;
    private readonly EXPIRATION_WARNING_DAYS = parseInt(
        process.env.CART_EXPIRATION_WARNING_DAYS || '7'
    );
    private readonly CHECK_INTERVAL = parseInt(
        process.env.CART_EXPIRATION_CHECK_INTERVAL || '86400000' // 24 hours
    );

    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Cart expiration scheduler is already running');
            return;
        }

        try {
            this.isRunning = true;

            // Run initial check
            await this.checkExpiringCarts();

            // Schedule periodic checks
            this.interval = setInterval(async () => {
                try {
                    await this.checkExpiringCarts();
                } catch (error) {
                    logger.error('Error in scheduled cart expiration check', error);
                }
            }, this.CHECK_INTERVAL);

            logger.info('Cart expiration scheduler started successfully', {
                warningDays: this.EXPIRATION_WARNING_DAYS,
                checkInterval: `${this.CHECK_INTERVAL}ms`,
            });
        } catch (error) {
            logger.error('Failed to start cart expiration scheduler', error);
            this.isRunning = false;
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        logger.info('Cart expiration scheduler stopped');
    }

    private async checkExpiringCarts(): Promise<void> {
        try {
            logger.info('Starting cart expiration check');

            const now = new Date();
            const warningDate = new Date(
                now.getTime() + this.EXPIRATION_WARNING_DAYS * 24 * 60 * 60 * 1000
            );

            // Get all cart keys from Redis
            const cartKeys = await this.getCartKeys();
            logger.info(`Found ${cartKeys.length} carts to check`);

            let processedCount = 0;
            let sentNotifications = 0;

            for (const cartKey of cartKeys) {
                try {
                    await this.processCartExpiration(cartKey, now, warningDate);
                    processedCount++;
                } catch (error) {
                    logger.error('Error processing cart expiration', {
                        error,
                        cartKey,
                    });
                }
            }

            logger.info('Cart expiration check completed', {
                totalCarts: cartKeys.length,
                processedCarts: processedCount,
                sentNotifications,
            });
        } catch (error) {
            logger.error('Failed to check expiring carts', error);
        }
    }

    private async getCartKeys(): Promise<string[]> {
        try {
            // Scan for cart keys with pattern
            const stream = redisService['client'].scanStream({
                match: 'cart:*',
                count: 100,
            });

            const keys: string[] = [];
            for await (const resultKeys of stream) {
                keys.push(...resultKeys);
            }

            return keys;
        } catch (error) {
            logger.error('Failed to get cart keys from Redis', error);
            return [];
        }
    }

    private async processCartExpiration(
        cartKey: string,
        now: Date,
        warningDate: Date
    ): Promise<void> {
        try {
            // Extract userId from cart key (assuming format: ecommerce:cart:hashedUserId)
            const userId = await this.getUserIdFromCartKey(cartKey);
            if (!userId) {
                return;
            }

            const cart = await redisService.getCart(userId);
            if (!cart || cart.items.length === 0) {
                return;
            }

            const expiresAt = new Date(cart.expiresAt);
            const daysUntilExpiration = Math.ceil(
                (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            );

            // Only send notification if cart expires within warning period
            if (daysUntilExpiration <= this.EXPIRATION_WARNING_DAYS && daysUntilExpiration > 0) {
                // Check if we already sent notification today
                const notificationKey = `cart_expiration_notification:${userId}:${daysUntilExpiration}`;
                const alreadySent = await redisService['client'].get(notificationKey);

                if (!alreadySent) {
                    await this.sendExpirationNotification(cart, daysUntilExpiration);

                    // Mark as sent for today
                    await redisService['client'].setex(notificationKey, 24 * 60 * 60, '1');
                }
            }
        } catch (error) {
            logger.error('Error processing cart expiration', {
                error,
                cartKey,
            });
        }
    }

    private async getUserIdFromCartKey(cartKey: string): Promise<string | null> {
        try {
            // Get userId from cart data since we can't reverse the hash
            const cartData = await redisService['client'].hget(cartKey, 'userId');
            return cartData;
        } catch (error) {
            logger.error('Failed to get userId from cart key', {
                error,
                cartKey,
            });
            return null;
        }
    }

    private async sendExpirationNotification(
        cart: any,
        daysUntilExpiration: number
    ): Promise<void> {
        try {
            // Get product information for cart items
            const productIds = cart.items.map((item: any) => item.productId);
            const products = await productGrpcClient.getProductsBatch(productIds);

            const productMap = new Map(products.map(p => [p.id, p]));

            const items: CartExpirationItem[] = cart.items.map((item: any) => {
                const product = productMap.get(item.productId);
                return {
                    productId: item.productId,
                    productName: product?.name || 'Unknown Product',
                    quantity: item.quantity,
                    price: product?.price || 0,
                };
            });


            const totalValue: number = items.reduce(
                (sum: number, item: CartExpirationItem) => sum + item.price * item.quantity,
                0
            );

            const event: CartExpirationEvent = {
                eventId: uuidv4(),
                userId: cart.userId,
                cartId: `cart_${cart.userId}`,
                expiresAt: cart.expiresAt.toISOString(),
                daysUntilExpiration,
                itemCount: cart.items.length,
                totalValue,
                items,
                timestamp: new Date().toISOString(),
            };

            await cartKafkaService.sendCartExpirationEvent(event);

            logger.info('Cart expiration notification sent', {
                userId: cart.userId,
                daysUntilExpiration,
                itemCount: cart.items.length,
                totalValue,
                eventId: event.eventId,
            });
        } catch (error) {
            logger.error('Failed to send cart expiration notification', {
                error,
                userId: cart.userId,
                daysUntilExpiration,
            });
        }
    }
}

export const cartExpirationScheduler = new CartExpirationScheduler();