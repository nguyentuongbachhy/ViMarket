// controllers/cartController.ts
import { AuthenticatedRequest } from '@/middleware/auth';
import { cartService } from '@/services/cartService';
import { AddToCartRequest, UpdateCartItemRequest } from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { Response } from 'express';
import Joi from 'joi';

const logger = new Logger('CartController')

const addToCartSchema = Joi.object({
    productId: Joi.string().required().min(1).max(100),
    quantity: Joi.number().integer().min(1).max(10).required()
})

const updateCartItemSchema = Joi.object({
    quantity: Joi.number().integer().min(0).max(10).required()
})

const productIdSchema = Joi.string().required().min(1).max(100)

export class CartController {
    static async getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required')
                return
            }

            logger.debug('Getting cart for user', { userId })
            const cart = await cartService.getCart(userId)

            if (!cart) {
                ResponseUtils.success(res, null, 'Cart is empty')
                return
            }

            ResponseUtils.success(res, cart, 'Cart retrieved successfully')
        } catch (error) {
            logger.error('Failed to get cart', { error, userId: req.user?.userId })
            if (error instanceof Error) {
                ResponseUtils.error(res, error.message, 500)
            } else {
                ResponseUtils.error(res, 'Failed to retrieve cart', 500)
            }
        }
    }

    static async addToCart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required')
                return
            }

            const { error, value } = addToCartSchema.validate(req.body)
            if (error) {
                ResponseUtils.badRequest(res, error.details[0].message)
                return
            }

            const { productId, quantity }: AddToCartRequest = value

            logger.debug('Adding item to cart', { userId, productId, quantity })

            const cart = await cartService.addToCart(userId, productId, quantity)

            ResponseUtils.success(res, cart, 'Item added to cart successfully', 201)
        } catch (error) {
            logger.error('Failed to add item to cart', {
                error,
                userId: req.user?.userId,
                body: req.body
            })

            if (error instanceof Error) {
                const errorMessage = error.message;

                // Enhanced error responses với suggestions
                if (errorMessage.includes('Only ') && errorMessage.includes('available')) {
                    ResponseUtils.badRequest(
                        res,
                        `${errorMessage} (errorType: INSUFFICIENT_INVENTORY, suggestion: REDUCE_QUANTITY, availableQuantity: ${CartController.extractNumberFromMessage(errorMessage, 'Only ')})`
                    );
                } else if (errorMessage.includes('out of stock')) {
                    ResponseUtils.badRequest(res, errorMessage);
                } else if (errorMessage.includes('not found')) {
                    ResponseUtils.notFound(res, errorMessage);
                } else if (errorMessage.includes('Maximum')) {
                    ResponseUtils.badRequest(res, errorMessage);
                } else {
                    ResponseUtils.error(res, errorMessage, 500);
                }
            } else {
                ResponseUtils.error(res, 'Failed to add item to cart', 500);
            }
        }
    }

    static async updateCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const { error: productIdError, value: productId } = productIdSchema.validate(req.params.productId);
            if (productIdError) {
                ResponseUtils.badRequest(res, 'Invalid product ID');
                return;
            }

            const { error, value } = updateCartItemSchema.validate(req.body);
            if (error) {
                ResponseUtils.badRequest(res, error.details[0].message);
                return;
            }

            const { quantity }: UpdateCartItemRequest = value;

            logger.debug('Updating cart item', { userId, productId, quantity });

            const cart = await cartService.updateCartItem(userId, productId, quantity);

            if (!cart) {
                ResponseUtils.success(res, null, 'Cart is now empty');
                return;
            }

            ResponseUtils.success(res, cart, 'Cart item updated successfully');
        } catch (error) {
            logger.error('Failed to update cart item', {
                error,
                userId: req.user?.userId,
                productId: req.params.productId,
                body: req.body,
            });

            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    ResponseUtils.notFound(res, error.message);
                } else if (error.message.includes('out of stock') || error.message.includes('Maximum')) {
                    ResponseUtils.badRequest(res, error.message);
                } else {
                    ResponseUtils.error(res, error.message, 500);
                }
            } else {
                ResponseUtils.error(res, 'Failed to update cart item', 500);
            }
        }
    }

    static async removeFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const { error: productIdError, value: productId } = productIdSchema.validate(req.params.productId);
            if (productIdError) {
                ResponseUtils.badRequest(res, 'Invalid product ID');
                return;
            }

            logger.debug('Removing item from cart', { userId, productId });

            const cart = await cartService.removeFromCart(userId, productId);

            if (!cart) {
                ResponseUtils.success(res, null, 'Item removed, cart is now empty');
                return;
            }

            ResponseUtils.success(res, cart, 'Item removed from cart successfully');
        } catch (error) {
            logger.error('Failed to remove item from cart', {
                error,
                userId: req.user?.userId,
                productId: req.params.productId,
            });

            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    ResponseUtils.notFound(res, error.message);
                } else {
                    ResponseUtils.error(res, error.message, 500);
                }
            } else {
                ResponseUtils.error(res, 'Failed to remove item from cart', 500);
            }
        }
    }

    static async clearCart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            logger.debug('Clearing cart', { userId });

            await cartService.clearCart(userId);

            ResponseUtils.success(res, null, 'Cart cleared successfully');
        } catch (error) {
            logger.error('Failed to clear cart', {
                error,
                userId: req.user?.userId,
            });

            if (error instanceof Error) {
                ResponseUtils.error(res, error.message, 500);
            } else {
                ResponseUtils.error(res, 'Failed to clear cart', 500);
            }
        }
    }

    static async getCartItemCount(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            logger.debug('Getting cart item count', { userId });

            const count = await cartService.getCartItemCount(userId);

            ResponseUtils.success(res, { count }, 'Cart item count retrieved successfully');
        } catch (error) {
            logger.error('Failed to get cart item count', {
                error,
                userId: req.user?.userId,
            });

            ResponseUtils.error(res, 'Failed to get cart item count', 500);
        }
    }

    static async validateCart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            logger.debug('Validating cart', { userId });

            const validation = await cartService.validateCart(userId);

            if (validation.isValid) {
                ResponseUtils.success(res, validation, 'Cart is valid');
            } else {
                ResponseUtils.badRequest(res, 'Cart validation failed');
            }
        } catch (error) {
            logger.error('Failed to validate cart', {
                error,
                userId: req.user?.userId,
            });

            ResponseUtils.error(res, 'Failed to validate cart', 500);
        }
    }

    static async mergeGuestCart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            const { guestCartItems } = req.body;

            if (!Array.isArray(guestCartItems)) {
                ResponseUtils.badRequest(res, 'Guest cart items must be an array');
                return;
            }

            logger.debug('Merging guest cart', { userId, guestItemCount: guestCartItems.length });

            const cart = await cartService.mergeGuestCart(userId, guestCartItems);

            ResponseUtils.success(res, cart, 'Guest cart merged successfully');
        } catch (error) {
            logger.error('Failed to merge guest cart', {
                error,
                userId: req.user?.userId,
                body: req.body,
            });

            ResponseUtils.error(res, 'Failed to merge guest cart', 500);
        }
    }

    static async prepareCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User authentication required');
                return;
            }

            logger.debug('Preparing checkout', { userId });

            const checkoutData = await cartService.prepareCheckout(userId);

            ResponseUtils.success(res, checkoutData, 'Checkout preparation completed');
        } catch (error) {
            logger.error('Failed to prepare checkout', {
                error,
                userId: req.user?.userId,
            });

            if (error instanceof Error) {
                if (error.message.includes('empty') || error.message.includes('not found')) {
                    ResponseUtils.badRequest(res, error.message);
                } else if (error.message.includes('invalid') || error.message.includes('unavailable')) {
                    ResponseUtils.badRequest(res, error.message);
                } else {
                    ResponseUtils.error(res, error.message, 500);
                }
            } else {
                ResponseUtils.error(res, 'Failed to prepare checkout', 500);
            }
        }
    }

    static extractNumberFromMessage(message: string, prefix: string): number | undefined {
        const regex = new RegExp(prefix + '(\\d+)');
        const match = message.match(regex);
        return match ? parseInt(match[1], 10) : undefined;
    }
}