import type { ApiResponse } from './common';
import type { ProductSummary } from './product';

export interface WishlistItem {
    id: string;
    userId: string;
    productId: string;
    productName?: string;
    productPrice?: number;
    categoryId?: string;
    brandId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WishlistItemWithProduct extends WishlistItem {
    product: ProductSummary | null;
}

export interface Wishlist {
    items: WishlistItemWithProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface WishlistWithPrices {
    items: Array<{
        id: string;
        productId: string;
        product: ProductSummary | null;
        currentPrice?: number;
        originalPrice?: number;
        priceChange?: number;
        priceChangePercent?: number;
        createdAt: Date;
    }>;
}

export interface WishlistStats {
    total: number;
    recent: number;
}

export interface MostWishlistedProduct {
    productId: string;
    _count: {
        productId: number;
    };
}

export interface AddToWishlistRequest {
    productId: string;
}

export interface WishlistItemCount {
    count: number;
}

export interface WishlistStatus {
    productId: string;
    isInWishlist: boolean;
}

export interface WishlistResponse extends ApiResponse<Wishlist> { }
export interface WishlistItemCountResponse extends ApiResponse<WishlistItemCount> { }
export interface WishlistStatusResponse extends ApiResponse<WishlistStatus> { }
export interface WishlistWithPricesResponse extends ApiResponse<WishlistWithPrices> { }
export interface WishlistStatsResponse extends ApiResponse<WishlistStats> { }
export interface MostWishlistedProductsResponse extends ApiResponse<MostWishlistedProduct[]> { }
export interface EmptyWishlistResponse extends ApiResponse<null> { }