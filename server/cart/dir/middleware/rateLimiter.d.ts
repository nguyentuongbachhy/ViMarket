import { NextFunction, Request, Response } from 'express';
interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
}
export declare class RateLimiter {
    private windowMs;
    private maxRequests;
    private keyGenerator;
    constructor(options: RateLimitOptions);
    private defaultKeyGenerator;
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static createCartRateLimiter(): RateLimiter;
    static createGeneralRateLimiter(): RateLimiter;
}
export {};
//# sourceMappingURL=rateLimiter.d.ts.map