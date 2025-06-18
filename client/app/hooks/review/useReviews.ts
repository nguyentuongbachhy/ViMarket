import { useCallback, useEffect, useState } from "react";
import { api, ApiUtils } from '~/api';
import { useHydrated } from "~/hooks/utils/useHydrated";
import type {
    CachedReviewData,
    PagedResponse,
    ReviewCreate,
    ReviewFilterParams,
    ReviewInfo,
    ReviewStats,
    UseReviewActionsReturn,
    UseReviewRepliesOptions,
    UseReviewRepliesReturn,
    UseReviewsOptions,
    UseReviewsReturn
} from "./useReviews.types";


// Review cache similar to product cache
const reviewCache = {
    data: new Map<string, CachedReviewData>(),
    ttl: 5 * 60 * 1000, // 5 minutes
};

const generateCacheKey = (productId: string, filters: ReviewFilterParams): string => {
    return `${productId}:${JSON.stringify(filters)}`;
};

export const useReviews = (options: UseReviewsOptions): UseReviewsReturn => {
    const {
        productId,
        enableCache = true,
        cacheTime = 5 * 60 * 1000,
        initialFilters = { page: 0, size: 20, level: 1 },
        autoFetch = true
    } = options;

    const hydrated = useHydrated();
    const [reviews, setReviews] = useState<ReviewInfo[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PagedResponse<ReviewInfo>['meta'] | null>(null);
    const [currentFilters, setCurrentFilters] = useState<ReviewFilterParams>(initialFilters);

    const isCacheValid = useCallback((cacheKey: string) => {
        if (!enableCache) return false;
        const cached = reviewCache.data.get(cacheKey);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < cacheTime;
    }, [enableCache, cacheTime]);

    const fetchReviews = useCallback(async (filters: ReviewFilterParams = currentFilters, append: boolean = false) => {
        if (!hydrated || !productId) return;

        const cacheKey = generateCacheKey(productId, filters);

        // Check cache for non-append requests
        if (isCacheValid(cacheKey) && !append) {
            const cached = reviewCache.data.get(cacheKey);
            if (cached) {
                console.log('Using cached reviews for:', filters);
                setReviews(cached.reviews);
                setMeta(cached.meta);
                setCurrentFilters(filters);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching reviews with filters:', filters, 'append:', append);

            const response = await api.reviews.getProductReviews.call(api.reviews, productId, filters);

            console.log(response);

            if (!response || !response.content || !Array.isArray(response.content)) {
                throw new Error('Invalid response format from API');
            }

            const validReviews = response.content.filter(review =>
                review &&
                typeof review.id === 'string' &&
                typeof review.productId === 'string' &&
                typeof review.rating === 'number'
            );

            if (validReviews.length !== response.content.length) {
                console.warn(`Filtered out ${response.content.length - validReviews.length} invalid reviews`);
            }

            // Cache only first page non-append requests
            if (enableCache && !append && filters.page === 0) {
                reviewCache.data.set(cacheKey, {
                    reviews: validReviews,
                    meta: response.meta,
                    filters,
                    timestamp: Date.now()
                });
            }

            if (append) {
                console.log('Appending reviews to existing list');
                setReviews(prev => {
                    console.log('Previous reviews count:', prev.length);
                    console.log('New reviews count:', validReviews.length);
                    const newList = [...prev, ...validReviews];
                    console.log('Total reviews after append:', newList.length);
                    return newList;
                });
            } else {
                console.log('Replacing reviews list');
                setReviews(validReviews);
            }

            setMeta(response.meta);
            setCurrentFilters(filters);

            console.log(`Loaded ${validReviews.length} valid reviews`);

        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch reviews:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, productId, isCacheValid, enableCache, currentFilters]);

    const fetchStats = useCallback(async () => {
        if (!hydrated || !productId) return;

        try {
            const statsData = await api.reviews.getProductReviewStats.call(api.reviews, productId);
            setStats(statsData);
        } catch (err: any) {
            console.error('Failed to fetch review stats:', ApiUtils.formatErrorMessage(err));
        }
    }, [hydrated, productId]);

    const refetch = useCallback(async (filters?: ReviewFilterParams) => {
        const newFilters = filters || currentFilters;

        // Clear cache for this specific query
        if (enableCache) {
            const cacheKey = generateCacheKey(productId, newFilters);
            reviewCache.data.delete(cacheKey);
        }

        await fetchReviews(newFilters, false);
    }, [fetchReviews, currentFilters, enableCache, productId]);

    const loadMore = useCallback(async () => {
        if (!meta || meta.last || loading) return;

        const nextPageFilters = {
            ...currentFilters,
            page: (currentFilters.page || 0) + 1
        };

        await fetchReviews(nextPageFilters, true);
    }, [meta, loading, currentFilters, fetchReviews]);

    const refresh = useCallback(async () => {
        // Clear all cache for this product
        if (enableCache) {
            Array.from(reviewCache.data.keys())
                .filter(key => key.startsWith(productId))
                .forEach(key => reviewCache.data.delete(key));
        }

        await Promise.all([
            fetchReviews(currentFilters, false),
            fetchStats()
        ]);
    }, [fetchReviews, fetchStats, currentFilters, enableCache, productId]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Auto fetch on mount or productId change
    useEffect(() => {
        if (autoFetch) {
            fetchReviews();
        }
    }, [fetchReviews, autoFetch]);

    // Auto fetch stats
    useEffect(() => {
        if (autoFetch) {
            fetchStats();
        }
    }, [fetchStats, autoFetch]);

    const hasMore = meta ? !meta.last : false;

    return {
        reviews,
        stats,
        loading,
        error,
        meta,
        hasMore,
        fetchReviews,
        fetchStats,
        loadMore,
        refetch,
        refresh,
        clearError
    };
};

export const useReviewReplies = (options: UseReviewRepliesOptions): UseReviewRepliesReturn => {
    const {
        reviewId,
        enableCache = true,
        cacheTime = 5 * 60 * 1000,
        initialFilters = { page: 0, size: 10 },
        autoFetch = false
    } = options;

    const hydrated = useHydrated();
    const [replies, setReplies] = useState<ReviewInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PagedResponse<ReviewInfo>['meta'] | null>(null);
    const [currentFilters, setCurrentFilters] = useState<ReviewFilterParams>(initialFilters);

    const isCacheValid = useCallback((cacheKey: string) => {
        if (!enableCache) return false;
        const cached = reviewCache.data.get(cacheKey);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < cacheTime;
    }, [enableCache, cacheTime]);

    const fetchReplies = useCallback(async (filters: ReviewFilterParams = currentFilters, append: boolean = false) => {
        if (!hydrated || !reviewId) return;

        const cacheKey = generateCacheKey(`replies:${reviewId}`, filters);

        if (isCacheValid(cacheKey) && !append) {
            const cached = reviewCache.data.get(cacheKey);
            if (cached) {
                console.log('Using cached replies for:', filters);
                setReplies(cached.reviews);
                setMeta(cached.meta);
                setCurrentFilters(filters);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.reviews.getReviewReplies.call(api.reviews, reviewId, filters);

            if (!response || !response.content || !Array.isArray(response.content)) {
                throw new Error('Invalid response format from API');
            }

            if (enableCache && !append && filters.page === 0) {
                reviewCache.data.set(cacheKey, {
                    reviews: response.content,
                    meta: response.meta,
                    filters,
                    timestamp: Date.now()
                });
            }

            if (append) {
                setReplies(prev => [...prev, ...response.content]);
            } else {
                setReplies(response.content);
            }

            setMeta(response.meta);
            setCurrentFilters(filters);

        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch replies:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, reviewId, isCacheValid, enableCache, currentFilters]);

    const refetch = useCallback(async (filters?: ReviewFilterParams) => {
        const newFilters = filters || currentFilters;

        if (enableCache) {
            const cacheKey = generateCacheKey(`replies:${reviewId}`, newFilters);
            reviewCache.data.delete(cacheKey);
        }

        await fetchReplies(newFilters, false);
    }, [fetchReplies, currentFilters, enableCache, reviewId]);

    const loadMore = useCallback(async () => {
        if (!meta || meta.last || loading) return;

        const nextPageFilters = {
            ...currentFilters,
            page: (currentFilters.page || 0) + 1
        };

        await fetchReplies(nextPageFilters, true);
    }, [meta, loading, currentFilters, fetchReplies]);

    const refresh = useCallback(async () => {
        if (enableCache) {
            Array.from(reviewCache.data.keys())
                .filter(key => key.startsWith(`replies:${reviewId}`))
                .forEach(key => reviewCache.data.delete(key));
        }

        await fetchReplies(currentFilters, false);
    }, [fetchReplies, currentFilters, enableCache, reviewId]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchReplies();
        }
    }, [fetchReplies, autoFetch]);

    const hasMore = meta ? !meta.last : false;

    return {
        replies,
        loading,
        error,
        meta,
        hasMore,
        fetchReplies,
        loadMore,
        refetch,
        refresh,
        clearError
    };
};

export const useReviewActions = (productId: string): UseReviewActionsReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();

    const createReview = useCallback(async (reviewData: Omit<ReviewCreate, 'productId'>): Promise<ReviewInfo | null> => {
        if (!hydrated) return null;

        setLoading(true);
        setError(null);

        try {
            const review = await api.reviews.createReview.call(api.reviews, {
                ...reviewData,
                productId: productId
            });
            return review;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to create review:', errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [hydrated, productId]);

    const updateReview = useCallback(async (reviewId: string, reviewData: Partial<ReviewCreate>): Promise<ReviewInfo | null> => {
        if (!hydrated) return null;

        setLoading(true);
        setError(null);

        try {
            const review = await api.reviews.updateReview.call(api.reviews, reviewId, reviewData);
            return review;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to update review:', errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [hydrated]);

    // ✅ Thêm method delete review
    const deleteReview = useCallback(async (reviewId: string): Promise<boolean> => {
        if (!hydrated) return false;

        setLoading(true);
        setError(null);

        try {
            await api.reviews.deleteReview.call(api.reviews, reviewId);
            return true;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to delete review:', errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, [hydrated]);

    const markHelpful = useCallback(async (reviewId: string): Promise<boolean> => {
        if (!hydrated) return false;

        try {
            await api.reviews.markReviewHelpful.call(api.reviews, reviewId);
            return true;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to mark review helpful:', errorMessage);
            return false;
        }
    }, [hydrated]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        createReview,
        updateReview,
        deleteReview,
        markHelpful,
        loading,
        error,
        clearError
    };
};