import { Grid, List, SlidersHorizontal } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Sidebar } from '~/components';
import { ProductGrid } from '~/components/features/product/grid';
import { ProductListView } from '~/components/features/product/list';
import type { FilterState } from '~/components/layout/sidebar/Sidebar.types';
import { InfiniteScroll } from '~/components/ui/scroll';
import { useProducts } from '~/hooks/product';
import { useSSRWindowSize } from '~/hooks/window/useWindowSize';
import { cn } from '~/lib/utils';
import type { Route } from "./+types/products";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Sản phẩm | E-Commerce" },
        { name: "description", content: "Khám phá hàng ngàn sản phẩm chất lượng với giá tốt nhất." },
    ];
}

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [menuOpen, setMenuOpen] = useState(false);

    // Get window size for responsive behavior
    const { width: windowWidth, isClient } = useSSRWindowSize();

    // Extract and parse filters from URL
    const getFiltersFromURL = () => {
        return {
            categoryIds: searchParams.getAll('categoryId').filter(Boolean),
            brandIds: searchParams.getAll('brandId').filter(Boolean),
            brandNames: searchParams.getAll('brandName').filter(Boolean),
            minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
            maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
            minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
            maxRating: searchParams.get('maxRating') ? Number(searchParams.get('maxRating')) : undefined,
            inventoryStatus: searchParams.get('inventoryStatus') || undefined,
            sortBy: (searchParams.get('sortBy') || 'createdAt') as "createdAt" | "price" | "rating" | "newest" | "popularity" | "allTimeQuantitySold" | "ratingAverage",
            direction: searchParams.get('direction') as 'asc' | 'desc' || 'desc',
            page: 0, // Always start from page 0 for infinite scroll
            size: 20,
        };
    };

    // State for filters
    const [currentFilters, setCurrentFilters] = useState(getFiltersFromURL());
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(0);

    // Use products hook with manual control
    const {
        products,
        loading,
        error,
        meta,
        refetch,
        clearError,
    } = useProducts({
        enableCache: false, // Disable cache for real-time filtering
        initialFilters: currentFilters,
        autoFetch: false, // We'll control when to fetch
    });

    // Update URL when filters change
    const updateURL = useCallback((filters: Partial<FilterState>) => {
        const newParams = new URLSearchParams();

        // Add all filter parameters to URL
        filters.categoryIds?.forEach(id => newParams.append('categoryId', id));
        filters.brandIds?.forEach(id => newParams.append('brandId', id));
        filters.brandNames?.forEach(name => newParams.append('brandName', name));

        if (filters.minPrice !== undefined && filters.minPrice > 0) {
            newParams.set('minPrice', filters.minPrice.toString());
        }
        if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
            newParams.set('maxPrice', filters.maxPrice.toString());
        }
        if (filters.minRating !== undefined && filters.minRating > 0) {
            newParams.set('minRating', filters.minRating.toString());
        }
        if (filters.maxRating !== undefined && filters.maxRating > 0) {
            newParams.set('maxRating', filters.maxRating.toString());
        }
        if (filters.inventoryStatus) {
            newParams.set('inventoryStatus', filters.inventoryStatus);
        }
        if (filters.sortBy) {
            newParams.set('sortBy', filters.sortBy);
        }
        if (filters.direction) {
            newParams.set('direction', filters.direction);
        }

        setSearchParams(newParams, { replace: true });
    }, [setSearchParams]);

    // Load initial data and when filters change
    const loadProducts = useCallback(async (filters: any, page: number = 0, append: boolean = false) => {
        try {
            const newFilters = {
                ...filters,
                page,
                size: 20,
            };

            await refetch(newFilters);
            
            if (append && products.length > 0) {
                setAllProducts(prev => [...prev, ...products]);
            } else {
                setAllProducts(products);
                setCurrentPage(0);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }, [refetch, products]);

    // Handle filter changes from sidebar
    const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
        const updatedFilters = {
            ...currentFilters,
            ...newFilters,
            page: 0, // Reset to first page when filters change
            size: 20, // Ensure size is included
        } as typeof currentFilters;

        setCurrentFilters(updatedFilters);
        updateURL(updatedFilters);
        setCurrentPage(0);
        setAllProducts([]);
        loadProducts(updatedFilters, 0, false);
    }, [currentFilters, updateURL, loadProducts]);

    // Handle category selection
    const handleCategorySelect = useCallback((category: any) => {
        const currentCategoryIds = currentFilters.categoryIds || [];
        const newCategoryIds = currentCategoryIds.includes(category.category)
            ? currentCategoryIds.filter(id => id !== category.category)
            : [...currentCategoryIds, category.category];

        handleFilterChange({
            categoryIds: newCategoryIds.length > 0 ? newCategoryIds : undefined,
        });

        // Close mobile menu after selection
        if (windowWidth < 768) {
            setMenuOpen(false);
        }
    }, [currentFilters.categoryIds, handleFilterChange, windowWidth, setMenuOpen]);

    // Handle clear filters
    const handleClearFilters = useCallback(() => {
        const clearedFilters = {
            categoryIds: [],
            brandIds: [],
            brandNames: [],
            minPrice: undefined,
            maxPrice: undefined,
            minRating: undefined,
            maxRating: undefined,
            inventoryStatus: undefined,
            sortBy: 'createdAt' as const,
            direction: 'desc' as const,
            page: 0,
            size: 20,
        };

        setCurrentFilters(clearedFilters);
        updateURL({});
        setCurrentPage(0);
        setAllProducts([]);
        loadProducts(clearedFilters, 0, false);
    }, [updateURL, loadProducts]);

    // Handle infinite scroll load more
    const handleLoadMore = useCallback(async () => {
        if (!meta || meta.last || loading) return;

        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        await loadProducts(currentFilters, nextPage, true);
    }, [meta, loading, currentPage, currentFilters, loadProducts]);

    // Handle sort change
    const handleSortChange = useCallback((sortBy: string, direction: 'asc' | 'desc') => {
        handleFilterChange({ sortBy, direction });
    }, [handleFilterChange]);

    // Load initial data
    useEffect(() => {
        const urlFilters = getFiltersFromURL();
        setCurrentFilters(urlFilters);
        loadProducts(urlFilters, 0, false);
    }, []);

    // Sync with URL changes
    useEffect(() => {
        const urlFilters = getFiltersFromURL();
        setCurrentFilters(urlFilters);
        setAllProducts([]);
        setCurrentPage(0);
        loadProducts(urlFilters, 0, false);
    }, [searchParams]);

    const showMobileButton = isClient && windowWidth < 768;

    // Count active filters
    const activeFiltersCount = [
        currentFilters.categoryIds?.length || 0,
        currentFilters.brandIds?.length || 0,
        currentFilters.brandNames?.length || 0,
        currentFilters.minPrice ? 1 : 0,
        currentFilters.maxPrice ? 1 : 0,
        currentFilters.minRating ? 1 : 0,
        currentFilters.maxRating ? 1 : 0,
        currentFilters.inventoryStatus ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0);

    const hasMore = meta ? !meta.last : false;
    const totalProducts = meta?.totalElements || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="w-full flex flex-col md:flex-row relative">
                {/* Sidebar with Categories & Filters */}
                <Sidebar
                    windowWidth={windowWidth}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    currentFilters={currentFilters}
                    onCategorySelect={handleCategorySelect}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    showCategories={true}
                    showFilters={true}
                />

                {/* Mobile menu button */}
                {showMobileButton && (
                    <button
                        className="md:hidden fixed top-20 left-4 z-30 bg-gray-800 p-3 rounded-xl shadow-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open filters"
                    >
                        <SlidersHorizontal className="w-5 h-5 text-white" />
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                )}

                {/* Main Content */}
                <div className="flex-1 max-w-full mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl rounded-2xl border border-gray-700">
                        <div className="px-6 py-6">
                            <div className="flex flex-col space-y-4">
                                {/* Title and Stats */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white mb-2">
                                            Sản phẩm
                                        </h1>
                                        {totalProducts > 0 && (
                                            <p className="text-gray-300">
                                                Hiển thị <span className="font-semibold text-white">{allProducts.length}</span> trên <span className="font-semibold text-blue-400">{totalProducts.toLocaleString()}</span> sản phẩm
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Sort Options */}
                                        <select
                                            value={`${currentFilters.sortBy}-${currentFilters.direction}`}
                                            onChange={(e) => {
                                                const [sortBy, direction] = e.target.value.split('-');
                                                handleSortChange(sortBy, direction as 'asc' | 'desc');
                                            }}
                                            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="createdAt-desc">Mới nhất</option>
                                            <option value="createdAt-asc">Cũ nhất</option>
                                            <option value="price-asc">Giá thấp đến cao</option>
                                            <option value="price-desc">Giá cao đến thấp</option>
                                            <option value="ratingAverage-desc">Đánh giá cao nhất</option>
                                            <option value="allTimeQuantitySold-desc">Bán chạy nhất</option>
                                        </select>

                                        {/* View Mode Toggle */}
                                        <div className="flex border border-gray-600 rounded-lg overflow-hidden bg-gray-700">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                className={cn(
                                                    "p-2 transition-colors",
                                                    viewMode === 'grid'
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                )}
                                                title="Xem dạng lưới"
                                            >
                                                <Grid className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={cn(
                                                    "p-2 transition-colors",
                                                    viewMode === 'list'
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                )}
                                                title="Xem dạng danh sách"
                                            >
                                                <List className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters Summary */}
                                {activeFiltersCount > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                                        {currentFilters.categoryIds?.length ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-600 text-white">
                                                {currentFilters.categoryIds.length} danh mục
                                            </span>
                                        ) : null}

                                        {(currentFilters.brandIds?.length || currentFilters.brandNames?.length) ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-600 text-white">
                                                {(currentFilters.brandIds?.length || 0) + (currentFilters.brandNames?.length || 0)} thương hiệu
                                            </span>
                                        ) : null}

                                        {(currentFilters.minPrice || currentFilters.maxPrice) && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-600 text-white">
                                                Lọc theo giá
                                            </span>
                                        )}

                                        {(currentFilters.minRating || currentFilters.maxRating) && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-600 text-white">
                                                Lọc theo đánh giá
                                            </span>
                                        )}

                                        {currentFilters.inventoryStatus && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-600 text-white">
                                                {currentFilters.inventoryStatus}
                                            </span>
                                        )}

                                        <button
                                            onClick={handleClearFilters}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                                        >
                                            Xóa tất cả bộ lọc
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products Content */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 p-6">
                        <InfiniteScroll
                            hasMore={hasMore}
                            loading={loading}
                            onLoadMore={handleLoadMore}
                            errorMessage={error || undefined}
                            onRetry={() => loadProducts(currentFilters, 0, false)}
                            loadingVariant="branded"
                            threshold={300}
                        >
                            {viewMode === 'grid' ? (
                                <ProductGrid
                                    products={allProducts}
                                    loading={loading && allProducts.length === 0}
                                    error={error}
                                    hasMore={hasMore}
                                    cols={4}
                                    gap="md"
                                    showLoadMoreButton={false}
                                    emptyMessage="Không tìm thấy sản phẩm nào với bộ lọc này"
                                    className="min-h-[400px]"
                                />
                            ) : (
                                <ProductListView
                                    products={allProducts}
                                    loading={loading && allProducts.length === 0}
                                    error={error}
                                    showBrand={true}
                                    showSeller={false}
                                />
                            )}
                        </InfiniteScroll>
                    </div>
                </div>
            </div>
        </div>
    );
}