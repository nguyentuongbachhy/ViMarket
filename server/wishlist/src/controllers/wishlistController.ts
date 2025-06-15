import { AuthenticatedRequest } from '@/middleware/auth';
import { wishlistService } from '@/services/wishlistService';
import { AddToWishlistRequest } from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { Response } from 'express';
import Joi from 'joi';

const logger = new Logger('WishlistController')

const addToWishlistSchema = Joi.object({
    productId: Joi.string().uuid().required()
})

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
})

export class WishlistController {
    static async addToWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const { error, value } = addToWishlistSchema.validate(req.body);
            if (error) {
                ResponseUtils.badRequest(res, error.details[0].message);
                return;
            }

            const { productId }: AddToWishlistRequest = value;
            const result = await wishlistService.addToWishlist(userId, productId);

            if (result.alreadyExists) {
                ResponseUtils.success(res, result.item, 'Product is already in your wishlist', 200);
            } else {
                ResponseUtils.success(res, result.item, 'Product added to wishlist successfully', 201);
            }
        } catch (error) {
            logger.error('Failed to add product to wishlist', { error, userId: req.user?.userId });

            if (error instanceof Error) {
                if (error.message.includes('not found') || error.message.includes('discontinued')) {
                    ResponseUtils.notFound(res, error.message);
                } else if (error.message.includes('Maximum')) {
                    ResponseUtils.badRequest(res, error.message);
                } else {
                    ResponseUtils.error(res, error.message);
                }
            } else {
                ResponseUtils.error(res, 'Failed to add product to wishlist');
            }
        }
    }

    static async removeFromWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const productId = req.params.productId;
            if (!productId) {
                ResponseUtils.badRequest(res, 'Product ID is required');
                return;
            }

            const result = await wishlistService.removeFromWishlist(userId, productId);

            if (!result) {
                ResponseUtils.notFound(res, 'Product not found in wishlist');
                return;
            }

            ResponseUtils.success(res, null, 'Product removed from wishlist successfully');
        } catch (error) {
            logger.error('Failed to remove product from wishlist', { error, userId: req.user?.userId });
            ResponseUtils.error(res, 'Failed to remove product from wishlist');
        }
    }

    static async getUserWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const { error, value } = paginationSchema.validate(req.query);
            if (error) {
                ResponseUtils.badRequest(res, error.details[0].message);
                return;
            }

            const { page, limit } = value;
            const result = await wishlistService.getUserWishlist(userId, page, limit);

            ResponseUtils.success(res, result, 'Wishlist retrieved successfully');
        } catch (error) {
            logger.error('Failed to get user wishlist', { error, userId: req.user?.userId });
            ResponseUtils.error(res, 'Failed to retrieve wishlist');
        }
    }

    static async checkWishlistStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const productId = req.params.productId;
            if (!productId) {
                ResponseUtils.badRequest(res, 'Product ID is required');
                return;
            }

            const isInWishlist = await wishlistService.isInWishlist(userId, productId);

            ResponseUtils.success(res, {
                productId,
                isInWishlist
            }, 'Wishlist status retrieved successfully');
        } catch (error) {
            logger.error('Failed to check wishlist status', { error, userId: req.user?.userId });
            ResponseUtils.error(res, 'Failed to check wishlist status');
        }
    }

    static async getWishlistCount(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const count = await wishlistService.getWishlistCount(userId);

            ResponseUtils.success(res, { count }, 'Wishlist count retrieved successfully');
        } catch (error) {
            logger.error('Failed to get wishlist count', { error, userId: req.user?.userId });
            ResponseUtils.error(res, 'Failed to get wishlist count');
        }
    }

    static async clearWishlist(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const result = await wishlistService.clearWishlist(userId);

            if (!result) {
                ResponseUtils.error(res, 'Failed to clear wishlist');
                return;
            }

            ResponseUtils.success(res, null, 'Wishlist cleared successfully');
        } catch (error) {
            logger.error('Failed to clear wishlist', { error, userId: req.user?.userId });
            ResponseUtils.error(res, 'Failed to clear wishlist');
        }
    }

    // Analytics endpoints
    static async getMostWishlistedProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            const products = await wishlistService.getMostWishlistedProducts(limit);

            ResponseUtils.success(res, products, 'Most wishlisted products retrieved successfully');
        } catch (error) {
            logger.error('Failed to get most wishlisted products', { error });
            ResponseUtils.error(res, 'Failed to get most wishlisted products');
        }
    }

    static async getWishlistStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const stats = await wishlistService.getWishlistStats(userId);

            ResponseUtils.success(res, stats, 'Wishlist stats retrieved successfully');
        } catch (error) {
            logger.error('Failed to get wishlist stats', { error, userId: req.user?.userId });
            ResponseUtils.error(res, 'Failed to get wishlist stats');
        }
    }
}