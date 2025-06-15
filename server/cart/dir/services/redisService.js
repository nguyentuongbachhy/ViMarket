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
exports.redisService = exports.RedisService = void 0;
const config_1 = require("@/config");
const hash_1 = require("@/utils/hash");
const logger_1 = require("@/utils/logger");
const ioredis_1 = __importDefault(require("ioredis"));
const logger = new logger_1.Logger('RedisService');
class RedisService {
    constructor() {
        this.isConnected = false;
        this.client = new ioredis_1.default({
            host: config_1.config.redis.host,
            port: config_1.config.redis.port,
            password: config_1.config.redis.password,
            db: config_1.config.redis.db,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            keyPrefix: 'ecommerce:',
        });
        this.setupEventListeners();
        this.connect();
    }
    setupEventListeners() {
        this.client.on('connect', () => {
            logger.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('ready', () => {
            logger.info('Redis client ready');
        });
        this.client.on('error', (error) => {
            logger.error('Redis client error', error);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            logger.warn('Redis client connection closed');
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.connect();
            }
            catch (error) {
                logger.error('Failed to connect to Redis', error);
                throw error;
            }
        });
    }
    getCart(userId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    logger.error('Redis not connected', { userId });
                    throw new Error('Redis connection not available');
                }
                const cacheKey = hash_1.HashUtils.hashUserId(userId);
                logger.debug('Getting cart from Redis', { userId, cacheKey });
                const cartData = yield this.client.hgetall(cacheKey);
                logger.debug('Redis response', { userId, cacheKey, hasData: Object.keys(cartData).length > 0 });
                if (!cartData || Object.keys(cartData).length === 0) {
                    logger.debug('Cart not found in cache', { userId, cacheKey });
                    return null;
                }
                const cart = {
                    userId,
                    items: [],
                    createdAt: new Date(cartData.createdAt),
                    updatedAt: new Date(cartData.updatedAt),
                    expiresAt: new Date(cartData.expiresAt)
                };
                const itemKeys = Object.keys(cartData).filter(key => key.startsWith('item:'));
                logger.debug('Found cart items', { userId, itemCount: itemKeys.length });
                for (const itemKey of itemKeys) {
                    try {
                        const item = JSON.parse(cartData[itemKey]);
                        cart.items.push(item);
                    }
                    catch (parseError) {
                        logger.error('Failed to parse cart item', {
                            parseError,
                            itemKey,
                            rawData: cartData[itemKey],
                            userId
                        });
                    }
                }
                logger.debug('Cart retrieved from cache successfully', {
                    userId,
                    itemCount: cart.items.length,
                    cacheKey
                });
                return cart;
            }
            catch (error) {
                logger.error('Failed to get cart from Redis', {
                    error,
                    userId,
                    redisConnected: this.isConnected,
                    errorType: (_a = error === null || error === void 0 ? void 0 : error.constructor) === null || _a === void 0 ? void 0 : _a.name
                });
                throw error;
            }
        });
    }
    saveCart(cart) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = hash_1.HashUtils.hashUserId(cart.userId);
                const expirationSeconds = config_1.config.cart.expirationDays * 24 * 60 * 60;
                const cartHash = {
                    userId: cart.userId,
                    createdAt: cart.createdAt.toISOString(),
                    updatedAt: cart.updatedAt.toISOString(),
                    expiresAt: cart.expiresAt.toISOString(),
                    itemCount: cart.items.length.toString()
                };
                cart.items.forEach((item, index) => {
                    cartHash[`item:${item.productId}`] = JSON.stringify(item);
                });
                const pipeline = this.client.pipeline();
                pipeline.del(cacheKey);
                pipeline.hmset(cacheKey, cartHash);
                pipeline.expire(cacheKey, expirationSeconds);
                yield pipeline.exec();
                logger.debug('Cart saved to cache', {
                    userId: cart.userId,
                    itemCount: cart.items.length,
                    cacheKey,
                    expirationSeconds
                });
            }
            catch (error) {
                logger.error('Failed to save cart to Redis', { error, userId: cart.userId });
                throw error;
            }
        });
    }
    setCartReservation(userId, reservationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `reservation:${hash_1.HashUtils.hashUserId(userId)}`;
                const expirationSeconds = config_1.config.cart.reservationTimeoutMinutes * 60;
                yield this.client.setex(key, expirationSeconds, reservationId);
                logger.debug('Cart reservation set', { userId, reservationId, expirationSeconds });
            }
            catch (error) {
                logger.error('Failed to set cart reservation', { error, userId, reservationId });
                throw error;
            }
        });
    }
    getCartReservation(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `reservation:${hash_1.HashUtils.hashUserId(userId)}`;
                const reservationId = yield this.client.get(key);
                logger.debug('Cart reservation retrieved', { userId, reservationId });
                return reservationId;
            }
            catch (error) {
                logger.error('Failed to get cart reservation', { error, userId });
                return null;
            }
        });
    }
    clearCartReservation(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `reservation:${hash_1.HashUtils.hashUserId(userId)}`;
                yield this.client.del(key);
                logger.debug('Cart reservation cleared', { userId });
            }
            catch (error) {
                logger.error('Failed to clear cart reservation', { error, userId });
                throw error;
            }
        });
    }
    addItemToCart(userId, item) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = hash_1.HashUtils.hashUserId(userId);
                const itemKey = `item:${item.productId}`;
                const pipeline = this.client.pipeline();
                pipeline.hset(cacheKey, itemKey, JSON.stringify(item));
                pipeline.hset(cacheKey, {
                    updatedAt: new Date().toISOString()
                });
                const expirationSeconds = config_1.config.cart.expirationDays * 24 * 60 * 60;
                pipeline.expire(cacheKey, expirationSeconds);
                yield pipeline.exec();
                logger.debug('Item added to cart cache', {
                    userId,
                    productId: item.productId,
                    quantity: item.quantity,
                    cacheKey
                });
            }
            catch (error) {
                logger.error('Failed to add item to cart cache', { error, userId });
                throw error;
            }
        });
    }
    removeItemFromCart(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = hash_1.HashUtils.hashUserId(userId);
                const itemKey = `item:${productId}`;
                const pipeline = this.client.pipeline();
                pipeline.hdel(cacheKey, itemKey);
                pipeline.hset(cacheKey, {
                    updatedAt: new Date().toISOString(),
                });
                const expirationSeconds = config_1.config.cart.expirationDays * 24 * 60 * 60;
                pipeline.expire(cacheKey, expirationSeconds);
                yield pipeline.exec();
                logger.debug('Item removed from cart cache', {
                    userId,
                    productId,
                    cacheKey,
                });
            }
            catch (error) {
                logger.error('Failed to remove item to cart cache', { error, userId });
                throw error;
            }
        });
    }
    clearCart(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = hash_1.HashUtils.hashUserId(userId);
                yield this.client.del(cacheKey);
                logger.debug('Cart cleared from cache', { userId, cacheKey });
            }
            catch (error) {
                logger.error('Failed to clear cart from cache', { error, userId });
                throw error;
            }
        });
    }
    getCartItemCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = hash_1.HashUtils.hashUserId(userId);
                const itemCount = yield this.client.hget(cacheKey, 'itemCount');
                return parseInt(itemCount || '0', 10);
            }
            catch (error) {
                logger.error('Failed to get cart item count', { error, userId });
                return 0;
            }
        });
    }
    isHealthy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.client.ping();
                return result === 'PONG' && this.isConnected;
            }
            catch (error) {
                logger.error('Redis health check failed', error);
                return false;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.quit();
                logger.info('Redis client disconnected');
            }
            catch (error) {
                logger.error('Error disconnecting Redis client', error);
            }
        });
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
//# sourceMappingURL=redisService.js.map