export type { PagedResponse, ProductFilterParams, ProductSummary } from '~/api';

import type { PagedResponse, ProductFilterParams, ProductSummary } from '~/api';


export interface UseProductsOptions {
    enableCache?: boolean;
    cacheTime?: number;
    initialFilters?: ProductFilterParams;
    autoFetch?: boolean;
}

export interface UseProductsReturn {
    products: ProductSummary[];
    loading: boolean;
    error: string | null;
    meta: PagedResponse<ProductSummary>['meta'] | null;
    hasMore: boolean;
    refetch: (filters?: ProductFilterParams) => Promise<void>;
    loadMore: () => Promise<void>;
    clearError: () => void;
    refresh: () => Promise<void>;
}

export interface CachedData {
    products: ProductSummary[];
    meta: PagedResponse<ProductSummary>['meta'];
    filters: ProductFilterParams;
    timestamp: number;
}
