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
exports.RateLimiter = void 0;
const redisService_1 = require("@/services/redisService");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const logger = new logger_1.Logger('RateLimiter');
class RateLimiter {
    constructor(options) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    }
    defaultKeyGenerator(req) {
        var _a;
        const authReq = req;
        return ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.userId) || req.ip || '';
    }
    middleware() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `rate_limit:${this.keyGenerator(req)}`;
                const window = Math.floor(Date.now() / this.windowMs);
                const redisKey = `${key}:${window}`;
                const currentCount = yield redisService_1.redisService['client'].incr(redisKey);
                if (currentCount === 1) {
                    yield redisService_1.redisService['client'].expire(redisKey, Math.ceil(this.windowMs / 1000));
                }
                if (currentCount > this.maxRequests) {
                    logger.warn('Rate limit exceeded', {
                        key: this.keyGenerator(req),
                        currentCount,
                        maxRequests: this.maxRequests,
                        windowMs: this.windowMs,
                    });
                    res.set({
                        'X-RateLimit-Limit': this.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(Date.now() + this.windowMs).toISOString(),
                    });
                    response_1.ResponseUtils.error(res, 'Too many requests', 429);
                    return;
                }
                res.set({
                    'X-RateLimit-Limit': this.maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, this.maxRequests - currentCount).toString(),
                    'X-RateLimit-Reset': new Date(Date.now() + this.windowMs).toISOString(),
                });
                next();
            }
            catch (error) {
                logger.error('Rate limiter error', error);
                next();
            }
        });
    }
    static createCartRateLimiter() {
        return new RateLimiter({
            windowMs: 60 * 1000,
            maxRequests: 30,
        });
    }
    static createGeneralRateLimiter() {
        return new RateLimiter({
            windowMs: 60 * 1000,
            maxRequests: 100,
        });
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rateLimiter.js.map