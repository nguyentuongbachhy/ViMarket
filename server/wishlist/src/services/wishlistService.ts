import { config } from '@/config';
import { productGrpcClient } from '@/grpc/productClient';
import { WishlistItem, WishlistItemValidation } from '@/types';
import { Logger } from '@/utils/logger';
import { prismaService } from './prismaService';
import { redisService } from './redisService';

const logger = new Logger('WishlistService')

export class WishlistService {
    async addToWishlist(userId: string, productId: string): Promise<{ item: WishlistItem; alreadyExists: boolean }> {
        try {
            // Check if already exists
            const existingItem = await prismaService.getWishlistItem(userId, productId);
            if (existingItem) {
                // Update cache
                await redisService.addToWishlist(userId, productId);
                return { item: { ...existingItem, productName: existingItem.productName ?? undefined }, alreadyExists: true };
            }

            // Check limit
            const currentCount = await this.getWishlistCount(userId);
            if (currentCount >= config.wishlist.maxItems) {
                throw new Error(`Maximum ${config.wishlist.maxItems} items allowed in wishlist`);
            }

            // Validate product
            const validation = await this.validateProduct(productId);
            if (!validation.isValid) {
                throw new Error(validation.error || 'Invalid product');
            }

            // Add to database
            const wishlistItem = await prismaService.addWishlistItem(
                userId,
                productId,
                validation.product?.name
            );

            // Update cache
            await redisService.addToWishlist(userId, productId);

            // Log event
            await prismaService.logWishlistEvent(userId, productId, 'ADD', {
                productName: validation.product?.name,
            });

            logger.info('Product added to wishlist', { userId, productId });

            return { item: { ...wishlistItem, productName: wishlistItem.productName ?? undefined }, alreadyExists: false };
        } catch (error) {
            logger.error('Failed to add product to wishlist', { error, userId, productId });
            throw error;
        }
    }

    async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
        try {
            const existingItem = await prismaService.getWishlistItem(userId, productId);
            if (!existingItem) {
                return false;
            }

            // Remove from database
            await prismaService.removeWishlistItem(userId, productId);

            // Update cache
            await redisService.removeFromWishlist(userId, productId);

            // Log event
            await prismaService.logWishlistEvent(userId, productId, 'REMOVE');

            logger.info('Product removed from wishlist', { userId, productId });
            return true;
        } catch (error) {
            logger.error('Failed to remove product from wishlist', { error, userId, productId });
            throw error;
        }
    }

    async getUserWishlist(userId: string, page: number = 1, limit: number = 20) {
        try {
            // Get from database (primary source)
            const { items, total } = await prismaService.getUserWishlist(userId, page, limit);

            // Sync cache with database if needed
            if (page === 1) {
                const allItems = await prismaService.getUserWishlist(userId, 1, 1000);
                const productIds = allItems.items.map(item => item.productId);
                await redisService.syncWishlistToCache(userId, productIds);
            }

            // Enhance with fresh product data
            // Ensure productName is undefined if null for type compatibility
            const sanitizedItems = items.map(item => ({
                ...item,
                productName: item.productName ?? undefined,
            }));
            const enhancedItems = await this.enhanceWithProductInfo(sanitizedItems);

            return {
                items: enhancedItems,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        } catch (error) {
            logger.error('Failed to get user wishlist', { error, userId, page, limit });
            throw new Error('Failed to retrieve wishlist');
        }
    }

    async isInWishlist(userId: string, productId: string): Promise<boolean> {
        try {
            // Check cache first
            const inCache = await redisService.isInWishlist(userId, productId);
            if (inCache) return true;

            // Check database
            const item = await prismaService.getWishlistItem(userId, productId);

            // Update cache if found
            if (item) {
                await redisService.addToWishlist(userId, productId);
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Failed to check wishlist status', { error, userId, productId });
            return false;
        }
    }

    async getWishlistCount(userId: string): Promise<number> {
        try {
            // Use database as source of truth
            return await prismaService.getWishlistCount(userId);
        } catch (error) {
            logger.error('Failed to get wishlist count', { error, userId });
            return 0;
        }
    }

    async clearWishlist(userId: string): Promise<boolean> {
        try {
            // Clear database
            await prismaService.clearUserWishlist(userId);

            // Clear cache
            await redisService.clearWishlist(userId);

            // Log event
            await prismaService.logWishlistEvent(userId, 'ALL', 'CLEAR');

            logger.info('Wishlist cleared', { userId });
            return true;
        } catch (error) {
            logger.error('Failed to clear wishlist', { error, userId });
            return false;
        }
    }

    private async validateProduct(productId: string): Promise<WishlistItemValidation> {
        try {
            const products = await productGrpcClient.getProductsBatch([productId]);

            if (!products || products.length === 0) {
                return { isValid: false, error: 'Product not found' };
            }

            const product = products[0];
            if (product.inventoryStatus === 'discontinued') {
                return { isValid: false, error: 'Product is discontinued' };
            }

            return {
                isValid: true,
                product: {
                    id: product.id,
                    name: product.name,
                    inventoryStatus: product.inventoryStatus,
                },
            };
        } catch (error) {
            logger.error('Failed to validate product', { error, productId });
            return { isValid: false, error: 'Failed to validate product' };
        }
    }

    private async enhanceWithProductInfo(items: WishlistItem[]): Promise<WishlistItem[]> {
        if (items.length === 0) return items;

        try {
            const productIds = items.map(item => item.productId);
            const products = await productGrpcClient.getProductsBatch(productIds);
            const productMap = new Map(products.map(p => [p.id, p]));

            return items.map(item => {
                const product = productMap.get(item.productId);
                return {
                    ...item,
                    productName: product?.name || item.productName || 'Unknown Product',
                    product: product || null,
                };
            });
        } catch (error) {
            logger.warn('Failed to enhance with product info', { error });
            return items;
        }
    }

    // Analytics methods
    async getMostWishlistedProducts(limit: number = 10) {
        return prismaService.getMostWishlistedProducts(limit);
    }

    async getWishlistStats(userId: string) {
        return prismaService.getWishlistStats(userId);
    }
}

export const wishlistService = new WishlistService();