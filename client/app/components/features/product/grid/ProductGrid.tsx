import { RefreshCw } from 'lucide-react';
import React from 'react';
import { cn } from '~/lib/utils';
import { ProductCard } from '../card/ProductCard';
import type {
    ProductGridEmptyProps,
    ProductGridErrorProps,
    ProductGridHeaderProps,
    ProductGridLoadMoreProps,
    ProductGridLoadingProps,
    ProductGridProps,
    ProductGridSkeletonProps
} from './ProductGrid.types';
import {
    emptyStateVariants,
    errorContainerVariants,
    gridContainerVariants,
    loadMoreButtonVariants,
    loadingIndicatorVariants,
    productGridVariants,
    titleVariants
} from './ProductGrid.variants';

// Skeleton component
const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
    cols = 4,
    gap = "md",
    size = "md",
    count = 8,
    cardHeight = "md" // Thêm cardHeight cho skeleton
}) => {
    const getSkeletonHeight = () => {
        switch (cardHeight) {
            case 'sm': return 'h-80';
            case 'md': return 'h-96';
            case 'lg': return 'h-[26rem]';
            case 'xl': return 'h-[28rem]';
            default: return 'h-96';
        }
    };

    return (
        <div className={gridContainerVariants({ cols, gap })}>
            {[...Array(count)].map((_, index) => (
                <div key={index} className={cn(
                    "bg-white rounded-lg shadow-md overflow-hidden animate-pulse flex flex-col",
                    getSkeletonHeight() // Apply same height as cards
                )}>
                    <div className="h-40 sm:h-48 bg-gray-200 flex-shrink-0" />
                    <div className="p-3 sm:p-4 space-y-2 flex-grow relative">
                        <div className="space-y-2 pb-16">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-6 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                        {/* Skeleton button */}
                        <div className="absolute bottom-5 left-3 right-3 sm:left-4 sm:right-4">
                            <div className="h-10 bg-gray-200 rounded w-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Header component
const ProductGridHeader: React.FC<ProductGridHeaderProps> = ({
    title,
    titleSize = "md",
    onRetry,
    loading = false
}) => {
    if (!title && !onRetry) return null;

    return (
        <div className="flex items-center justify-between mb-4">
            {title && (
                <h2 className={titleVariants({ size: titleSize })}>
                    {title}
                </h2>
            )}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                    title="Làm mới"
                    disabled={loading}
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            )}
        </div>
    );
};

// Error component
const ProductGridError: React.FC<ProductGridErrorProps> = ({
    error,
    onRetry,
    loading = false,
    severity = "error"
}) => (
    <div className={errorContainerVariants({ severity })}>
        <div className="flex items-center justify-between">
            <div>
                <h3 className={cn(
                    "font-medium",
                    severity === "error" && "text-red-800",
                    severity === "warning" && "text-yellow-800",
                    severity === "info" && "text-blue-800"
                )}>
                    {severity === "error" && "Có lỗi xảy ra"}
                    {severity === "warning" && "Cảnh báo"}
                    {severity === "info" && "Thông tin"}
                </h3>
                <p className={cn(
                    "text-sm mt-1",
                    severity === "error" && "text-red-600",
                    severity === "warning" && "text-yellow-600",
                    severity === "info" && "text-blue-600"
                )}>
                    {error}
                </p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className={cn(
                        "px-4 py-2 rounded-md transition-colors text-sm",
                        severity === "error" && "bg-red-600 text-white hover:bg-red-700",
                        severity === "warning" && "bg-yellow-600 text-white hover:bg-yellow-700",
                        severity === "info" && "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <RefreshCw size={16} className="animate-spin" />
                            Đang thử lại...
                        </div>
                    ) : (
                        "Thử lại"
                    )}
                </button>
            )}
        </div>
    </div>
);

// Empty state component
const ProductGridEmpty: React.FC<ProductGridEmptyProps> = ({
    message,
    icon = "📦",
    size = "md"
}) => (
    <div className={emptyStateVariants({ size })}>
        <div className="text-gray-400 text-lg mb-2">{icon}</div>
        <h3 className="text-gray-300 text-lg font-medium mb-2">{message}</h3>
        <p className="text-gray-400 text-sm">Hãy thử tìm kiếm sản phẩm khác</p>
    </div>
);

// Load more component
const ProductGridLoadMore: React.FC<ProductGridLoadMoreProps> = ({
    onLoadMore,
    hasMore,
    loading,
    variant = "primary",
    size = "md"
}) => {
    if (!hasMore || loading) return null;

    return (
        <div className="flex justify-center mt-6 cursor">
            <button
                onClick={onLoadMore}
                className={loadMoreButtonVariants({ variant, size })}
                disabled={loading}
            >
                Xem thêm sản phẩm
            </button>
        </div>
    );
};

// Loading indicator component
const ProductGridLoading: React.FC<ProductGridLoadingProps> = ({
    message = "Đang tải thêm sản phẩm...",
    variant = "simple",
    size = "md"
}) => (
    <div className="flex justify-center mt-6">
        <div className={loadingIndicatorVariants({ variant, size })}>
            <RefreshCw size={20} className="animate-spin" />
            <span>{message}</span>
        </div>
    </div>
);

export const ProductGrid: React.FC<ProductGridProps> = ({
    products,
    loading = false,
    error = null,
    hasMore = false,
    onLoadMore,
    onRetry,
    className,
    title,
    showBrand = true,
    showSeller = false,
    cols = 4,
    gap = "md",
    emptyMessage = "Không có sản phẩm nào",
    showLoadMoreButton = true,
    spacing = "normal",
    padding = "md",
    titleSize = "md",
    errorSeverity = "error",
    emptyStateSize = "md",
    loadMoreVariant = "primary",
    loadMoreSize = "md",
    loadingVariant = "simple",
    skeletonSize = "md",
    cardHeight = "md", // Thêm prop cardHeight
    imageHeight = "md", // Thêm prop imageHeight
    ...props
}) => {
    return (
        <div className={cn(productGridVariants({ spacing, padding }), className)} {...props}>
            {/* Header */}
            <ProductGridHeader
                title={title}
                titleSize={titleSize}
                onRetry={onRetry}
                loading={loading}
            />

            {/* Error State */}
            {error && (
                <ProductGridError
                    error={error}
                    onRetry={onRetry}
                    loading={loading}
                    severity={errorSeverity}
                />
            )}

            {/* Loading Skeleton */}
            {loading && products.length === 0 && (
                <ProductGridSkeleton
                    cols={cols}
                    gap={gap}
                    size={skeletonSize}
                    count={(cols ?? 4) * 2}
                    cardHeight={cardHeight} // Truyền cardHeight cho skeleton
                />
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
                <div className={gridContainerVariants({ cols, gap })}>
                    {products.map((product, index) => {
                        // Defensive check for each product
                        if (!product || !product.id) {
                            console.warn(`Invalid product at index ${index}:`, product);
                            return null;
                        }

                        return (
                            <ProductCard
                                key={`product-${product.id}-${index}`}
                                product={product}
                                cardHeight={cardHeight}
                                imageHeight={imageHeight}
                                showBrand={showBrand}
                                showSeller={showSeller}
                            />
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && !error && (
                <ProductGridEmpty
                    message={emptyMessage}
                    size={emptyStateSize}
                />
            )}

            {/* Load More Button */}
            {showLoadMoreButton && hasMore && !loading && !error && onLoadMore && (
                <ProductGridLoadMore
                    onLoadMore={onLoadMore}
                    hasMore={hasMore}
                    loading={loading}
                    variant={loadMoreVariant}
                    size={loadMoreSize}
                />
            )}

            {/* Loading More Indicator */}
            {loading && products.length > 0 && (
                <ProductGridLoading
                    variant={loadingVariant}
                />
            )}
        </div>
    );
};

export default ProductGrid;