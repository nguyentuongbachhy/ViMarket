"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const cartService_1 = require("@/services/cartService");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const joi_1 = __importDefault(require("joi"));
const logger = new logger_1.Logger('CartController');
const addToCartSchema = joi_1.default.object({
    productId: joi_1.default.string().required().min(1).max(100),
    quantity: joi_1.default.number().integer().min(1).max(10).required()
});
const updateCartItemSchema = joi_1.default.object({
    quantity: joi_1.default.number().integer().min(0).max(10).required()
});
const productIdSchema = joi_1.default.string().required().min(1).max(100);
class CartController {
    static getCart(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                logger.debug('Getting cart for user', { userId });
                const cart = yield cartService_1.cartService.getCart(userId);
                if (!cart) {
                    response_1.ResponseUtils.success(res, null, 'Cart is empty');
                    return;
                }
                response_1.ResponseUtils.success(res, cart, 'Cart retrieved successfully');
            }
            catch (error) {
                logger.error('Failed to get cart', { error, userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId });
                if (error instanceof Error) {
                    response_1.ResponseUtils.error(res, error.message, 500);
                }
                else {
                    response_1.ResponseUtils.error(res, 'Failed to retrieve cart', 500);
                }
            }
        });
    }
    static addToCart(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const { error, value } = addToCartSchema.validate(req.body);
                if (error) {
                    response_1.ResponseUtils.badRequest(res, error.details[0].message);
                    return;
                }
                const { productId, quantity } = value;
                logger.debug('Adding item to cart', { userId, productId, quantity });
                const cart = yield cartService_1.cartService.addToCart(userId, productId, quantity);
                response_1.ResponseUtils.success(res, cart, 'Item added to cart successfully', 201);
            }
            catch (error) {
                logger.error('Failed to add item to cart', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    body: req.body
                });
                if (error instanceof Error) {
                    const errorMessage = error.message;
                    if (errorMessage.includes('Only ') && errorMessage.includes('available')) {
                        response_1.ResponseUtils.badRequest(res, `${errorMessage} (errorType: INSUFFICIENT_INVENTORY, suggestion: REDUCE_QUANTITY, availableQuantity: ${CartController.extractNumberFromMessage(errorMessage, 'Only ')})`);
                    }
                    else if (errorMessage.includes('out of stock')) {
                        response_1.ResponseUtils.badRequest(res, errorMessage);
                    }
                    else if (errorMessage.includes('not found')) {
                        response_1.ResponseUtils.notFound(res, errorMessage);
                    }
                    else if (errorMessage.includes('Maximum')) {
                        response_1.ResponseUtils.badRequest(res, errorMessage);
                    }
                    else {
                        response_1.ResponseUtils.error(res, errorMessage, 500);
                    }
                }
                else {
                    response_1.ResponseUtils.error(res, 'Failed to add item to cart', 500);
                }
            }
        });
    }
    static updateCartItem(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const { error: productIdError, value: productId } = productIdSchema.validate(req.params.productId);
                if (productIdError) {
                    response_1.ResponseUtils.badRequest(res, 'Invalid product ID');
                    return;
                }
                const { error, value } = updateCartItemSchema.validate(req.body);
                if (error) {
                    response_1.ResponseUtils.badRequest(res, error.details[0].message);
                    return;
                }
                const { quantity } = value;
                logger.debug('Updating cart item', { userId, productId, quantity });
                const cart = yield cartService_1.cartService.updateCartItem(userId, productId, quantity);
                if (!cart) {
                    response_1.ResponseUtils.success(res, null, 'Cart is now empty');
                    return;
                }
                response_1.ResponseUtils.success(res, cart, 'Cart item updated successfully');
            }
            catch (error) {
                logger.error('Failed to update cart item', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    productId: req.params.productId,
                    body: req.body,
                });
                if (error instanceof Error) {
                    if (error.message.includes('not found')) {
                        response_1.ResponseUtils.notFound(res, error.message);
                    }
                    else if (error.message.includes('out of stock') || error.message.includes('Maximum')) {
                        response_1.ResponseUtils.badRequest(res, error.message);
                    }
                    else {
                        response_1.ResponseUtils.error(res, error.message, 500);
                    }
                }
                else {
                    response_1.ResponseUtils.error(res, 'Failed to update cart item', 500);
                }
            }
        });
    }
    static removeFromCart(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const { error: productIdError, value: productId } = productIdSchema.validate(req.params.productId);
                if (productIdError) {
                    response_1.ResponseUtils.badRequest(res, 'Invalid product ID');
                    return;
                }
                logger.debug('Removing item from cart', { userId, productId });
                const cart = yield cartService_1.cartService.removeFromCart(userId, productId);
                if (!cart) {
                    response_1.ResponseUtils.success(res, null, 'Item removed, cart is now empty');
                    return;
                }
                response_1.ResponseUtils.success(res, cart, 'Item removed from cart successfully');
            }
            catch (error) {
                logger.error('Failed to remove item from cart', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    productId: req.params.productId,
                });
                if (error instanceof Error) {
                    if (error.message.includes('not found')) {
                        response_1.ResponseUtils.notFound(res, error.message);
                    }
                    else {
                        response_1.ResponseUtils.error(res, error.message, 500);
                    }
                }
                else {
                    response_1.ResponseUtils.error(res, 'Failed to remove item from cart', 500);
                }
            }
        });
    }
    static clearCart(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                logger.debug('Clearing cart', { userId });
                yield cartService_1.cartService.clearCart(userId);
                response_1.ResponseUtils.success(res, null, 'Cart cleared successfully');
            }
            catch (error) {
                logger.error('Failed to clear cart', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                });
                if (error instanceof Error) {
                    response_1.ResponseUtils.error(res, error.message, 500);
                }
                else {
                    response_1.ResponseUtils.error(res, 'Failed to clear cart', 500);
                }
            }
        });
    }
    static getCartItemCount(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                logger.debug('Getting cart item count', { userId });
                const count = yield cartService_1.cartService.getCartItemCount(userId);
                response_1.ResponseUtils.success(res, { count }, 'Cart item count retrieved successfully');
            }
            catch (error) {
                logger.error('Failed to get cart item count', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                });
                response_1.ResponseUtils.error(res, 'Failed to get cart item count', 500);
            }
        });
    }
    static validateCart(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                logger.debug('Validating cart', { userId });
                const validation = yield cartService_1.cartService.validateCart(userId);
                if (validation.isValid) {
                    response_1.ResponseUtils.success(res, validation, 'Cart is valid');
                }
                else {
                    response_1.ResponseUtils.badRequest(res, 'Cart validation failed');
                }
            }
            catch (error) {
                logger.error('Failed to validate cart', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                });
                response_1.ResponseUtils.error(res, 'Failed to validate cart', 500);
            }
        });
    }
    static mergeGuestCart(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                const { guestCartItems } = req.body;
                if (!Array.isArray(guestCartItems)) {
                    response_1.ResponseUtils.badRequest(res, 'Guest cart items must be an array');
                    return;
                }
                logger.debug('Merging guest cart', { userId, guestItemCount: guestCartItems.length });
                const cart = yield cartService_1.cartService.mergeGuestCart(userId, guestCartItems);
                response_1.ResponseUtils.success(res, cart, 'Guest cart merged successfully');
            }
            catch (error) {
                logger.error('Failed to merge guest cart', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                    body: req.body,
                });
                response_1.ResponseUtils.error(res, 'Failed to merge guest cart', 500);
            }
        });
    }
    static prepareCheckout(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    response_1.ResponseUtils.unauthorized(res, 'User authentication required');
                    return;
                }
                logger.debug('Preparing checkout', { userId });
                const checkoutData = yield cartService_1.cartService.prepareCheckout(userId);
                response_1.ResponseUtils.success(res, checkoutData, 'Checkout preparation completed');
            }
            catch (error) {
                logger.error('Failed to prepare checkout', {
                    error,
                    userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                });
                if (error instanceof Error) {
                    if (error.message.includes('empty') || error.message.includes('not found')) {
                        response_1.ResponseUtils.badRequest(res, error.message);
                    }
                    else if (error.message.includes('invalid') || error.message.includes('unavailable')) {
                        response_1.ResponseUtils.badRequest(res, error.message);
                    }
                    else {
                        response_1.ResponseUtils.error(res, error.message, 500);
                    }
                }
                else {
                    response_1.ResponseUtils.error(res, 'Failed to prepare checkout', 500);
                }
            }
        });
    }
    static extractNumberFromMessage(message, prefix) {
        const regex = new RegExp(prefix + '(\\d+)');
        const match = message.match(regex);
        return match ? parseInt(match[1], 10) : undefined;
    }
}
exports.CartController = CartController;
//# sourceMappingURL=cartController.js.map