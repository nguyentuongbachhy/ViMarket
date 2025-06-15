import { redisService } from '@/services/redisService';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from './auth';

const logger = new Logger('RateLimiter');

interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

export class RateLimiter {
    private windowMs: number;
    private maxRequests: number;
    private keyGenerator: (req: Request) => string;
    private skipSuccessfulRequests: boolean;
    private skipFailedRequests: boolean;

    constructor(options: RateLimitOptions) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
        this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
        this.skipFailedRequests = options.skipFailedRequests || false;
    }

    private defaultKeyGenerator(req: Request): string {
        const authReq = req as AuthenticatedRequest;
        // Prefer user ID over IP for better user experience
        return authReq.user?.userId || req.ip || 'unknown';
    }

    middleware() {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                // Skip rate limiting in development
                if (process.env.NODE_ENV === 'development') {
                    next();
                    return;
                }

                const key = `rate_limit:${this.keyGenerator(req)}`;
                const window = Math.floor(Date.now() / this.windowMs);
                const redisKey = `${key}:${window}`;

                // Access the private client through array notation
                const currentCount = await redisService['client'].incr(redisKey);

                if (currentCount === 1) {
                    await redisService['client'].expire(redisKey, Math.ceil(this.windowMs / 1000));
                }

                if (currentCount > this.maxRequests) {
                    logger.warn('Rate limit exceeded', {
                        key: this.keyGenerator(req),
                        currentCount,
                        maxRequests: this.maxRequests,
                        windowMs: this.windowMs,
                        path: req.path,
                        method: req.method,
                    });

                    res.set({
                        'X-RateLimit-Limit': this.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(Date.now() + this.windowMs).toISOString(),
                    });

                    ResponseUtils.error(res, 'Too many requests. Please try again later.', 429);
                    return;
                }

                res.set({
                    'X-RateLimit-Limit': this.maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, this.maxRequests - currentCount).toString(),
                    'X-RateLimit-Reset': new Date(Date.now() + this.windowMs).toISOString(),
                });

                next();
            } catch (error) {
                logger.error('Rate limiter error', { error, path: req.path });
                // Continue on rate limiter error
                next();
            }
        };
    }

    static createWishlistRateLimiter(): RateLimiter {
        return new RateLimiter({
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100, // Increased from 30 to 100
            skipSuccessfulRequests: true, // Don't count successful requests
        });
    }

    static createGeneralRateLimiter(): RateLimiter {
        return new RateLimiter({
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 200, // Increased from 100 to 200
            skipSuccessfulRequests: true, // Don't count successful requests
        });
    }
}