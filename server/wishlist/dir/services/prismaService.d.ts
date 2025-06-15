declare class PrismaService {
    private prisma;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    addWishlistItem(userId: string, productId: string, productInfo?: any): Promise<{
        id: string;
        userId: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
        productName: string | null;
        productPrice: import("@/generated/prisma/runtime/library").Decimal | null;
        categoryId: string | null;
        brandId: string | null;
    }>;
    removeWishlistItem(userId: string, productId: string): Promise<{
        id: string;
        userId: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
        productName: string | null;
        productPrice: import("@/generated/prisma/runtime/library").Decimal | null;
        categoryId: string | null;
        brandId: string | null;
    }>;
    getUserWishlist(userId: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            userId: string;
            productId: string;
            createdAt: Date;
            updatedAt: Date;
            productName: string | null;
            productPrice: import("@/generated/prisma/runtime/library").Decimal | null;
            categoryId: string | null;
            brandId: string | null;
        }[];
        total: number;
    }>;
    getWishlistItem(userId: string, productId: string): Promise<{
        id: string;
        userId: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
        productName: string | null;
        productPrice: import("@/generated/prisma/runtime/library").Decimal | null;
        categoryId: string | null;
        brandId: string | null;
    } | null>;
    clearUserWishlist(userId: string): Promise<import("@/generated/prisma").Prisma.BatchPayload>;
    getWishlistCount(userId: string): Promise<number>;
    logWishlistEvent(userId: string, productId: string, action: string, metadata?: any): Promise<{
        id: string;
        userId: string;
        productId: string;
        createdAt: Date;
        action: string;
        metadata: import("@/generated/prisma/runtime/library").JsonValue | null;
    }>;
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
export declare const prismaService: PrismaService;
export {};
//# sourceMappingURL=prismaService.d.ts.map