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
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistController = void 0;
const wishlistService_1 = require("@/services/wishlistService");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const zod_1 = require("zod");
const addToWishlistSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid product ID format'),
});
const paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
});
class WishlistController {
    addToWishlist(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productId } = addToWishlistSchema.parse(req.body);
                const userId = req.user.id;
                const item = yield wishlistService_1.wishlistService.addToWishlist(userId, productId);
                res.status(201).json((0, response_1.createResponse)(true, 'Product added to wishlist successfully', item));
            }
            catch (error) {
                logger_1.logger.error('Error in addToWishlist:', error);
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json((0, response_1.createResponse)(false, 'Validation error', null, error.errors));
                    return;
                }
                if (error instanceof Error && error.message === 'Product already in wishlist') {
                    res.status(409).json((0, response_1.createResponse)(false, error.message));
                    return;
                }
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to add product to wishlist'));
            }
        });
    }
    removeFromWishlist(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productId } = req.params;
                const userId = req.user.id;
                if (!productId) {
                    res.status(400).json((0, response_1.createResponse)(false, 'Product ID is required'));
                    return;
                }
                const result = yield wishlistService_1.wishlistService.removeFromWishlist(userId, productId);
                if (!result) {
                    res.status(404).json((0, response_1.createResponse)(false, 'Product not found in wishlist'));
                    return;
                }
                res.json((0, response_1.createResponse)(true, 'Product removed from wishlist successfully'));
            }
            catch (error) {
                logger_1.logger.error('Error in removeFromWishlist:', error);
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to remove product from wishlist'));
            }
        });
    }
    getUserWishlist(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page, limit } = paginationSchema.parse(req.query);
                const userId = req.user.id;
                const result = yield wishlistService_1.wishlistService.getUserWishlist(userId, page, limit);
                res.json((0, response_1.createResponse)(true, 'Wishlist retrieved successfully', result.items, {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                }));
            }
            catch (error) {
                logger_1.logger.error('Error in getUserWishlist:', error);
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json((0, response_1.createResponse)(false, 'Validation error', null, error.errors));
                    return;
                }
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to retrieve wishlist'));
            }
        });
    }
    checkWishlistStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productId } = req.params;
                const userId = req.user.id;
                if (!productId) {
                    res.status(400).json((0, response_1.createResponse)(false, 'Product ID is required'));
                    return;
                }
                const isInWishlist = yield wishlistService_1.wishlistService.isInWishlist(userId, productId);
                res.json((0, response_1.createResponse)(true, 'Wishlist status retrieved', {
                    productId,
                    isInWishlist
                }));
            }
            catch (error) {
                logger_1.logger.error('Error in checkWishlistStatus:', error);
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to check wishlist status'));
            }
        });
    }
    getWishlistCount(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const count = yield wishlistService_1.wishlistService.getWishlistCount(userId);
                res.json((0, response_1.createResponse)(true, 'Wishlist count retrieved', { count }));
            }
            catch (error) {
                logger_1.logger.error('Error in getWishlistCount:', error);
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to get wishlist count'));
            }
        });
    }
    clearWishlist(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const result = yield wishlistService_1.wishlistService.clearWishlist(userId);
                if (!result) {
                    res.status(500).json((0, response_1.createResponse)(false, 'Failed to clear wishlist'));
                    return;
                }
                res.json((0, response_1.createResponse)(true, 'Wishlist cleared successfully'));
            }
            catch (error) {
                logger_1.logger.error('Error in clearWishlist:', error);
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to clear wishlist'));
            }
        });
    }
    getWishlistWithPrices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const items = yield wishlistService_1.wishlistService.getWishlistWithPrices(userId);
                res.json((0, response_1.createResponse)(true, 'Wishlist with prices retrieved', items));
            }
            catch (error) {
                logger_1.logger.error('Error in getWishlistWithPrices:', error);
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to get wishlist with prices'));
            }
        });
    }
    getMostWishlistedProducts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const products = yield wishlistService_1.wishlistService.getMostWishlistedProducts(limit);
                res.json((0, response_1.createResponse)(true, 'Most wishlisted products retrieved', products));
            }
            catch (error) {
                logger_1.logger.error('Error in getMostWishlistedProducts:', error);
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to get most wishlisted products'));
            }
        });
    }
    getWishlistStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const stats = yield wishlistService_1.wishlistService.getWishlistStats(userId);
                res.json((0, response_1.createResponse)(true, 'Wishlist stats retrieved', stats));
            }
            catch (error) {
                logger_1.logger.error('Error in getWishlistStats:', error);
                res.status(500).json((0, response_1.createResponse)(false, 'Failed to get wishlist stats'));
            }
        });
    }
}
exports.wishlistController = new WishlistController();
//# sourceMappingURL=wishlistController.js.map