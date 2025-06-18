import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiUtils, type PagedResponse, type ProductSearchParams, type ProductSummary } from '~/api';
import { useHydrated } from '~/hooks/utils/useHydrated';
import type {
    CachedSearchData,
    UseProductSearchOptions,
    UseProductSearchReturn
} from './useProductSearch.types';

// Cache for search results
const searchCache = {
    data: new Map<string, CachedSearchData>(),
    ttl: 5 * 60 * 1000, // 5 minutes
};

const generateCacheKey = (params: ProductSearchParams): string => {
    return JSON.stringify(params);
};

export const useProductSearch = (
    initialQuery: string = '',
    options: UseProductSearchOptions = {}
): UseProductSearchReturn => {
    const {
        enableCache = true,
        cacheTime = 5 * 60 * 1000,
        page = 0,
        size = 20,
        autoSearch = false,
        debounceMs = 500,
        minQueryLength = 2,
    } = options;

    const hydrated = useHydrated();
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PagedResponse<ProductSummary>['meta'] | null>(null);
    const [currentQuery, setCurrentQuery] = useState(initialQuery);
    const [currentParams, setCurrentParams] = useState<ProductSearchParams>({
        q: initialQuery,
        page,
        size
    });

    const loadingRef = useRef(false);
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const searchAbortController = useRef<AbortController | undefined>(undefined);

    const isEmpty = products.length === 0 && !loading;
    const hasMore = meta ? !meta.last : false;
    const totalResults = meta?.totalElements || 0;

    const isCacheValid = useCallback((cacheKey: string) => {
        if (!enableCache) return false;
        const cached = searchCache.data.get(cacheKey);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < cacheTime;
    }, [enableCache, cacheTime]);

    const performSearch = useCallback(async (
        query: string,
        searchParams: Partial<ProductSearchParams> = {},
        append: boolean = false
    ) => {
        if (!hydrated || !query.trim() || query.trim().length < minQueryLength) {
            if (!query.trim()) {
                setProducts([]);
                setMeta(null);
                setCurrentQuery('');
            }
            return;
        }

        const trimmedQuery = query.trim();
        const fullParams: ProductSearchParams = {
            q: trimmedQuery,
            page: append ? (searchParams.page || 0) : 0,
            size,
            ...searchParams,
        };
        const cacheKey = generateCacheKey(fullParams);

        // Cancel previous search
        if (searchAbortController.current) {
            searchAbortController.current.abort();
        }
        searchAbortController.current = new AbortController();

        // Check cache for initial search (not for load more)
        if (!append && isCacheValid(cacheKey)) {
            const cached = searchCache.data.get(cacheKey);
            if (cached) {
                console.log('Using cached search results for:', trimmedQuery);
                setProducts(cached.products);
                setMeta(cached.meta);
                setCurrentQuery(trimmedQuery);
                setCurrentParams(fullParams);
                return;
            }
        }

        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);
        setCurrentQuery(trimmedQuery);

        try {
            console.log('Searching products:', trimmedQuery, 'params:', fullParams, 'append:', append);

            const response = await api.products.searchProducts(fullParams);

            // Check if search was aborted
            if (searchAbortController.current?.signal.aborted) {
                return;
            }

            if (!response || !response.content || !Array.isArray(response.content)) {
                throw new Error('Invalid search response format');
            }

            const validProducts = response.content.filter(product =>
                product &&
                typeof product.id === 'string' &&
                typeof product.name === 'string' &&
                typeof product.price === 'number'
            );

            // Cache results for initial search
            if (enableCache && !append && fullParams.page === 0) {
                searchCache.data.set(cacheKey, {
                    products: validProducts,
                    meta: response.meta,
                    query: trimmedQuery,
                    params: fullParams,
                    timestamp: Date.now()
                });
            }

            if (append) {
                setProducts(prev => [...prev, ...validProducts]);
            } else {
                setProducts(validProducts);
            }

            setMeta(response.meta);
            setCurrentParams(fullParams);

            console.log(`Found ${validProducts.length} products for "${trimmedQuery}"`);

        } catch (err: any) {
            if (err.name === 'AbortError') return;

            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Search failed:', errorMessage);

            if (!append) {
                setProducts([]);
                setMeta(null);
            }
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hydrated, minQueryLength, size, isCacheValid, enableCache]);

    const search = useCallback(async (query: string, params: Partial<ProductSearchParams> = {}) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            performSearch(query, params, false);
        }, debounceMs);
    }, [performSearch, debounceMs]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loading || loadingRef.current || !currentQuery.trim()) return;

        const nextPageParams = {
            ...currentParams,
            page: (currentParams.page || 0) + 1
        };

        await performSearch(currentQuery, nextPageParams, true);
    }, [hasMore, loading, currentQuery, currentParams, performSearch]);

    const refresh = useCallback(async () => {
        if (!currentQuery.trim()) return;

        if (enableCache) {
            const cacheKey = generateCacheKey(currentParams);
            searchCache.data.delete(cacheKey);
        }

        await performSearch(currentQuery, { ...currentParams, page: 0 }, false);
    }, [currentQuery, currentParams, enableCache, performSearch]);

    const clearResults = useCallback(() => {
        setProducts([]);
        setMeta(null);
        setCurrentQuery('');
        setError(null);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchAbortController.current) {
            searchAbortController.current.abort();
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Auto search on mount if initialQuery provided
    useEffect(() => {
        if (autoSearch && initialQuery.trim() && hydrated) {
            search(initialQuery);
        }
    }, [autoSearch, initialQuery, hydrated, search]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            if (searchAbortController.current) {
                searchAbortController.current.abort();
            }
        };
    }, []);

    return {
        products,
        loading,
        error,
        meta,
        hasMore,
        isEmpty,
        totalResults,
        currentQuery,
        search,
        loadMore,
        refresh,
        clearResults,
        clearError,
    };
};

// Quick search hook for immediate results
export const useQuickProductSearch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const quickSearch = useCallback(async (query: string, params: Partial<ProductSearchParams> = {}) => {
        if (!query.trim() || loadingRef.current) return [];

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const searchParams: ProductSearchParams = {
                q: query.trim(),
                page: 0,
                size: params.size || 10,
                ...params,
            };

            const response = await api.products.searchProducts(searchParams);
            return response.content || [];
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        quickSearch,
        loading,
        error,
        clearError,
    };
};

// Search suggestions hook
export const useSearchSuggestions = (query: string, enabled: boolean = true) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim() || searchQuery.length < 2 || !enabled) {
            setSuggestions([]);
            return;
        }

        setLoading(true);

        try {
            const response = await api.products.searchProducts({
                q: searchQuery.trim(),
                page: 0,
                size: 5
            });

            const productSuggestions = response.content.map(product => product.name);
            setSuggestions(productSuggestions);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchSuggestions(query);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, fetchSuggestions]);

    return {
        suggestions,
        loading,
    };
};