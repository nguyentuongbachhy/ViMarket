import { config } from '@/config'
import { Cart, CartItem } from '@/types'
import { HashUtils } from '@/utils/hash'
import { Logger } from '@/utils/logger'
import Redis from 'ioredis'

const logger = new Logger('RedisService')

export class RedisService {
    private client: Redis
    private isConnected = false

    constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            keyPrefix: 'ecommerce:',
        })

        this.setupEventListeners();
        this.connect();
    }

    private setupEventListeners(): void {
        this.client.on('connect', () => {
            logger.info('Redis client connected')
            this.isConnected = true
        })

        this.client.on('ready', () => {
            logger.info('Redis client ready')
        })

        this.client.on('error', (error) => {
            logger.error('Redis client error', error)
            this.isConnected = false
        })

        this.client.on('close', () => {
            logger.warn('Redis client connection closed')
        })
    }

    private async connect(): Promise<void> {
        try {
            await this.client.connect();
        } catch (error) {
            logger.error('Failed to connect to Redis', error);
            throw error;
        }
    }

    async getCart(userId: string): Promise<Cart | null> {
        try {
            // Check connection first
            if (!this.isConnected) {
                logger.error('Redis not connected', { userId });
                throw new Error('Redis connection not available');
            }

            const cacheKey = HashUtils.hashUserId(userId)
            logger.debug('Getting cart from Redis', { userId, cacheKey });

            const cartData = await this.client.hgetall(cacheKey)
            logger.debug('Redis response', { userId, cacheKey, hasData: Object.keys(cartData).length > 0 });

            if (!cartData || Object.keys(cartData).length === 0) {
                logger.debug('Cart not found in cache', { userId, cacheKey })
                return null
            }

            const cart: Cart = {
                userId,
                items: [],
                createdAt: new Date(cartData.createdAt),
                updatedAt: new Date(cartData.updatedAt),
                expiresAt: new Date(cartData.expiresAt)
            }

            const itemKeys = Object.keys(cartData).filter(key => key.startsWith('item:'))
            logger.debug('Found cart items', { userId, itemCount: itemKeys.length });

            for (const itemKey of itemKeys) {
                try {
                    const item: CartItem = JSON.parse(cartData[itemKey])
                    cart.items.push(item)
                } catch (parseError) {
                    logger.error('Failed to parse cart item', {
                        parseError,
                        itemKey,
                        rawData: cartData[itemKey],
                        userId
                    })
                }
            }

            logger.debug('Cart retrieved from cache successfully', {
                userId,
                itemCount: cart.items.length,
                cacheKey
            })

            return cart
        } catch (error) {
            logger.error('Failed to get cart from Redis', {
                error,
                userId,
                redisConnected: this.isConnected,
                errorType: error?.constructor?.name
            });
            throw error;
        }
    }

    async saveCart(cart: Cart): Promise<void> {
        try {
            const cacheKey = HashUtils.hashUserId(cart.userId)
            const expirationSeconds = config.cart.expirationDays * 24 * 60 * 60

            const cartHash: Record<string, string> = {
                userId: cart.userId,
                createdAt: cart.createdAt.toISOString(),
                updatedAt: cart.updatedAt.toISOString(),
                expiresAt: cart.expiresAt.toISOString(),
                itemCount: cart.items.length.toString()
            }

            cart.items.forEach((item, index) => {
                cartHash[`item:${item.productId}`] = JSON.stringify(item)
            })

            const pipeline = this.client.pipeline()
            pipeline.del(cacheKey)
            pipeline.hmset(cacheKey, cartHash)
            pipeline.expire(cacheKey, expirationSeconds)
            await pipeline.exec()

            logger.debug('Cart saved to cache', {
                userId: cart.userId,
                itemCount: cart.items.length,
                cacheKey,
                expirationSeconds
            })
        } catch (error) {
            logger.error('Failed to save cart to Redis', { error, userId: cart.userId })
            throw error
        }
    }

    async setCartReservation(userId: string, reservationId: string): Promise<void> {
        try {
            const key = `reservation:${HashUtils.hashUserId(userId)}`;
            const expirationSeconds = config.cart.reservationTimeoutMinutes * 60;

            await this.client.setex(key, expirationSeconds, reservationId);

            logger.debug('Cart reservation set', { userId, reservationId, expirationSeconds });
        } catch (error) {
            logger.error('Failed to set cart reservation', { error, userId, reservationId });
            throw error;
        }
    }

    async getCartReservation(userId: string): Promise<string | null> {
        try {
            const key = `reservation:${HashUtils.hashUserId(userId)}`;
            const reservationId = await this.client.get(key);

            logger.debug('Cart reservation retrieved', { userId, reservationId });
            return reservationId;
        } catch (error) {
            logger.error('Failed to get cart reservation', { error, userId });
            return null;
        }
    }

    async clearCartReservation(userId: string): Promise<void> {
        try {
            const key = `reservation:${HashUtils.hashUserId(userId)}`;
            await this.client.del(key);

            logger.debug('Cart reservation cleared', { userId });
        } catch (error) {
            logger.error('Failed to clear cart reservation', { error, userId });
            throw error;
        }
    }
    async addItemToCart(userId: string, item: CartItem): Promise<void> {
        try {
            const cacheKey = HashUtils.hashUserId(userId)
            const itemKey = `item:${item.productId}`

            const pipeline = this.client.pipeline()
            pipeline.hset(cacheKey, itemKey, JSON.stringify(item))
            pipeline.hset(cacheKey, {
                updatedAt: new Date().toISOString()
            })

            const expirationSeconds = config.cart.expirationDays * 24 * 60 * 60
            pipeline.expire(cacheKey, expirationSeconds)
            await pipeline.exec()

            logger.debug('Item added to cart cache', {
                userId,
                productId: item.productId,
                quantity: item.quantity,
                cacheKey
            })
        } catch (error) {
            logger.error('Failed to add item to cart cache', { error, userId })
            throw error
        }
    }

    async removeItemFromCart(userId: string, productId: string): Promise<void> {
        try {
            const cacheKey = HashUtils.hashUserId(userId);
            const itemKey = `item:${productId}`;

            const pipeline = this.client.pipeline();
            pipeline.hdel(cacheKey, itemKey);
            pipeline.hset(cacheKey, {
                updatedAt: new Date().toISOString(),
            });

            const expirationSeconds = config.cart.expirationDays * 24 * 60 * 60;
            pipeline.expire(cacheKey, expirationSeconds);

            await pipeline.exec()
            logger.debug('Item removed from cart cache', {
                userId,
                productId,
                cacheKey,
            });

        } catch (error) {
            logger.error('Failed to remove item to cart cache', { error, userId })
            throw error
        }
    }

    async clearCart(userId: string): Promise<void> {
        try {
            const cacheKey = HashUtils.hashUserId(userId);
            await this.client.del(cacheKey);

            logger.debug('Cart cleared from cache', { userId, cacheKey });
        } catch (error) {
            logger.error('Failed to clear cart from cache', { error, userId });
            throw error;
        }
    }

    async getCartItemCount(userId: string): Promise<number> {
        try {
            const cacheKey = HashUtils.hashUserId(userId);
            const itemCount = await this.client.hget(cacheKey, 'itemCount');
            return parseInt(itemCount || '0', 10);
        } catch (error) {
            logger.error('Failed to get cart item count', { error, userId });
            return 0;
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG' && this.isConnected;
        } catch (error) {
            logger.error('Redis health check failed', error);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
            logger.info('Redis client disconnected');
        } catch (error) {
            logger.error('Error disconnecting Redis client', error);
        }
    }
}

export const redisService = new RedisService();