import { lazy, memo, Suspense, useState } from "react";
import { Sidebar } from "~/components";
import ProductGrid from "~/components/features/product/grid/ProductGrid";
import type { FilterState } from "~/components/layout/sidebar/Sidebar.types";
import { ClientOnly } from "~/components/shared/ClientOnly";
import { useNewArrivals, useTopRatedProducts, useTopSellingProducts } from "~/hooks/special/useSpecialProducts";
import { useSSRWindowSize } from "~/hooks/window/useWindowSize";
import type { Route } from "./+types/home";

// Lazy load component that's not immediately visible
const Banner = lazy(() => import("~/components/features/banner/Banner"));
const TopDeals = lazy(() => import("~/components/features/topdeals/TopDeals"));

// Memoize components to prevent unnecessary re-renders
const MemoizedBanner = memo(Banner);
const MemoizedTopDeals = memo(TopDeals);
const MemoizedProductGrid = memo(ProductGrid);

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Home | ViMarket" },
    { name: "description", content: "Khám phá hàng ngàn sản phẩm chất lượng với giá tốt nhất!" },
  ];
}

export default function Home() {
  const { width: windowWidth, isClient } = useSSRWindowSize();
  const [menuOpen, setMenuOpen] = useState(false);

  // Filter state for home page products
  const [homeFilters, setHomeFilters] = useState<FilterState>({
    inventoryStatus: 'available', // Default to in-stock items
  });

  // Product hooks with enhanced filtering
  const {
    products: topSellingProducts,
    loading: topSellingLoading,
    error: topSellingError,
    hasMore: topSellingHasMore,
    loadMore: loadMoreTopSelling,
    refetch: refetchTopSelling
  } = useTopSellingProducts({
    page: 0,
    size: 8,
    enableCache: true,
    cacheTime: 10 * 60 * 1000,
    filters: {
      ...homeFilters,
      minRating: 3.0, // Only show well-rated products
    }
  });

  const {
    products: topRatedProducts,
    loading: topRatedLoading,
    error: topRatedError,
    hasMore: topRatedHasMore,
    loadMore: loadMoreTopRated,
    refetch: refetchTopRated
  } = useTopRatedProducts({
    page: 0,
    size: 8,
    enableCache: true,
    cacheTime: 10 * 60 * 1000,
    filters: {
      ...homeFilters,
      minRating: 4.0, // High-rated products for flash sale
    }
  });

  const {
    products: newArrivals,
    loading: newArrivalsLoading,
    error: newArrivalsError,
    hasMore: newArrivalsHasMore,
    loadMore: loadMoreNewArrivals,
    refetch: refetchNewArrivals
  } = useNewArrivals({
    page: 0,
    size: 8,
    enableCache: true,
    cacheTime: 10 * 60 * 1000,
    filters: homeFilters
  });

  const showMobileButton = isClient && windowWidth < 768;

  // Handle filter changes from sidebar
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = {
      ...homeFilters,
      ...newFilters,
    };

    setHomeFilters(updatedFilters);

    // Refetch all product sections with new filters
    refetchTopSelling({
      ...updatedFilters,
      minRating: 3.0,
    });

    refetchTopRated({
      ...updatedFilters,
      minRating: 4.0,
    });

    refetchNewArrivals(updatedFilters);
  };

  // Handle category selection
  const handleCategorySelect = (category: any) => {
    const newFilters = {
      ...homeFilters,
      categoryIds: [category.category],
    };

    setHomeFilters(newFilters);

    // Refetch products with category filter
    refetchTopSelling({
      ...newFilters,
      minRating: 3.0,
    });

    refetchTopRated({
      ...newFilters,
      minRating: 4.0,
    });

    refetchNewArrivals(newFilters);

    // Close mobile menu after selection
    if (windowWidth < 768) {
      setMenuOpen(false);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const defaultFilters = {
      inventoryStatus: 'IN_STOCK',
    };

    setHomeFilters(defaultFilters);

    // Refetch all sections with default filters
    refetchTopSelling({
      ...defaultFilters,
      minRating: 3.0,
    });

    refetchTopRated({
      ...defaultFilters,
      minRating: 4.0,
    });

    refetchNewArrivals(defaultFilters);
  };

  // Enhanced refetch functions with current filters
  const handleRefetchTopSelling = () => {
    refetchTopSelling({
      ...homeFilters,
      minRating: 3.0,
    });
  };

  const handleRefetchTopRated = () => {
    refetchTopRated({
      ...homeFilters,
      minRating: 4.0,
    });
  };

  const handleRefetchNewArrivals = () => {
    refetchNewArrivals(homeFilters);
  };

  return (
    <div className="w-full flex flex-col md:flex-row pb-4 relative">
      {/* Sidebar component - now controlled by home page */}
      <ClientOnly>
        <Sidebar
          windowWidth={windowWidth}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          currentFilters={homeFilters}
          onCategorySelect={handleCategorySelect}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          showCategories={true}
          showFilters={true}
        />
      </ClientOnly>

      {/* Mobile menu button */}
      {showMobileButton && (
        <button
          className="md:hidden fixed top-4 left-4 z-30 bg-gray-800 p-2 rounded-md shadow-lg"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 max-w-full mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-3 space-y-4 sm:space-y-6 w-full">
        {/* Active Filters Display */}
        {(homeFilters.categoryIds?.length || homeFilters.brandIds?.length || homeFilters.minPrice || homeFilters.minRating) && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-medium">Bộ lọc đang áp dụng:</h3>
              <button
                onClick={handleClearFilters}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {homeFilters.categoryIds?.map((categoryId, index) => (
                <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                  Danh mục: {categoryId}
                </span>
              ))}
              {homeFilters.brandIds?.map((brandId, index) => (
                <span key={index} className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                  Thương hiệu: {brandId}
                </span>
              ))}
              {homeFilters.minPrice && (
                <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                  Giá từ: {homeFilters.minPrice.toLocaleString()}đ
                </span>
              )}
              {homeFilters.maxPrice && (
                <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                  Giá đến: {homeFilters.maxPrice.toLocaleString()}đ
                </span>
              )}
              {homeFilters.minRating && (
                <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-xs">
                  Đánh giá: {homeFilters.minRating}+ sao
                </span>
              )}
            </div>
          </div>
        )}

        {/* Banner Section */}
        <div className="w-full p-2 sm:p-4 bg-black rounded-md shadow-md">
          <ClientOnly
            fallback={
              <div className="w-full overflow-hidden">
                <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 xl:h-80">
                  <div className="flex absolute w-full h-full">
                    <div className="flex-shrink-0 px-1 w-1/2">
                      <div className="w-full h-full bg-gray-800 animate-pulse rounded-md"></div>
                    </div>
                    <div className="flex-shrink-0 px-1 w-1/2">
                      <div className="w-full h-full bg-gray-800 animate-pulse rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <MemoizedBanner height="xl" />
          </ClientOnly>
        </div>

        {/* Top Deal Section */}
        <ClientOnly
          fallback={
            <div className="w-full p-2 sm:p-4 bg-black rounded-md shadow-md">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Top Deals</h2>
              <div className="w-full h-24 sm:h-40 bg-gray-800 animate-pulse rounded-md"></div>
            </div>
          }
        >
          <div className="w-full p-2 sm:p-4 bg-black rounded-md shadow-md">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Top Deals</h2>
            <Suspense fallback={
              <div className="w-full h-24 sm:h-40 bg-gray-800 animate-pulse rounded-md"></div>
            }>
              <MemoizedTopDeals />
            </Suspense>
          </div>
        </ClientOnly>

        {/* Top Selling Products Section */}
        <div className="w-full bg-black rounded-md shadow-md">
          <ClientOnly>
            <MemoizedProductGrid
              title="Sản phẩm bán chạy"
              products={topSellingProducts}
              loading={topSellingLoading}
              error={topSellingError}
              hasMore={topSellingHasMore}
              onLoadMore={loadMoreTopSelling}
              onRetry={handleRefetchTopSelling}
              cols={4}
              gap="md"
              spacing="normal"
              padding="md"
              titleSize="md"
              showLoadMoreButton={true}
              emptyMessage="Chưa có sản phẩm bán chạy"
            />
          </ClientOnly>
        </div>

        {/* Flash Sale Section - High-rated products */}
        <div className="w-full bg-black rounded-md shadow-md">
          <ClientOnly>
            <MemoizedProductGrid
              title="Flash Sale ⚡"
              products={topRatedProducts}
              loading={topRatedLoading}
              error={topRatedError}
              hasMore={topRatedHasMore}
              onLoadMore={loadMoreTopRated}
              onRetry={handleRefetchTopRated}
              cols={4}
              gap="md"
              spacing="normal"
              padding="md"
              titleSize="md"
              errorSeverity="warning"
              loadMoreVariant="secondary"
              showLoadMoreButton={true}
              emptyMessage="Chưa có sản phẩm flash sale"
            />
          </ClientOnly>
        </div>

        {/* New Arrivals Section */}
        <div className="w-full bg-black rounded-md shadow-md">
          <ClientOnly>
            <MemoizedProductGrid
              title="Sản phẩm mới nhất"
              products={newArrivals}
              loading={newArrivalsLoading}
              error={newArrivalsError}
              hasMore={newArrivalsHasMore}
              onLoadMore={loadMoreNewArrivals}
              onRetry={handleRefetchNewArrivals}
              cols={4}
              gap="lg"
              spacing="loose"
              padding="lg"
              titleSize="lg"
              emptyStateSize="lg"
              loadMoreVariant="outline"
              loadMoreSize="lg"
              showLoadMoreButton={true}
              emptyMessage="Chưa có sản phẩm mới"
            />
          </ClientOnly>
        </div>

        {/* Featured Categories */}
        <div className="w-full p-2 sm:p-4 bg-black rounded-md shadow-md">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Danh mục nổi bật</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
              <div
                key={item}
                className="bg-gray-800 rounded-md p-1 sm:p-2 flex flex-col items-center hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-700 mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="w-full p-2 sm:p-4 bg-black rounded-md shadow-md">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Khám phá thêm</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-lg transition-colors text-sm sm:text-base font-medium">
              Xem tất cả sản phẩm
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 rounded-lg transition-colors text-sm sm:text-base font-medium">
              Sản phẩm giảm giá
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white p-3 sm:p-4 rounded-lg transition-colors text-sm sm:text-base font-medium">
              Thương hiệu nổi tiếng
            </button>
            <button className="bg-orange-600 hover:bg-orange-700 text-white p-3 sm:p-4 rounded-lg transition-colors text-sm sm:text-base font-medium">
              Đánh giá cao
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}