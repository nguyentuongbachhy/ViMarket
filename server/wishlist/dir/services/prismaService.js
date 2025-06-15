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
exports.prismaService = void 0;
const prisma_1 = require("@/generated/prisma");
const logger_1 = require("@/utils/logger");
class PrismaService {
    constructor() {
        this.prisma = new prisma_1.PrismaClient({
            log: ['error', 'warn'],
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.prisma.$connect();
                logger_1.logger.info('Database connected successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to connect to database:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prisma.$disconnect();
        });
    }
    addWishlistItem(userId, productId, productInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.wishlist.upsert({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
                update: Object.assign({ updatedAt: new Date() }, (productInfo && {
                    productName: productInfo.name,
                    productPrice: productInfo.price,
                    categoryId: productInfo.categoryId,
                    brandId: productInfo.brandId,
                })),
                create: {
                    userId,
                    productId,
                    productName: productInfo === null || productInfo === void 0 ? void 0 : productInfo.name,
                    productPrice: productInfo === null || productInfo === void 0 ? void 0 : productInfo.price,
                    categoryId: productInfo === null || productInfo === void 0 ? void 0 : productInfo.categoryId,
                    brandId: productInfo === null || productInfo === void 0 ? void 0 : productInfo.brandId,
                },
            });
        });
    }
    removeWishlistItem(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.wishlist.delete({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
            });
        });
    }
    getUserWishlist(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            const skip = (page - 1) * limit;
            const [items, total] = yield Promise.all([
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
            return { items, total };
        });
    }
    getWishlistItem(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.wishlist.findUnique({
                where: {
                    userId_productId: {
                        userId,
                        productId,
                    },
                },
            });
        });
    }
    clearUserWishlist(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.wishlist.deleteMany({
                where: { userId },
            });
        });
    }
    getWishlistCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.wishlist.count({
                where: { userId },
            });
        });
    }
    logWishlistEvent(userId, productId, action, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.prisma.wishlistEvent.create({
                data: {
                    userId,
                    productId,
                    action,
                    metadata,
                },
            });
        });
    }
    getMostWishlistedProducts() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            return this.prisma.wishlist.groupBy({
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
        });
    }
    getWishlistStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [total, recent] = yield Promise.all([
                this.prisma.wishlist.count({
                    where: { userId },
                }),
                this.prisma.wishlist.count({
                    where: {
                        userId,
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
            ]);
            return { total, recent };
        });
    }
}
exports.prismaService = new PrismaService();
//# sourceMappingURL=prismaService.js.map