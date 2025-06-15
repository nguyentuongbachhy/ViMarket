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
}

export class RateLimiter {
    private windowMs: number;
    private maxRequests: number;
    private keyGenerator: (req: Request) => string;

    constructor(options: RateLimitOptions) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    }

    private defaultKeyGenerator(req: Request): string {
        const authReq = req as AuthenticatedRequest;
        return authReq.user?.userId || req.ip || '';
    }

    middleware() {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const key = `rate_limit:${this.keyGenerator(req)}`;
                const window = Math.floor(Date.now() / this.windowMs);
                const redisKey = `${key}:${window}`;

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
                    });

                    res.set({
                        'X-RateLimit-Limit': this.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(Date.now() + this.windowMs).toISOString(),
                    });

                    ResponseUtils.error(res, 'Too many requests', 429);
                    return;
                }

                res.set({
                    'X-RateLimit-Limit': this.maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, this.maxRequests - currentCount).toString(),
                    'X-RateLimit-Reset': new Date(Date.now() + this.windowMs).toISOString(),
                });

                next();
            } catch (error) {
                logger.error('Rate limiter error', error);
                next();
            }
        };
    }

    static createCartRateLimiter(): RateLimiter {
        return new RateLimiter({
            windowMs: 60 * 1000,
            maxRequests: 30,
        });
    }

    static createGeneralRateLimiter(): RateLimiter {
        return new RateLimiter({
            windowMs: 60 * 1000,
            maxRequests: 100,
        });
    }
}