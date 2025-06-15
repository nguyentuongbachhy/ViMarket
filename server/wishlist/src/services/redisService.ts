import { config } from '@/config'
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
            password: config.redis.password || undefined,
            db: config.redis.db,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            keyPrefix: 'wishlist:',
            connectTimeout: 10000,
            commandTimeout: 5000,
        })

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.client.on('connect', () => {
            logger.info('Redis client connecting...')
        })

        this.client.on('ready', () => {
            logger.info('Redis client ready')
            this.isConnected = true
        })

        this.client.on('error', (error) => {
            logger.error('Redis client error', { error: error.message })
            this.isConnected = false
        })

        this.client.on('close', () => {
            logger.warn('Redis client connection closed')
            this.isConnected = false
        })
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            await this.client.ping();
            logger.info('Redis connected successfully');
        } catch (error) {
            logger.error('Failed to connect to Redis', { error });
            throw error;
        }
    }

    // Wishlist cache methods
    async getWishlist(userId: string): Promise<string[]> {
        try {
            const key = `user:${userId}`;
            return await this.client.smembers(key);
        } catch (error) {
            logger.error('Failed to get wishlist from Redis', { error, userId });
            return [];
        }
    }

    async addToWishlist(userId: string, productId: string): Promise<boolean> {
        try {
            const key = `user:${userId}`;
            const result = await this.client.sadd(key, productId);

            // Set expiration
            await this.client.expire(key, config.wishlist.cacheExpiration);

            return result > 0;
        } catch (error) {
            logger.error('Failed to add to wishlist cache', { error, userId, productId });
            return false;
        }
    }

    async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
        try {
            const key = `user:${userId}`;
            const result = await this.client.srem(key, productId);
            return result > 0;
        } catch (error) {
            logger.error('Failed to remove from wishlist cache', { error, userId, productId });
            return false;
        }
    }

    async isInWishlist(userId: string, productId: string): Promise<boolean> {
        try {
            const key = `user:${userId}`;
            const result = await this.client.sismember(key, productId);
            return result === 1;
        } catch (error) {
            logger.error('Failed to check wishlist membership', { error, userId, productId });
            return false;
        }
    }

    async getWishlistCount(userId: string): Promise<number> {
        try {
            const key = `user:${userId}`;
            return await this.client.scard(key);
        } catch (error) {
            logger.error('Failed to get wishlist count from cache', { error, userId });
            return 0;
        }
    }

    async clearWishlist(userId: string): Promise<boolean> {
        try {
            const key = `user:${userId}`;
            const result = await this.client.del(key);
            return result > 0;
        } catch (error) {
            logger.error('Failed to clear wishlist from cache', { error, userId });
            return false;
        }
    }

    async syncWishlistToCache(userId: string, productIds: string[]): Promise<void> {
        try {
            const key = `user:${userId}`;

            // Clear and rebuild cache
            await this.client.del(key);

            if (productIds.length > 0) {
                await this.client.sadd(key, ...productIds);
                await this.client.expire(key, config.wishlist.cacheExpiration);
            }
        } catch (error) {
            logger.error('Failed to sync wishlist to cache', { error, userId });
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG' && this.isConnected;
        } catch (error) {
            return false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Redis client disconnected');
        } catch (error) {
            logger.error('Error disconnecting Redis client', error);
        }
    }
}

export const redisService = new RedisService();