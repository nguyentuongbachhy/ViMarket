export type { PagedResponse, ProductSummary, SpecialProductFilterParams } from '~/api';

import type { PagedResponse, ProductSummary, SpecialProductFilterParams } from '~/api';

export interface UseSpecialProductsOptions {
    enableCache?: boolean;
    cacheTime?: number;
    page?: number;
    size?: number;
    autoFetch?: boolean;
    filters?: SpecialProductFilterParams;
}

export interface UseSpecialProductsReturn {
    products: ProductSummary[];
    loading: boolean;
    error: string | null;
    meta: PagedResponse<ProductSummary>['meta'] | null;
    hasMore: boolean;
    refetch: (newFilters?: SpecialProductFilterParams) => Promise<void>;
    loadMore: () => Promise<void>;
    clearError: () => void;
}

export interface CachedSpecialData {
    products: ProductSummary[];
    meta: PagedResponse<ProductSummary>['meta'];
    filters: SpecialProductFilterParams;
    timestamp: number;
}