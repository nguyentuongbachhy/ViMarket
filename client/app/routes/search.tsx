import { Grid, List, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Sidebar } from '~/components';
import { ProductGrid } from '~/components/features/product/grid';
import { ProductListView } from '~/components/features/product/list';
import { SearchSortOptions } from '~/components/features/search';
import type { FilterState } from '~/components/layout/sidebar/Sidebar.types';
import { SearchInput } from '~/components/ui/search';
import { InfiniteScroll } from '~/components/ui/scroll';
import { useProductSearch } from '~/hooks/search';
import { useSSRWindowSize } from '~/hooks/window/useWindowSize';
import { cn } from '~/lib/utils';
import type { Route } from "./+types/search";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Tìm kiếm | E-Commerce" },
        { name: "description", content: "Tìm kiếm sản phẩm, thương hiệu yêu thích." },
    ];
}

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [menuOpen, setMenuOpen] = useState(false);

    // Get window size for responsive behavior
    const { width: windowWidth, isClient } = useSSRWindowSize();

    // Extract and parse search parameters from URL
    const getFiltersFromURL = (): FilterState => {
        return {
            q: searchParams.get('q') || '',
            categoryIds: searchParams.getAll('categoryId').filter(Boolean),
            brandIds: searchParams.getAll('brandId').filter(Boolean),
            brandNames: searchParams.getAll('brandName').filter(Boolean),
            minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
            maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
            minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
            maxRating: searchParams.get('maxRating') ? Number(searchParams.get('maxRating')) : undefined,
            inventoryStatus: searchParams.get('inventoryStatus') || undefined,
            sortBy: searchParams.get('sortBy') || undefined,
            direction: searchParams.get('direction') as 'asc' | 'desc' || 'desc',
        };
    };

    // State for filters
    const [currentFilters, setCurrentFilters] = useState<FilterState>(getFiltersFromURL());

    const {
        products,
        loading,
        error,
        hasMore,
        isEmpty,
        totalResults,
        currentQuery,
        search,
        loadMore,
        refresh,
        clearResults,
        clearError,
    } = useProductSearch('', {
        enableCache: true,
        cacheTime: 5 * 60 * 1000,
        size: 20,
        autoSearch: false,
        debounceMs: 500,
        minQueryLength: 1,
    });

    // Sync filters with URL on mount and URL changes
    useEffect(() => {
        const urlFilters = getFiltersFromURL();
        setCurrentFilters(urlFilters);

        // Trigger search if there's a query
        if (urlFilters.q && urlFilters.q.trim()) {
            const allowedSortBy = [
                "price",
                "rating",
                "newest",
                "popularity",
                "allTimeQuantitySold",
                "ratingAverage",
                "createdAt"
            ] as const;
            const safeFilters = {
                ...urlFilters,
                sortBy: allowedSortBy.includes(urlFilters.sortBy as any)
                    ? urlFilters.sortBy as typeof allowedSortBy[number]
                    : undefined,
            };
            search(urlFilters.q, safeFilters);
        } else if (!urlFilters.q) {
            clearResults();
        }
    }, [searchParams, search, clearResults]);

    // Update URL when filters change
    const updateURL = (filters: FilterState) => {
        const newParams = new URLSearchParams();

        if (filters.q?.trim()) {
            newParams.set('q', filters.q.trim());
        }

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
    };

    // Handle search input
    const handleSearch = (query: string) => {
        const newFilters = {
            ...currentFilters,
            q: query,
        };

        const allowedSortBy = [
            "price",
            "rating",
            "newest",
            "popularity",
            "allTimeQuantitySold",
            "ratingAverage",
            "createdAt"
        ] as const;
        const safeFilters = {
            ...newFilters,
            sortBy: allowedSortBy.includes(newFilters.sortBy as any)
                ? newFilters.sortBy as typeof allowedSortBy[number]
                : undefined,
        };

        setCurrentFilters(safeFilters);
        updateURL(safeFilters);

        if (safeFilters.q?.trim()) {
            search(safeFilters.q, safeFilters);
        }
    };

    // Handle filter changes from sidebar
    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        const updatedFilters = {
            ...currentFilters,
            ...newFilters,
        };

        const allowedSortBy = [
            "price",
            "rating",
            "newest",
            "popularity",
            "allTimeQuantitySold",
            "ratingAverage",
            "createdAt"
        ] as const;
        const safeFilters = {
            ...updatedFilters,
            sortBy: allowedSortBy.includes(updatedFilters.sortBy as any)
                ? updatedFilters.sortBy as typeof allowedSortBy[number]
                : undefined,
        };

        setCurrentFilters(safeFilters);
        updateURL(safeFilters);

        if (safeFilters.q?.trim()) {
            search(safeFilters.q, safeFilters);
        }
    };

    // Handle category selection
    const handleCategorySelect = (category: any) => {
        const currentCategoryIds = currentFilters.categoryIds || [];
        const newCategoryIds = currentCategoryIds.includes(category.category)
            ? currentCategoryIds.filter(id => id !== category.category)
            : [...currentCategoryIds, category.category];

        handleFilterChange({
            categoryIds: newCategoryIds.length > 0 ? newCategoryIds : undefined,
        });

        if (windowWidth < 768) {
            setMenuOpen(false);
        }
    };

    // Handle clear filters
    const handleClearFilters = () => {
        const clearedFilters = {
            q: currentFilters.q,
        };

        setCurrentFilters(clearedFilters);
        updateURL(clearedFilters);

        if (clearedFilters.q?.trim()) {
            search(clearedFilters.q, clearedFilters);
        }
    };

    const showMobileButton = isClient && windowWidth < 768;

    // Count active filters (excluding search query and sort)
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
                        aria-label="Open menu"
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
                    {/* Search Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl rounded-2xl border border-gray-700 sticky top-0 z-20">
                        <div className="px-6 py-6">
                            <div className="flex flex-col space-y-4">
                                {/* Search Input */}
                                <div className="flex-1">
                                    <SearchInput
                                        value={currentFilters.q || ''}
                                        onSearch={handleSearch}
                                        placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                                        className="w-full max-w-2xl bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                        loading={loading}
                                    />
                                </div>

                                {/* Search Info & Controls */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        {currentQuery && (
                                            <p className="text-gray-300">
                                                Kết quả tìm kiếm cho <span className="font-semibold text-white">"{currentQuery}"</span>
                                                {totalResults > 0 && (
                                                    <span className="ml-1 text-blue-400">({totalResults.toLocaleString()} sản phẩm)</span>
                                                )}
                                            </p>
                                        )}

                                        {/* Active Filters Summary */}
                                        {activeFiltersCount > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {currentFilters.categoryIds?.length ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-600 text-white">
                                                        {currentFilters.categoryIds.length} danh mục
                                                    </span>
                                                ) : null}

                                                {(currentFilters.brandIds?.length || currentFilters.brandNames?.length) ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-600 text-white">
                                                        {(currentFilters.brandIds?.length || 0) + (currentFilters.brandNames?.length || 0)} thương hiệu
                                                    </span>
                                                ) : null}

                                                {(currentFilters.minPrice || currentFilters.maxPrice) && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-600 text-white">
                                                        Lọc theo giá
                                                    </span>
                                                )}

                                                {(currentFilters.minRating || currentFilters.maxRating) && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-600 text-white">
                                                        Lọc theo đánh giá
                                                    </span>
                                                )}

                                                {currentFilters.inventoryStatus && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-600 text-white">
                                                        {currentFilters.inventoryStatus}
                                                    </span>
                                                )}

                                                <button
                                                    onClick={handleClearFilters}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                                                >
                                                    Xóa bộ lọc
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Sort Options */}
                                        <SearchSortOptions
                                            currentSort={currentFilters.sortBy}
                                            currentDirection={currentFilters.direction}
                                            onSortChange={(sort, dir) => handleFilterChange({
                                                sortBy: sort,
                                                direction: dir
                                            })}
                                        />

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
                            </div>
                        </div>
                    </div>

                    {/* Search Results */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-700 p-6">
                        <InfiniteScroll
                            hasMore={hasMore}
                            loading={loading}
                            onLoadMore={loadMore}
                            errorMessage={error || undefined}
                            onRetry={refresh}
                            loadingVariant="branded"
                            threshold={300}
                        >
                            {currentQuery && !isEmpty ? (
                                viewMode === 'grid' ? (
                                    <ProductGrid
                                        products={products}
                                        loading={loading && products.length === 0}
                                        error={error}
                                        hasMore={hasMore}
                                        cols={4}
                                        gap="md"
                                        showLoadMoreButton={false}
                                        emptyMessage="Không tìm thấy sản phẩm nào phù hợp"
                                        className="min-h-[400px]"
                                    />
                                ) : (
                                    <ProductListView
                                        products={products}
                                        loading={loading && products.length === 0}
                                        error={error}
                                        showBrand={true}
                                        showSeller={false}
                                    />
                                )
                            ) : (
                                <div className="text-center py-16">
                                    <div className="max-w-md mx-auto">
                                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-3">
                                            {!currentQuery ? 'Nhập từ khóa để tìm kiếm' : 'Không tìm thấy kết quả'}
                                        </h3>
                                        <p className="text-gray-400">
                                            {!currentQuery 
                                                ? 'Hãy nhập tên sản phẩm, thương hiệu để bắt đầu tìm kiếm'
                                                : `Không có sản phẩm nào phù hợp với "${currentQuery}"`
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </InfiniteScroll>
                    </div>
                </div>
            </div>
        </div>
    );
}