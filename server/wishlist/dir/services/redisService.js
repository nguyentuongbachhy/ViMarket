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
exports.redisService = void 0;
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const ioredis_1 = __importDefault(require("ioredis"));
class RedisService {
    constructor() {
        this.client = new ioredis_1.default({
            host: config_1.CONFIG.REDIS_HOST,
            port: config_1.CONFIG.REDIS_PORT,
            password: config_1.CONFIG.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.client.on('connect', () => {
            logger_1.logger.info('Redis connected successfully');
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Redis connection error:', error);
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.connect();
            }
            catch (error) {
                logger_1.logger.error('Failed to connect to Redis:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.disconnect();
        });
    }
    getWishlist(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `wishlist:${userId}`;
                const result = yield this.client.smembers(key);
                return result;
            }
            catch (error) {
                logger_1.logger.error('Redis getWishlist error:', error);
                return [];
            }
        });
    }
    addToWishlist(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `wishlist:${userId}`;
                const result = yield this.client.sadd(key, productId);
                yield this.client.expire(key, 24 * 60 * 60);
                return result > 0;
            }
            catch (error) {
                logger_1.logger.error('Redis addToWishlist error:', error);
                return false;
            }
        });
    }
    removeFromWishlist(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `wishlist:${userId}`;
                const result = yield this.client.srem(key, productId);
                return result > 0;
            }
            catch (error) {
                logger_1.logger.error('Redis removeFromWishlist error:', error);
                return false;
            }
        });
    }
    isInWishlist(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `wishlist:${userId}`;
                const result = yield this.client.sismember(key, productId);
                return result === 1;
            }
            catch (error) {
                logger_1.logger.error('Redis isInWishlist error:', error);
                return false;
            }
        });
    }
    getWishlistCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `wishlist:${userId}`;
                const count = yield this.client.scard(key);
                return count;
            }
            catch (error) {
                logger_1.logger.error('Redis getWishlistCount error:', error);
                return 0;
            }
        });
    }
    clearWishlist(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `wishlist:${userId}`;
                const result = yield this.client.del(key);
                return result > 0;
            }
            catch (error) {
                logger_1.logger.error('Redis clearWishlist error:', error);
                return false;
            }
        });
    }
    cacheProductInfo(productId_1, productInfo_1) {
        return __awaiter(this, arguments, void 0, function* (productId, productInfo, ttl = 300) {
            try {
                const key = `product:${productId}`;
                yield this.client.setex(key, ttl, JSON.stringify(productInfo));
            }
            catch (error) {
                logger_1.logger.error('Redis cacheProductInfo error:', error);
            }
        });
    }
    getCachedProductInfo(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `product:${productId}`;
                const result = yield this.client.get(key);
                return result ? JSON.parse(result) : null;
            }
            catch (error) {
                logger_1.logger.error('Redis getCachedProductInfo error:', error);
                return null;
            }
        });
    }
}
exports.redisService = new RedisService();
//# sourceMappingURL=redisService.js.map