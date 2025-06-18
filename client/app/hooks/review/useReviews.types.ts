export type {
    PagedResponse,
    PageMeta, ReviewCreate,
    ReviewFilterParams,
    ReviewInfo,
    ReviewStats
} from '~/api/types';

import type {
    PageMeta,
    ReviewCreate,
    ReviewFilterParams,
    ReviewInfo,
    ReviewStats
} from '~/api/types';

export interface UseReviewsOptions {
    productId: string;
    enableCache?: boolean;
    cacheTime?: number;
    initialFilters?: ReviewFilterParams;
    autoFetch?: boolean;
}

export interface UseReviewsReturn {
    reviews: ReviewInfo[];
    stats: ReviewStats | null;
    loading: boolean;
    error: string | null;
    meta: PageMeta | null;
    hasMore: boolean;
    fetchReviews: (filters?: ReviewFilterParams, append?: boolean) => Promise<void>;
    fetchStats: () => Promise<void>;
    loadMore: () => Promise<void>;
    refetch: (filters?: ReviewFilterParams) => Promise<void>;
    refresh: () => Promise<void>;
    clearError: () => void;
}

export interface UseReviewActionsReturn {
    createReview: (reviewData: Omit<ReviewCreate, 'productId'>) => Promise<ReviewInfo | null>;
    updateReview: (reviewId: string, reviewData: Partial<ReviewCreate>) => Promise<ReviewInfo | null>;
    deleteReview: (reviewId: string) => Promise<boolean>;
    markHelpful: (reviewId: string) => Promise<boolean>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

export interface UseReviewRepliesOptions {
    reviewId: string;
    enableCache?: boolean;
    cacheTime?: number;
    initialFilters?: ReviewFilterParams;
    autoFetch?: boolean;
}

export interface UseReviewRepliesReturn {
    replies: ReviewInfo[];
    loading: boolean;
    error: string | null;
    meta: PageMeta | null;
    hasMore: boolean;
    fetchReplies: (filters?: ReviewFilterParams, append?: boolean) => Promise<void>;
    loadMore: () => Promise<void>;
    refetch: (filters?: ReviewFilterParams) => Promise<void>;
    refresh: () => Promise<void>;
    clearError: () => void;
}

export interface CachedReviewData {
    reviews: ReviewInfo[];
    meta: PageMeta;
    filters: ReviewFilterParams;
    timestamp: number;
}