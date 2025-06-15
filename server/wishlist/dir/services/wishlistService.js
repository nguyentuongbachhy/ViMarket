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
exports.wishlistService = void 0;
const productClient_1 = require("@/grpc/productClient");
const logger_1 = require("@/utils/logger");
const uuid_1 = require("uuid");
const kafkaService_1 = require("./kafkaService");
const prismaService_1 = require("./prismaService");
const redisService_1 = require("./redisService");
class WishlistService {
    addToWishlist(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingItem = yield prismaService_1.prismaService.getWishlistItem(userId, productId);
                if (existingItem) {
                    throw new Error('Product already in wishlist');
                }
                let productInfo = yield redisService_1.redisService.getCachedProductInfo(productId);
                if (!productInfo) {
                    try {
                        const products = yield productClient_1.productGrpcClient.getProductsBatch([productId]);
                        productInfo = products.length > 0 ? products[0] : null;
                        if (productInfo) {
                            yield redisService_1.redisService.cacheProductInfo(productId, productInfo, 300);
                        }
                    }
                    catch (error) {
                        logger_1.logger.warn(`Failed to get product info for ${productId}:`, error);
                    }
                }
                yield redisService_1.redisService.addToWishlist(userId, productId);
                const wishlistItem = yield prismaService_1.prismaService.addWishlistItem(userId, productId, productInfo);
                yield prismaService_1.prismaService.logWishlistEvent(userId, productId, 'ADD', {
                    productName: productInfo === null || productInfo === void 0 ? void 0 : productInfo.name,
                    source: 'manual',
                });
                yield this.sendPriceRequest(userId, [productId]);
                return Object.assign(Object.assign({}, wishlistItem), { productName: wishlistItem.productName === null ? undefined : wishlistItem.productName, productPrice: wishlistItem.productPrice === null
                        ? undefined
                        : typeof wishlistItem.productPrice === 'object' && 'toNumber' in wishlistItem.productPrice
                            ? wishlistItem.productPrice.toNumber()
                            : Number(wishlistItem.productPrice), categoryId: wishlistItem.categoryId === null ? undefined : wishlistItem.categoryId, brandId: wishlistItem.brandId === null ? undefined : wishlistItem.brandId });
            }
            catch (error) {
                logger_1.logger.error('Error adding to wishlist:', error);
                throw error;
            }
        });
    }
    removeFromWishlist(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const redisResult = yield redisService_1.redisService.removeFromWishlist(userId, productId);
                yield prismaService_1.prismaService.removeWishlistItem(userId, productId);
                yield prismaService_1.prismaService.logWishlistEvent(userId, productId, 'REMOVE');
                return redisResult;
            }
            catch (error) {
                logger_1.logger.error('Error removing from wishlist:', error);
                throw error;
            }
        });
    }
    getUserWishlist(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            try {
                const { items, total } = yield prismaService_1.prismaService.getUserWishlist(userId, page, limit);
                const productIds = items.map(item => item.productId);
                const enhancedItems = yield this.enhanceWithProductInfo(items, productIds);
                return {
                    items: enhancedItems,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                };
            }
            catch (error) {
                logger_1.logger.error('Error getting user wishlist:', error);
                throw error;
            }
        });
    }
    isInWishlist(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inRedis = yield redisService_1.redisService.isInWishlist(userId, productId);
                if (inRedis)
                    return true;
                const item = yield prismaService_1.prismaService.getWishlistItem(userId, productId);
                if (item) {
                    yield redisService_1.redisService.addToWishlist(userId, productId);
                    return true;
                }
                return false;
            }
            catch (error) {
                logger_1.logger.error('Error checking wishlist:', error);
                return false;
            }
        });
    }
    getWishlistCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prismaService_1.prismaService.getWishlistCount(userId);
            }
            catch (error) {
                logger_1.logger.error('Error getting wishlist count:', error);
                return 0;
            }
        });
    }
    clearWishlist(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield redisService_1.redisService.clearWishlist(userId);
                yield prismaService_1.prismaService.clearUserWishlist(userId);
                yield prismaService_1.prismaService.logWishlistEvent(userId, 'ALL', 'CLEAR');
                return true;
            }
            catch (error) {
                logger_1.logger.error('Error clearing wishlist:', error);
                return false;
            }
        });
    }
    getWishlistWithPrices(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { items } = yield prismaService_1.prismaService.getUserWishlist(userId, 1, 100);
                const productIds = items.map(item => item.productId);
                if (productIds.length === 0)
                    return [];
                yield this.sendPriceRequest(userId, productIds);
                return yield this.enhanceWithProductInfo(items, productIds);
            }
            catch (error) {
                logger_1.logger.error('Error getting wishlist with prices:', error);
                throw error;
            }
        });
    }
    enhanceWithProductInfo(items, productIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (productIds.length === 0)
                return items;
            try {
                const products = yield productClient_1.productGrpcClient.getProductsBatch(productIds);
                const productMap = new Map(products.map(p => [p.id, p]));
                return items.map(item => (Object.assign(Object.assign({}, item), { product: productMap.get(item.productId) || null })));
            }
            catch (error) {
                logger_1.logger.warn('Failed to enhance with product info:', error);
                return items;
            }
        });
    }
    sendPriceRequest(userId, productIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const request = {
                    requestId: (0, uuid_1.v4)(),
                    userId,
                    productIds,
                    timestamp: new Date().toISOString(),
                    source: 'wishlist-service',
                };
                yield kafkaService_1.kafkaService.sendWishlistPriceRequest(request);
            }
            catch (error) {
                logger_1.logger.warn('Failed to send price request:', error);
            }
        });
    }
    getMostWishlistedProducts() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            return prismaService_1.prismaService.getMostWishlistedProducts(limit);
        });
    }
    getWishlistStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prismaService_1.prismaService.getWishlistStats(userId);
        });
    }
}
exports.wishlistService = new WishlistService();
//# sourceMappingURL=wishlistService.js.map