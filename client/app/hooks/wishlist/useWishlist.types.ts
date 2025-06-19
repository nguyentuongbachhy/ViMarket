// useWishlist.types.ts
import type {
    AddToWishlistRequest,
    MostWishlistedProduct,
    Wishlist,
    WishlistStats,
    WishlistWithPrices
} from '~/api/types';

export interface UseWishlistReturn {
    wishlist: Wishlist | null;
    loading: boolean;
    error: string | null;
    totalItems: number;
    isEmpty: boolean;
    count: number; // Thêm count vào đây

    addToWishlist: (request: AddToWishlistRequest) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    clearWishlist: () => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    clearError: () => void;

    isProductInWishlist: (productId: string) => boolean;
    hasMore: boolean;
}

export interface UseWishlistItemCountReturn {
    count: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export interface UseWishlistStatusReturn {
    isInWishlist: boolean;
    loading: boolean;
    error: string | null;
    toggle: () => Promise<void>;
    refresh: () => Promise<void>;
}

export interface UseWishlistWithPricesReturn {
    wishlistWithPrices: WishlistWithPrices | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export interface UseWishlistStatsReturn {
    stats: WishlistStats | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export interface UseMostWishlistedReturn {
    products: MostWishlistedProduct[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}