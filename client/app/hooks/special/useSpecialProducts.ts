import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiUtils } from '~/api';
import { useHydrated } from "~/hooks/utils/useHydrated";
import type {
    CachedSpecialData,
    PagedResponse,
    ProductSummary,
    SpecialProductFilterParams,
    UseSpecialProductsOptions,
    UseSpecialProductsReturn
} from './useSpecialProducts.types';

const specialProductsCache = {
    topSelling: new Map<string, CachedSpecialData>(),
    topRated: new Map<string, CachedSpecialData>(),
    newArrivals: new Map<string, CachedSpecialData>(),
    ttl: 10 * 60 * 1000,
};

type SpecialProductType = 'topSelling' | 'topRated' | 'newArrivals';

const generateCacheKey = (filters: SpecialProductFilterParams, page: number, size: number): string => {
    return JSON.stringify({ ...filters, page, size });
};

const useSpecialProducts = (
    type: SpecialProductType,
    options: UseSpecialProductsOptions = {}
): UseSpecialProductsReturn => {
    const {
        enableCache = true,
        cacheTime = 10 * 60 * 1000,
        page = 0,
        size = 20,
        autoFetch = true,
        filters = {},
    } = options;

    const hydrated = useHydrated();
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PagedResponse<ProductSummary>['meta'] | null>(null);
    const [currentPage, setCurrentPage] = useState(page);
    const [currentFilters, setCurrentFilters] = useState<SpecialProductFilterParams>(filters);
    const isLoadingMoreRef = useRef(false);
    const hasInitialized = useRef(false);

    const isCacheValid = useCallback((cacheKey: string) => {
        if (!enableCache) return false;
        const cached = specialProductsCache[type].get(cacheKey);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < cacheTime;
    }, [enableCache, cacheTime, type]);

    const getApiMethod = useCallback((type: SpecialProductType) => {
        switch (type) {
            case 'topSelling':
                return api.products.getTopSellingProducts.bind(api.products);
            case 'topRated':
                return api.products.getTopRatedProducts.bind(api.products);
            case 'newArrivals':
                return api.products.getNewArrivals.bind(api.products);
            default:
                throw new Error(`Unknown special product type: ${type}`);
        }
    }, []);

    const loadFromCache = useCallback((cacheKey: string) => {
        const cached = specialProductsCache[type].get(cacheKey);
        if (isCacheValid(cacheKey) && cached) {
            console.log(`Loading ${type} products from cache`);
            setProducts(cached.products);
            setMeta(cached.meta);
            setCurrentPage(0);
            setCurrentFilters(cached.filters);
            return true;
        }
        return false;
    }, [type, isCacheValid]);

    const fetchSpecialProducts = useCallback(async (
        pageNum: number = currentPage,
        newFilters: SpecialProductFilterParams = currentFilters,
        append: boolean = false
    ) => {
        if (!hydrated) return;

        const cacheKey = generateCacheKey(newFilters, pageNum, size);

        // Check cache first for initial load
        if (pageNum === 0 && !append && loadFromCache(cacheKey)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching ${type} products, page:`, pageNum, 'filters:', newFilters, 'append:', append);

            const apiMethod = getApiMethod(type);
            const response = await apiMethod(pageNum, size, newFilters);

            if (!response || !response.content || !Array.isArray(response.content)) {
                throw new Error(`Invalid response format from ${type} API`);
            }

            const validProducts = response.content.filter(product =>
                product &&
                typeof product.id === 'string' &&
                typeof product.name === 'string' &&
                typeof product.price === 'number'
            );

            if (validProducts.length !== response.content.length) {
                console.warn(`Filtered out ${response.content.length - validProducts.length} invalid ${type} products`);
            }

            // Cache only first page data
            if (enableCache && pageNum === 0 && !append) {
                specialProductsCache[type].set(cacheKey, {
                    products: validProducts,
                    meta: response.meta,
                    filters: newFilters,
                    timestamp: Date.now()
                });
            }

            if (append) {
                console.log(`Appending ${type} products to existing list`);
                setProducts(prev => {
                    const newList = [...prev, ...validProducts];
                    console.log(`Total ${type} products after append:`, newList.length);
                    return newList;
                });
            } else {
                console.log(`Replacing ${type} products list`);
                setProducts(validProducts);
            }

            setMeta(response.meta);
            setCurrentPage(pageNum);
            setCurrentFilters(newFilters);

            console.log(`Loaded ${validProducts.length} valid ${type} products`);

        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error(`Failed to fetch ${type} products:`, errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, type, currentPage, currentFilters, size, enableCache, getApiMethod, loadFromCache]);

    // Initialize data on mount
    useEffect(() => {
        if (!hydrated || hasInitialized.current) return;

        console.log(`Initializing ${type} products`);

        const cacheKey = generateCacheKey(filters, 0, size);
        if (!loadFromCache(cacheKey) && autoFetch) {
            fetchSpecialProducts(0, filters, false);
        }

        hasInitialized.current = true;
    }, [hydrated, type, autoFetch, loadFromCache, fetchSpecialProducts, filters, size]);

    const refetch = useCallback(async (newFilters?: SpecialProductFilterParams) => {
        const filtersToUse = newFilters || currentFilters;
        if (enableCache) {
            specialProductsCache[type].clear();
        }
        await fetchSpecialProducts(0, filtersToUse, false);
    }, [fetchSpecialProducts, currentFilters, enableCache, type]);

    const loadMore = useCallback(async () => {
        if (!meta || meta.last || loading || isLoadingMoreRef.current) return;

        isLoadingMoreRef.current = true;
        const nextPage = currentPage + 1;
        console.log(`LoadMore called for ${type}. Current page: ${currentPage}, Next page: ${nextPage}`);

        try {
            await fetchSpecialProducts(nextPage, currentFilters, true);
        } finally {
            isLoadingMoreRef.current = false;
        }
    }, [meta, loading, currentPage, currentFilters, fetchSpecialProducts, type]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const hasMore = meta ? !meta.last : false;

    return {
        products,
        loading,
        error,
        meta,
        hasMore,
        refetch,
        loadMore,
        clearError
    };
};

export const useTopSellingProducts = (options?: UseSpecialProductsOptions): UseSpecialProductsReturn => {
    return useSpecialProducts('topSelling', options);
};

export const useTopRatedProducts = (options?: UseSpecialProductsOptions): UseSpecialProductsReturn => {
    return useSpecialProducts('topRated', options);
};

export const useNewArrivals = (options?: UseSpecialProductsOptions): UseSpecialProductsReturn => {
    return useSpecialProducts('newArrivals', options);
};

export const useProductSearch = (searchTerm: string, options: UseSpecialProductsOptions = {}) => {
    const {
        enableCache = false,
        page = 0,
        size = 20,
        autoFetch = false,
        filters = {},
    } = options;

    const hydrated = useHydrated();
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PagedResponse<ProductSummary>['meta'] | null>(null);
    const [currentPage, setCurrentPage] = useState(page);

    const searchProducts = useCallback(async (term: string, pageNum: number = 0, append: boolean = false) => {
        if (!hydrated || !term.trim()) {
            setProducts([]);
            setMeta(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Searching products for: "${term}", page:`, pageNum, 'append:', append);

            const searchParams = {
                q: term,
                ...filters,
                page: pageNum,
                size,
            };

            const response = await api.products.searchProducts(searchParams);

            if (append) {
                console.log('Appending search results to existing list');
                setProducts(prev => {
                    console.log('Previous search results count:', prev.length);
                    console.log('New search results count:', response.content.length);
                    const newList = [...prev, ...response.content];
                    console.log('Total search results after append:', newList.length);
                    return newList;
                });
            } else {
                console.log('Replacing search results list');
                setProducts(response.content);
            }

            setMeta(response.meta);
            setCurrentPage(pageNum);

            console.log(`Found ${response.content.length} products for "${term}"`);

        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to search products:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, size, filters]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setProducts([]);
            setMeta(null);
            return;
        }

        const timeoutId = setTimeout(() => {
            searchProducts(searchTerm, 0, false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchProducts]);

    const loadMore = useCallback(async () => {
        if (!meta || meta.last || loading || !searchTerm.trim()) return;

        const nextPage = currentPage + 1;
        await searchProducts(searchTerm, nextPage, true);
    }, [meta, loading, currentPage, searchTerm, searchProducts]);

    const refetch = useCallback(async () => {
        if (searchTerm.trim()) {
            await searchProducts(searchTerm, 0, false);
        }
    }, [searchProducts, searchTerm]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const hasMore = meta ? !meta.last : false;

    return {
        products,
        loading,
        error,
        meta,
        hasMore,
        refetch,
        loadMore,
        clearError
    };
};