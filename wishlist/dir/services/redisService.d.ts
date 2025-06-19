declare class RedisService {
    private client;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getWishlist(userId: string): Promise<string[]>;
    addToWishlist(userId: string, productId: string): Promise<boolean>;
    removeFromWishlist(userId: string, productId: string): Promise<boolean>;
    isInWishlist(userId: string, productId: string): Promise<boolean>;
    getWishlistCount(userId: string): Promise<number>;
    clearWishlist(userId: string): Promise<boolean>;
    cacheProductInfo(productId: string, productInfo: any, ttl?: number): Promise<void>;
    getCachedProductInfo(productId: string): Promise<any | null>;
}
export declare const redisService: RedisService;
export {};
//# sourceMappingURL=redisService.d.ts.map