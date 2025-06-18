import { useCallback, useEffect, useState } from "react";
import { api, ApiUtils, type ProductDetail } from '~/api';
import { useHydrated } from "~/hooks/utils/useHydrated";
import type { CachedData, PagedResponse, ProductFilterParams, ProductSummary, UseProductsOptions, UseProductsReturn } from "./useProducts.types";

const productCache = {
    data: new Map<string, CachedData>(),
    ttl: 5 * 60 * 1000,
}

const generateCacheKey = (filters: ProductFilterParams): string => {
    return JSON.stringify(filters);
};

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
    const {
        enableCache = true,
        cacheTime = 5 * 60 * 1000,
        initialFilters = { page: 0, size: 20 },
        autoFetch = true,
    } = options;

    const hydrated = useHydrated();
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PagedResponse<ProductSummary>['meta'] | null>(null);
    const [currentFilters, setCurrentFilters] = useState<ProductFilterParams>(initialFilters);

    const isCacheValid = useCallback((cacheKey: string) => {
        if (!enableCache) return false;
        const cached = productCache.data.get(cacheKey);
        if (!cached) return false;
        const now = Date.now();
        return (now - cached.timestamp) < cacheTime;
    }, [enableCache, cacheTime]);

    const fetchProducts = useCallback(async (filters: ProductFilterParams = currentFilters, append: boolean = false) => {
        if (!hydrated) return;

        const cacheKey = generateCacheKey(filters);

        if (isCacheValid(cacheKey) && !append) {
            const cached = productCache.data.get(cacheKey);
            if (cached) {
                console.log('Using cached products for:', filters);
                setProducts(cached.products);
                setMeta(cached.meta);
                setCurrentFilters(filters);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching products with filters:', filters, 'append:', append);

            const response = await api.products.getAllProducts.call(api.products, filters);

            if (!response || !response.content || !Array.isArray(response.content)) {
                throw new Error('Invalid response format from API');
            }

            const validProducts = response.content.filter(product =>
                product &&
                typeof product.id === 'string' &&
                typeof product.name === 'string' &&
                typeof product.price === 'number'
            );

            if (validProducts.length !== response.content.length) {
                console.warn(`Filtered out ${response.content.length - validProducts.length} invalid products`);
            }

            if (enableCache && !append && filters.page === 0) {
                productCache.data.set(cacheKey, {
                    products: validProducts,
                    meta: response.meta,
                    filters,
                    timestamp: Date.now()
                });
            }

            if (append) {
                console.log('Appending products to existing list');
                setProducts(prev => {
                    console.log('Previous products count:', prev.length);
                    console.log('New products count:', validProducts.length);
                    const newList = [...prev, ...validProducts];
                    console.log('Total products after append:', newList.length);
                    return newList;
                });
            } else {
                console.log('Replacing products list');
                setProducts(validProducts);
            }

            setMeta(response.meta);
            setCurrentFilters(filters);

            console.log(`Loaded ${validProducts.length} valid products`);

        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch products:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, isCacheValid, enableCache, currentFilters]);

    const refetch = useCallback(async (filters?: ProductFilterParams) => {
        const newFilters = filters || currentFilters;

        if (enableCache) {
            const cacheKey = generateCacheKey(newFilters);
            productCache.data.delete(cacheKey);
        }

        await fetchProducts(newFilters, false);
    }, [fetchProducts, currentFilters, enableCache]);

    const loadMore = useCallback(async () => {
        if (!meta || meta.last || loading) return;

        const nextPageFilters = {
            ...currentFilters,
            page: (currentFilters.page || 0) + 1
        };

        await fetchProducts(nextPageFilters, true);
    }, [meta, loading, currentFilters, fetchProducts]);

    const refresh = useCallback(async () => {
        if (enableCache) {
            productCache.data.clear();
        }
        await fetchProducts(currentFilters, false);
    }, [fetchProducts, currentFilters, enableCache]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchProducts();
        }
    }, [fetchProducts, autoFetch]);

    const hasMore = meta ? !meta.last : false;

    return {
        products,
        loading,
        error,
        meta,
        hasMore,
        refetch,
        loadMore,
        clearError,
        refresh
    };
};

export const useProduct = (productId: string) => {
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();

    const fetchProduct = useCallback(async () => {
        if (!hydrated || !productId) return;

        setLoading(true);
        setError(null);

        try {
            const productDetail = await api.products.getProductById.call(api.products, productId);
            setProduct(productDetail);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch product:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, productId]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    return { product, loading, error, refetch: fetchProduct };
};

export const useProductsByCategory = (categoryId: string, page: number = 0, size: number = 20) => {
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<PagedResponse<ProductSummary>['meta'] | null>(null);
    const hydrated = useHydrated();

    const fetchProductsByCategory = useCallback(async () => {
        if (!hydrated || !categoryId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.products.getProductsByCategory.call(api.products, categoryId, page, size);
            setProducts(response.content);
            setMeta(response.meta);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch products by category:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, categoryId, page, size]);

    useEffect(() => {
        fetchProductsByCategory();
    }, [fetchProductsByCategory]);

    return {
        products,
        loading,
        error,
        meta,
        refetch: fetchProductsByCategory
    };
};