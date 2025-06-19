import { WishlistItem } from '@/types';
declare class WishlistService {
    addToWishlist(userId: string, productId: string): Promise<WishlistItem>;
    removeFromWishlist(userId: string, productId: string): Promise<boolean>;
    getUserWishlist(userId: string, page?: number, limit?: number): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    isInWishlist(userId: string, productId: string): Promise<boolean>;
    getWishlistCount(userId: string): Promise<number>;
    clearWishlist(userId: string): Promise<boolean>;
    getWishlistWithPrices(userId: string): Promise<any[]>;
    private enhanceWithProductInfo;
    private sendPriceRequest;
    getMostWishlistedProducts(limit?: number): Promise<(import("@/generated/prisma").Prisma.PickEnumerable<import("@/generated/prisma").Prisma.WishlistGroupByOutputType, "productId"[]> & {
        _count: {
            productId: number;
        };
    })[]>;
    getWishlistStats(userId: string): Promise<{
        total: number;
        recent: number;
    }>;
}
export declare const wishlistService: WishlistService;
export {};
//# sourceMappingURL=wishlistService.d.ts.map