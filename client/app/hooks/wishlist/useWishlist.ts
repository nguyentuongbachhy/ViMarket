import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiUtils, type AddToWishlistRequest, type MostWishlistedProduct, type Wishlist, type WishlistStats, type WishlistWithPrices } from '~/api';
import { wishlistService } from '~/api/services/wishlistService';
import { useHydrated } from '~/hooks/utils/useHydrated';
import type {
    UseMostWishlistedReturn,
    UseWishlistItemCountReturn,
    UseWishlistReturn,
    UseWishlistStatsReturn,
    UseWishlistStatusReturn,
    UseWishlistWithPricesReturn
} from './useWishlist.types';

export const useWishlist = (initialLimit: number = 20): UseWishlistReturn => {
    const [wishlist, setWishlist] = useState<Wishlist | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(initialLimit);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const totalItems = wishlist?.total || 0;
    const isEmpty = !wishlist || !wishlist.items || wishlist.items.length === 0;
    const hasMore = wishlist ? wishlist.page < wishlist.totalPages : false;
    const count = wishlist?.total || 0;

    const fetchWishlist = useCallback(async (page: number = 1, append: boolean = false) => {
        if (!hydrated || loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const wishlistData = await wishlistService.getWishlist(page, limit);

            if (!wishlistData || !Array.isArray(wishlistData.items)) {
                console.warn('Invalid wishlist data received:', wishlistData);
                setWishlist({
                    items: [],
                    total: 0,
                    page: 1,
                    limit: limit,
                    totalPages: 0
                });
                return;
            }

            if (append && wishlist) {
                setWishlist({
                    ...wishlistData,
                    items: [...wishlist.items, ...wishlistData.items]
                });
            } else {
                setWishlist(wishlistData);
            }

            setCurrentPage(page);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch wishlist:', errorMessage, err);

            if (!append) {
                setWishlist({
                    items: [],
                    total: 0,
                    page: 1,
                    limit: limit,
                    totalPages: 0
                });
            }
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hydrated, limit, wishlist]);

    const addToWishlist = useCallback(async (request: AddToWishlistRequest) => {
        if (!request.productId || loadingRef.current) {
            throw new Error('Product ID is required');
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            await wishlistService.addToWishlist(request);
            // Refresh wishlist after adding
            await fetchWishlist(1, false);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [fetchWishlist]);

    const removeFromWishlist = useCallback(async (productId: string) => {
        if (!productId || loadingRef.current) {
            throw new Error('Product ID is required');
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            await wishlistService.removeFromWishlist(productId);

            if (wishlist && wishlist.items) {
                const updatedItems = wishlist.items.filter(item => item.productId !== productId);
                setWishlist({
                    ...wishlist,
                    items: updatedItems,
                    total: Math.max(0, wishlist.total - 1)
                });
            }
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [wishlist]);

    const clearWishlist = useCallback(async () => {
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            await wishlistService.clearWishlist();
            setWishlist({
                items: [],
                total: 0,
                page: 1,
                limit: limit,
                totalPages: 0
            });
            setCurrentPage(1);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [limit]);

    const loadMore = useCallback(async () => {
        if (hasMore && !loading && !loadingRef.current) {
            await fetchWishlist(currentPage + 1, true);
        }
    }, [hasMore, loading, currentPage, fetchWishlist]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        setCurrentPage(1);
        await fetchWishlist(1, false);
    }, [fetchWishlist]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const isProductInWishlist = useCallback((productId: string): boolean => {
        if (!wishlist || !wishlist.items || !productId) return false;
        return wishlist.items.some(item => item.productId === productId);
    }, [wishlist]);

    // Fix: Đổi điều kiện từ !hydrated thành hydrated
    useEffect(() => {
        if (hydrated && !isInitialized.current) {
            isInitialized.current = true;
            fetchWishlist(1, false);
        }
    }, [hydrated, fetchWishlist]);

    return {
        wishlist,
        loading,
        error,
        totalItems,
        isEmpty,
        count,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        loadMore,
        refresh,
        clearError,
        isProductInWishlist,
        hasMore,
    };
};

export const useWishlistItemCount = (): UseWishlistItemCountReturn => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const fetchCount = useCallback(async () => {
        if (!hydrated || loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const itemCount = await wishlistService.getWishlistCount();
            setCount(itemCount || 0);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setCount(0);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hydrated]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        await fetchCount();
    }, [fetchCount]);

    useEffect(() => {
        if (hydrated && !isInitialized.current) {
            isInitialized.current = true;
            fetchCount();
        }
    }, [hydrated, fetchCount]);

    return {
        count,
        loading,
        error,
        refresh,
    };
};

export const useWishlistStatus = (productId: string): UseWishlistStatusReturn => {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const checkStatus = useCallback(async () => {
        if (!hydrated || !productId || loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const status = await wishlistService.checkWishlistStatus(productId);
            setIsInWishlist(status);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setIsInWishlist(false);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hydrated, productId]);

    const toggle = useCallback(async () => {
        if (!productId) {
            throw new Error('Product ID is required');
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const newStatus = await wishlistService.toggleWishlist(productId);
            setIsInWishlist(newStatus);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [productId]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        await checkStatus();
    }, [checkStatus]);

    useEffect(() => {
        if (hydrated && !isInitialized.current) {
            isInitialized.current = true;
            checkStatus();
        }
    }, [hydrated, checkStatus]);

    return {
        isInWishlist,
        loading,
        error,
        toggle,
        refresh,
    };
};

export const useQuickWishlistToggle = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const toggle = useCallback(async (productId: string) => {
        if (!productId || loadingRef.current) {
            setError('Product ID is required');
            return null;
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const newStatus = await wishlistService.toggleWishlist(productId);
            return newStatus;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        toggle,
        loading,
        error,
        clearError,
    };
};

export const useWishlistWithPrices = (): UseWishlistWithPricesReturn => {
    const [wishlistWithPrices, setWishlistWithPrices] = useState<WishlistWithPrices | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const fetchWishlistWithPrices = useCallback(async () => {
        if (!hydrated || loadingRef.current) return;

        loadingRef.current = true
        setLoading(true);
        setError(null);

        try {
            const data = await wishlistService.getWishlistWithPrices();
            setWishlistWithPrices(data || { items: [] });
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setWishlistWithPrices({ items: [] });
        } finally {
            setLoading(false);
            loadingRef.current = false
        }
    }, [hydrated]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        await fetchWishlistWithPrices();
    }, [fetchWishlistWithPrices]);

    useEffect(() => {
        if (hydrated && !isInitialized.current) {
            isInitialized.current = true
            fetchWishlistWithPrices();
        }

    }, [hydrated, fetchWishlistWithPrices]);

    return {
        wishlistWithPrices,
        loading,
        error,
        refresh,
    };
};

export const useWishlistStats = (): UseWishlistStatsReturn => {
    const [stats, setStats] = useState<WishlistStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const fetchStats = useCallback(async () => {
        if (!hydrated || loadingRef.current) return;

        loadingRef.current = true
        setLoading(true);
        setError(null);

        try {
            const data = await wishlistService.getWishlistStats();
            setStats(data || { total: 0, recent: 0 });
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setStats({ total: 0, recent: 0 });
        } finally {
            setLoading(false);
            loadingRef.current = false
        }
    }, [hydrated]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        await fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!hydrated && !isInitialized.current) {
            isInitialized.current = true
            fetchStats();
        }
    }, [hydrated, fetchStats]);

    return {
        stats,
        loading,
        error,
        refresh,
    };
};

export const useMostWishlisted = (limit: number = 10): UseMostWishlistedReturn => {
    const [products, setProducts] = useState<MostWishlistedProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const fetchMostWishlisted = useCallback(async () => {
        if (!hydrated || loadingRef.current) return;

        loadingRef.current = true
        setLoading(true);
        setError(null);

        try {
            const data = await wishlistService.getMostWishlistedProducts(limit);
            setProducts(Array.isArray(data) ? data : []);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setProducts([]);
        } finally {
            setLoading(false);
            loadingRef.current = false
        }
    }, [hydrated, limit]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        await fetchMostWishlisted();
    }, [fetchMostWishlisted]);

    useEffect(() => {
        if (!hydrated && !isInitialized.current) {
            isInitialized.current = true
            fetchMostWishlisted();
        }
    }, [fetchMostWishlisted]);

    return {
        products,
        loading,
        error,
        refresh,
    };
};