export interface CacheStats {
    [cacheName: string]: {
        size: number;
        hitCount: number;
        missCount: number;
        hitRate: number;
        missRate: number;
        evictionCount: number;
    };
}