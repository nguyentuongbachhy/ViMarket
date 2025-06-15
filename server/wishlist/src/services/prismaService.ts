import { config } from '@/config';
import { PrismaClient } from '@/generated/prisma';
import { Logger } from '@/utils/logger';

const logger = new Logger('PrismaService')

export class PrismaService {
    private prisma: PrismaClient;
    private isConnected = false;

    constructor() {
        this.prisma = new PrismaClient({
            log: ['error', 'warn'],
            datasources: {
                db: {
                    url: config.database.url
                }
            }
        });
    }

    async connect(): Promise<void> {
        try {
            await this.prisma.$connect();
            this.isConnected = true;
            logger.info('Database connected successfully');
        } catch (error) {
            logger.error('Failed to connect to database', error);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.prisma.$disconnect();
            this.isConnected = false;
            logger.info('Database disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from database', error);
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return this.isConnected;
        } catch (error) {
            logger.error('Database health check failed', error);
            return false;
        }
    }

    // Wishlist operations
    async addWishlistItem(userId: string, productId: string, productInfo?: any) {
        try {
            const result = await this.prisma.wishlist.upsert({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
                update: {
                    updatedAt: new Date(),
                    ...(productInfo && {
                        productName: productInfo.name,
                        productPrice: productInfo.price,
                        categoryId: productInfo.categoryId,
                        brandId: productInfo.brandId,
                    }),
                },
                create: {
                    userId,
                    productId,
                    productName: productInfo?.name,
                    productPrice: productInfo?.price,
                    categoryId: productInfo?.categoryId,
                    brandId: productInfo?.brandId,
                },
            });

            logger.debug('Wishlist item saved to database', {
                userId,
                productId,
                itemId: result.id,
                operation: 'upsert'
            });

            return result;
        } catch (error) {
            logger.error('Failed to add wishlist item to database', { error, userId, productId });
            throw error;
        }
    }

    async removeWishlistItem(userId: string, productId: string) {
        try {
            const result = await this.prisma.wishlist.delete({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
            });

            logger.debug('Wishlist item removed from database', {
                userId,
                productId,
                itemId: result.id
            });

            return result;
        } catch (error) {
            logger.error('Failed to remove wishlist item from database', { error, userId, productId });
            throw error;
        }
    }

    async getUserWishlist(userId: string, page: number = 1, limit: number = 20) {
        try {
            const skip = (page - 1) * limit;

            const [items, total] = await Promise.all([
                this.prisma.wishlist.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.wishlist.count({
                    where: { userId },
                }),
            ]);

            logger.debug('User wishlist retrieved from database', {
                userId,
                itemCount: items.length,
                total,
                page,
                limit
            });

            return { items, total };
        } catch (error) {
            logger.error('Failed to get user wishlist from database', { error, userId, page, limit });
            throw error;
        }
    }

    async getWishlistItem(userId: string, productId: string) {
        try {
            const result = await this.prisma.wishlist.findUnique({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
            });

            logger.debug('Wishlist item retrieved from database', {
                userId,
                productId,
                found: !!result
            });

            return result;
        } catch (error) {
            logger.error('Failed to get wishlist item from database', { error, userId, productId });
            throw error;
        }
    }

    async clearUserWishlist(userId: string) {
        try {
            const result = await this.prisma.wishlist.deleteMany({
                where: { userId },
            });

            logger.debug('User wishlist cleared from database', {
                userId,
                deletedCount: result.count
            });

            return result;
        } catch (error) {
            logger.error('Failed to clear user wishlist from database', { error, userId });
            throw error;
        }
    }

    async getWishlistCount(userId: string): Promise<number> {
        try {
            const count = await this.prisma.wishlist.count({
                where: { userId },
            });

            logger.debug('Wishlist count retrieved from database', {
                userId,
                count
            });

            return count;
        } catch (error) {
            logger.error('Failed to get wishlist count from database', { error, userId });
            throw error;
        }
    }

    // Event logging
    async logWishlistEvent(userId: string, productId: string, action: string, metadata?: any) {
        try {
            const result = await this.prisma.wishlistEvent.create({
                data: {
                    userId,
                    productId,
                    action,
                    metadata,
                },
            });

            logger.debug('Wishlist event logged', {
                userId,
                productId,
                action,
                eventId: result.id
            });

            return result;
        } catch (error) {
            logger.error('Failed to log wishlist event', { error, userId, productId, action });
            // Don't throw error for logging failures
            return null;
        }
    }

    // Analytics methods
    async getMostWishlistedProducts(limit: number = 10) {
        try {
            const result = await this.prisma.wishlist.groupBy({
                by: ['productId'],
                _count: {
                    productId: true,
                },
                orderBy: {
                    _count: {
                        productId: 'desc',
                    },
                },
                take: limit,
            });

            logger.debug('Most wishlisted products retrieved', {
                limit,
                resultCount: result.length
            });

            return result;
        } catch (error) {
            logger.error('Failed to get most wishlisted products', { error, limit });
            throw error;
        }
    }

    async getWishlistStats(userId: string) {
        try {
            const [total, recent] = await Promise.all([
                this.prisma.wishlist.count({
                    where: { userId },
                }),
                this.prisma.wishlist.count({
                    where: {
                        userId,
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                        },
                    },
                }),
            ]);

            logger.debug('Wishlist stats retrieved', {
                userId,
                total,
                recent
            });

            return { total, recent };
        } catch (error) {
            logger.error('Failed to get wishlist stats', { error, userId });
            throw error;
        }
    }
}

export const prismaService = new PrismaService();