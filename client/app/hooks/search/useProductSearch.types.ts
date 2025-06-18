import type { PagedResponse, ProductFilterParams, ProductSearchParams, ProductSummary } from '~/api';

export interface UseProductSearchOptions {
    enableCache?: boolean;
    cacheTime?: number;
    page?: number;
    size?: number;
    autoSearch?: boolean;
    debounceMs?: number;
    minQueryLength?: number;
}

export interface UseProductSearchReturn {
    products: ProductSummary[];
    loading: boolean;
    error: string | null;
    meta: PagedResponse<ProductSummary>['meta'] | null;
    hasMore: boolean;
    isEmpty: boolean;
    totalResults: number;
    currentQuery: string;

    // Actions
    search: (query: string, filters?: ProductFilterParams) => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    clearResults: () => void;
    clearError: () => void;
}

export interface CachedSearchData {
    products: ProductSummary[];
    meta: PagedResponse<ProductSummary>['meta'];
    query: string;
    params: ProductSearchParams;
    timestamp: number;
}

export interface SearchFilters extends Omit<ProductFilterParams, 'keyword'> {
    sortBy?: 'price' | 'rating' | 'newest' | 'popularity';
    priceRange?: {
        min?: number;
        max?: number;
    };
}