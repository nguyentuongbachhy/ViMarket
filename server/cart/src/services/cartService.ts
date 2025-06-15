// services/cartService.ts
import { config } from '@/config';
import { inventoryGrpcClient } from '@/grpc/inventoryClient';
import { productGrpcClient } from '@/grpc/productClient';
import { CartItem, CartItemValidation, CartItemWithProduct, CartValidationResult, CartWithProducts, GuestCartItem, ProductSummary } from '@/types';
import { Logger } from '@/utils/logger';
import { pricingService } from './pricingService';
import { redisService } from './redisService';

const logger = new Logger('CartService')

export class CartService {
    async getCart(userId: string): Promise<CartWithProducts | null> {
        try {
            logger.debug('Getting cart for user', { userId })
            const cart = await redisService.getCart(userId)

            if (!cart || cart.items.length === 0) {
                logger.debug('Cart is empty or not found', { userId })
                return null
            }

            // Check if cart expired
            if (cart.expiresAt < new Date()) {
                logger.info('Cart expired, clearing it', { userId, expiresAt: cart.expiresAt })
                await redisService.clearCart(userId)
                return null
            }

            return await this.enrichCartWithProductData(cart)
        } catch (error) {
            logger.error('Failed to get cart', { error, userId });
            throw new Error('Failed to retrieve cart');
        }
    }

    async addToCart(userId: string, productId: string, quantity: number): Promise<CartWithProducts> {
        try {
            logger.debug('Starting addToCart process', { userId, productId, quantity })

            if (quantity <= 0) {
                throw new Error('Quantity must be greater than 0')
            }
            if (quantity > config.cart.maxQuantityPerItem) {
                throw new Error(`Maximum quantity per item is ${config.cart.maxQuantityPerItem}`)
            }

            // Step 1: Validate product and inventory
            logger.debug('Validating cart item', { userId, productId, quantity });
            const validation = await this.validateCartItem(productId, quantity)

            if (!validation.isValid) {
                // Thay vì throw error, trả về thông tin chi tiết
                const errorDetails = {
                    productId,
                    requestedQuantity: quantity,
                    availableQuantity: validation.availableQuantity || 0,
                    errorMessage: validation.error,
                    product: validation.product,
                    canAddToWishlist: !!validation.product, // Suggest alternative
                    suggestedQuantity: Math.min(quantity, validation.availableQuantity || 0)
                };

                logger.info('Product cannot be added to cart but providing details', errorDetails);

                // Create detailed error with suggestions
                if (validation.availableQuantity && validation.availableQuantity > 0) {
                    throw new Error(`Only ${validation.availableQuantity} items available. Would you like to add ${validation.availableQuantity} instead?`);
                } else if (validation.product) {
                    throw new Error(`${validation.product.name} is currently out of stock. Add to wishlist to be notified when available.`);
                } else {
                    throw new Error(validation.error || 'Product is not available');
                }
            }

            logger.debug('Cart item validation successful', { userId, productId });

            // Continue with existing logic...
            let cart = await redisService.getCart(userId)

            if (!cart) {
                logger.debug('Creating new cart', { userId });
                const now = new Date()
                const expiresAt = new Date(now.getTime() + config.cart.expirationDays * 24 * 60 * 60 * 1000)
                cart = {
                    userId,
                    items: [],
                    createdAt: now,
                    updatedAt: now,
                    expiresAt
                }
            } else {
                logger.debug('Found existing cart', { userId, itemCount: cart.items.length });
            }

            // Rest of the method remains the same...
            const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
            if (existingItemIndex === -1 && cart.items.length >= config.cart.maxItems) {
                throw new Error(`Maximum ${config.cart.maxItems} items allowed in cart`);
            }

            const now = new Date()

            if (existingItemIndex >= 0) {
                const existingItem = cart.items[existingItemIndex];
                const newQuantity = existingItem.quantity + quantity;

                if (newQuantity > config.cart.maxQuantityPerItem) {
                    throw new Error(`Maximum quantity per item is ${config.cart.maxQuantityPerItem}`);
                }

                // Re-validate with new quantity
                const quantityValidation = await this.validateCartItem(productId, newQuantity)
                if (!quantityValidation.isValid) {
                    if (quantityValidation.availableQuantity && quantityValidation.availableQuantity > 0) {
                        const maxCanAdd = quantityValidation.availableQuantity - existingItem.quantity;
                        throw new Error(`You already have ${existingItem.quantity} in cart. Only ${maxCanAdd} more can be added (${quantityValidation.availableQuantity} total available).`);
                    } else {
                        throw new Error(quantityValidation.error || 'Cannot add more of this item');
                    }
                }

                cart.items[existingItemIndex] = {
                    ...existingItem,
                    quantity: newQuantity,
                    updatedAt: now,
                };

                logger.debug('Updated existing cart item', {
                    userId,
                    productId,
                    oldQuantity: existingItem.quantity,
                    newQuantity,
                });
            } else {
                const newItem: CartItem = {
                    productId,
                    quantity,
                    addedAt: now,
                    updatedAt: now,
                };

                cart.items.push(newItem);

                logger.debug('Added new cart item', {
                    userId,
                    productId,
                    quantity,
                });
            }

            cart.updatedAt = now;
            await redisService.saveCart(cart);

            const cartWithProducts = await this.enrichCartWithProductData(cart);

            logger.info('Item added to cart successfully', {
                userId,
                productId,
                quantity,
                totalItems: cartWithProducts.totalItems,
            });

            return cartWithProducts;
        } catch (error) {
            logger.error('Failed to add item to cart', {
                error,
                userId,
                productId,
                quantity,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined
            });

            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to add item to cart');
        }
    }

    async updateCartItem(userId: string, productId: string, quantity: number): Promise<CartWithProducts | null> {
        try {
            logger.debug('Updating cart item', { userId, productId, quantity });

            if (quantity <= 0) {
                return await this.removeFromCart(userId, productId);
            }

            if (quantity > config.cart.maxQuantityPerItem) {
                throw new Error(`Maximum quantity per item is ${config.cart.maxQuantityPerItem}`);
            }

            const cart = await redisService.getCart(userId);
            if (!cart) {
                throw new Error('Cart not found');
            }

            const itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            // Validate new quantity
            const validation = await this.validateCartItem(productId, quantity);
            if (!validation.isValid) {
                throw new Error(validation.error || 'Invalid product');
            }

            const now = new Date();
            cart.items[itemIndex] = {
                ...cart.items[itemIndex],
                quantity,
                updatedAt: now,
            };

            cart.updatedAt = now;
            await redisService.saveCart(cart);

            const cartWithProducts = await this.enrichCartWithProductData(cart);

            logger.info('Cart item updated successfully', {
                userId,
                productId,
                quantity,
                totalItems: cartWithProducts.totalItems,
            });

            return cartWithProducts;
        } catch (error) {
            logger.error('Failed to update cart item', { error, userId, productId, quantity });
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to update cart item');
        }
    }

    async removeFromCart(userId: string, productId: string): Promise<CartWithProducts | null> {
        try {
            logger.debug('Removing item from cart', { userId, productId });

            const cart = await redisService.getCart(userId);
            if (!cart) {
                throw new Error('Cart not found');
            }

            const itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            cart.items.splice(itemIndex, 1);
            cart.updatedAt = new Date();

            if (cart.items.length === 0) {
                await redisService.clearCart(userId);
                logger.info('Cart cleared - all items removed', { userId });
                return null;
            }

            await redisService.saveCart(cart);
            const cartWithProducts = await this.enrichCartWithProductData(cart);

            logger.info('Item removed from cart successfully', {
                userId,
                productId,
                remainingItems: cart.items.length,
            });

            return cartWithProducts;
        } catch (error) {
            logger.error('Failed to remove item from cart', { error, userId, productId });
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to remove item from cart');
        }
    }

    async clearCart(userId: string): Promise<void> {
        try {
            logger.debug('Clearing cart', { userId });
            await redisService.clearCart(userId);
            logger.info('Cart cleared successfully', { userId });
        } catch (error) {
            logger.error('Failed to clear cart', { error, userId });
            throw new Error('Failed to clear cart');
        }
    }

    async getCartItemCount(userId: string): Promise<number> {
        try {
            const cart = await redisService.getCart(userId);
            if (!cart) {
                return 0;
            }
            const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            logger.debug('Cart item count retrieved', { userId, totalItems });
            return totalItems;
        } catch (error) {
            logger.error('Failed to get cart item count', { error, userId });
            return 0;
        }
    }

    async validateCart(userId: string): Promise<CartValidationResult> {
        try {
            logger.debug('Validating cart', { userId });

            const cart = await redisService.getCart(userId);

            if (!cart || cart.items.length === 0) {
                return { isValid: true, errors: [], invalidItems: [] };
            }

            const errors: string[] = [];
            const invalidItems: string[] = [];

            // Check cart expiration
            if (cart.expiresAt < new Date()) {
                errors.push('Cart has expired');
                await redisService.clearCart(userId);
                return { isValid: false, errors, invalidItems };
            }

            // Validate each item
            for (const item of cart.items) {
                const validation = await this.validateCartItem(item.productId, item.quantity);
                if (!validation.isValid) {
                    errors.push(`${item.productId}: ${validation.error}`);
                    invalidItems.push(item.productId);
                }
            }

            // Check minimum order amount
            if (errors.length === 0) {
                const cartWithProducts = await this.enrichCartWithProductData(cart);
                if (cartWithProducts.pricing.subtotal < config.cart.minOrderAmount) {
                    errors.push(`Minimum order amount is $${config.cart.minOrderAmount}`);
                }
            }

            const isValid = errors.length === 0;

            logger.debug('Cart validation completed', {
                userId,
                isValid,
                errorCount: errors.length,
                invalidItemCount: invalidItems.length,
            });

            return { isValid, errors, invalidItems };
        } catch (error) {
            logger.error('Failed to validate cart', { error, userId });
            return {
                isValid: false,
                errors: ['Failed to validate cart'],
                invalidItems: [],
            };
        }
    }

    async mergeGuestCart(userId: string, guestCartItems: GuestCartItem[]): Promise<CartWithProducts | null> {
        try {
            logger.debug('Merging guest cart', { userId, guestItemCount: guestCartItems.length });

            if (!guestCartItems || guestCartItems.length === 0) {
                return await this.getCart(userId);
            }

            let userCart = await redisService.getCart(userId);
            if (!userCart) {
                const now = new Date();
                const expiresAt = new Date(now.getTime() + config.cart.expirationDays * 24 * 60 * 60 * 1000);
                userCart = {
                    userId,
                    items: [],
                    createdAt: now,
                    updatedAt: now,
                    expiresAt
                };
            }

            const mergedItems = new Map<string, CartItem>();

            // Add existing user cart items
            userCart.items.forEach(item => {
                mergedItems.set(item.productId, item);
            });

            // Merge guest cart items
            for (const guestItem of guestCartItems) {
                const existingItem = mergedItems.get(guestItem.productId);

                if (existingItem) {
                    const newQuantity = Math.min(
                        existingItem.quantity + guestItem.quantity,
                        config.cart.maxQuantityPerItem
                    );

                    mergedItems.set(guestItem.productId, {
                        ...existingItem,
                        quantity: newQuantity,
                        updatedAt: new Date(),
                    });
                } else {
                    // Validate before adding
                    const validation = await this.validateCartItem(guestItem.productId, guestItem.quantity);
                    if (validation.isValid) {
                        mergedItems.set(guestItem.productId, {
                            productId: guestItem.productId,
                            quantity: guestItem.quantity,
                            addedAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }
                }
            }

            // Check max items limit
            const itemsArray = Array.from(mergedItems.values());
            if (itemsArray.length > config.cart.maxItems) {
                // Keep most recently updated items
                itemsArray.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                userCart.items = itemsArray.slice(0, config.cart.maxItems);
            } else {
                userCart.items = itemsArray;
            }

            userCart.updatedAt = new Date();
            await redisService.saveCart(userCart);

            logger.info('Guest cart merged successfully', {
                userId,
                guestItems: guestCartItems.length,
                finalItems: userCart.items.length,
            });

            return await this.enrichCartWithProductData(userCart);
        } catch (error) {
            logger.error('Failed to merge guest cart', { error, userId });
            throw new Error('Failed to merge guest cart');
        }
    }

    async prepareCheckout(userId: string): Promise<{
        cart: CartWithProducts;
        validation: CartValidationResult;
        summary: {
            itemCount: number;
            totalAmount: number;
            isReadyForCheckout: boolean;
        };
    }> {
        try {
            logger.debug('Preparing checkout', { userId });

            const cart = await this.getCart(userId);
            if (!cart) {
                throw new Error('Cart is empty');
            }

            const validation = await this.validateCart(userId);

            const summary = {
                itemCount: cart.totalItems,
                totalAmount: cart.pricing.total,
                isReadyForCheckout: validation.isValid && cart.pricing.total >= config.cart.minOrderAmount,
            };

            logger.info('Checkout preparation completed', {
                userId,
                itemCount: summary.itemCount,
                totalAmount: summary.totalAmount,
                isReady: summary.isReadyForCheckout,
            });

            return {
                cart,
                validation,
                summary,
            };
        } catch (error) {
            logger.error('Failed to prepare checkout', { error, userId });
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to prepare checkout');
        }
    }

    private async enrichCartWithProductData(cart: {
        userId: string;
        items: CartItem[];
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date;
    }): Promise<CartWithProducts> {
        const productIds = cart.items.map(item => item.productId)

        try {
            logger.debug('Fetching products for cart enrichment', {
                userId: cart.userId,
                productIds
            });

            const products = await productGrpcClient.getProductsBatch(productIds);

            const productMap = new Map<string, ProductSummary>();
            products.forEach(product => {
                productMap.set(product.id, product);
            });

            logger.debug('Checking inventory for cart items', {
                userId: cart.userId,
                itemCount: cart.items.length
            });

            const inventoryChecks = await Promise.allSettled(
                cart.items.map(async (item) => {
                    const product = productMap.get(item.productId);

                    if (!product) {
                        logger.warn('Product not found for cart item', {
                            userId: cart.userId,
                            productId: item.productId
                        });
                        return {
                            productId: item.productId,
                            available: false,
                            availableQuantity: 0,
                            status: 'not_found',
                            error: 'Product not found'
                        };
                    }

                    try {
                        const inventoryResult = await inventoryGrpcClient.checkInventory(
                            item.productId,
                            item.quantity,
                            {
                                inventoryStatus: product.inventoryStatus || '',
                                name: product.name || '',
                                price: product.price || 0
                            }
                        );

                        return {
                            productId: item.productId,
                            available: inventoryResult.available,
                            availableQuantity: inventoryResult.availableQuantity,
                            status: inventoryResult.status,
                            error: null
                        };
                    } catch (error) {
                        logger.warn('Failed to check inventory for cart item', {
                            userId: cart.userId,
                            productId: item.productId,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });

                        return {
                            productId: item.productId,
                            available: false,
                            availableQuantity: 0,
                            status: 'error',
                            error: error instanceof Error ? error.message : 'Inventory check failed'
                        };
                    }
                })
            );

            const inventoryMap = new Map<string, {
                available: boolean;
                availableQuantity: number;
                status: string;
                error: string | null;
            }>();

            inventoryChecks.forEach((result, index) => {
                const item = cart.items[index];
                if (result.status === 'fulfilled') {
                    inventoryMap.set(item.productId, result.value);
                } else {
                    logger.error('Inventory check promise rejected', {
                        userId: cart.userId,
                        productId: item.productId,
                        error: result.reason
                    });
                    inventoryMap.set(item.productId, {
                        available: false,
                        availableQuantity: 0,
                        status: 'error',
                        error: 'Failed to check inventory'
                    });
                }
            });

            const itemsWithProducts: CartItemWithProduct[] = []
            const itemsToRemove: string[] = []

            for (const item of cart.items) {
                const product = productMap.get(item.productId)
                const inventory = inventoryMap.get(item.productId)

                if (!product) {
                    logger.warn('Product not found for cart item, will remove', {
                        userId: cart.userId,
                        productId: item.productId
                    })
                    itemsToRemove.push(item.productId)
                    continue
                }

                let isAvailable = true
                let availableQuantity = 0

                if (inventory) {
                    isAvailable = inventory.available && inventory.availableQuantity >= item.quantity
                    availableQuantity = inventory.availableQuantity

                    if (!isAvailable) {
                        logger.info('Product not available in sufficient quantity', {
                            userId: cart.userId,
                            productId: item.productId,
                            productName: product.name,
                            requestedQuantity: item.quantity,
                            availableQuantity: inventory.availableQuantity,
                            inventoryStatus: inventory.status,
                            error: inventory.error
                        })
                    }

                    product.inventoryStatus = inventory.status
                } else {
                    isAvailable = false
                    availableQuantity = 0
                    logger.warn('No inventory information available for product', {
                        userId: cart.userId,
                        productId: item.productId,
                        productName: product.name
                    })
                }

                // FIX: Chỉ tính unit price * quantity, không áp dụng discount ở đây
                const totalPrice = this.roundToDecimalPlaces(product.price * item.quantity)

                itemsWithProducts.push({
                    ...item,
                    product,
                    totalPrice, // Giá thuần không discount
                    isAvailable,
                    availableQuantity,
                });
            }

            if (itemsToRemove.length > 0) {
                logger.info('Removing unavailable products from cart', {
                    userId: cart.userId,
                    itemsToRemove,
                    removeCount: itemsToRemove.length
                });

                for (const productId of itemsToRemove) {
                    await redisService.removeItemFromCart(cart.userId, productId)
                }
            }

            // FIX: Sử dụng pricing service để tính toán chính xác
            const pricing = pricingService.calculateCartPricing(itemsWithProducts)

            const cartWithProducts: CartWithProducts = {
                userId: cart.userId,
                items: itemsWithProducts,
                totalItems: itemsWithProducts.reduce((sum, item) => sum + item.quantity, 0),
                pricing,
                createdAt: cart.createdAt,
                updatedAt: cart.updatedAt,
                expiresAt: cart.expiresAt
            }

            logger.debug('Cart enriched with product data successfully', {
                userId: cart.userId,
                originalItemCount: cart.items.length,
                finalItemCount: cartWithProducts.items.length,
                totalItems: cartWithProducts.totalItems,
                subtotal: cartWithProducts.pricing.subtotal,
                totalPrice: cartWithProducts.pricing.total,
                removedItems: itemsToRemove.length,
                availableItems: itemsWithProducts.filter(item => item.isAvailable).length,
                unavailableItems: itemsWithProducts.filter(item => !item.isAvailable).length
            });

            return cartWithProducts

        } catch (error) {
            logger.error('Failed to enrich cart with product data', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: cart.userId,
                itemCount: cart.items.length,
                productIds
            });

            const itemsWithProducts: CartItemWithProduct[] = []
            const pricing = pricingService.calculateCartPricing(itemsWithProducts);

            return {
                userId: cart.userId,
                items: itemsWithProducts,
                totalItems: 0,
                pricing,
                createdAt: cart.createdAt,
                updatedAt: cart.updatedAt,
                expiresAt: cart.expiresAt
            };
        }
    }

    private async validateCartItem(productId: string, quantity: number): Promise<CartItemValidation> {
        try {
            logger.debug('Validating cart item', { productId, quantity });

            const products = await productGrpcClient.getProductsBatch([productId]);
            if (!products || products.length === 0) {
                return { isValid: false, error: 'Product not found' };
            }

            const product = products[0];

            try {
                const inventoryCheck = await inventoryGrpcClient.checkInventory(
                    productId,
                    quantity,
                    {
                        inventoryStatus: product.inventoryStatus || '',
                        name: product.name || '',
                        price: product.price || 0
                    }
                );

                if (!inventoryCheck.available) {
                    return {
                        isValid: false,
                        error: `Insufficient inventory. Available: ${inventoryCheck.availableQuantity}, Requested: ${quantity}`,
                    };
                }

                return {
                    isValid: true,
                    product,
                    availableQuantity: inventoryCheck.availableQuantity,
                };
            } catch (inventoryError) {
                logger.error('Inventory check failed', {
                    error: inventoryError,
                    productId,
                    quantity,
                    productInfo: {
                        inventoryStatus: product.inventoryStatus,
                        name: product.name,
                        price: product.price
                    }
                });

                return {
                    isValid: false,
                    error: 'Unable to check inventory availability at the moment',
                    product,
                    availableQuantity: 0,
                };
            }
        } catch (error) {
            logger.error('Failed to validate cart item', { error, productId });
            return { isValid: false, error: 'Failed to validate product' };
        }
    }

    private roundToDecimalPlaces(value: number): number {
        const multiplier = Math.pow(10, config.pricing.decimalPlaces);
        return Math.round(value * multiplier) / multiplier;
    }
}

export const cartService = new CartService();