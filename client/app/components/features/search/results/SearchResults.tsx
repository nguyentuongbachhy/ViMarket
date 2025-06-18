import { AlertCircle, Search } from 'lucide-react';
import React from 'react';
import { ProductCard } from '~/components/features/product/card';
import { Button } from '~/components/ui/button';
import { InfiniteScroll } from '~/components/ui/scroll';
import type { SearchResultsProps } from './SearchResults.types';

export const SearchResults: React.FC<SearchResultsProps> = ({
    products,
    loading,
    error,
    isEmpty,
    hasMore,
    viewMode,
    query,
    onLoadMore,
    onRetry,
    onClearError,
}) => {
    // Error State
    if (error && !loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Có lỗi xảy ra</h3>
                    <p className="mt-1 text-gray-500">{error}</p>
                    <div className="mt-4 flex justify-center gap-2">
                        <Button variant="outline" onClick={onClearError}>
                            Bỏ qua
                        </Button>
                        <Button onClick={onRetry}>
                            Thử lại
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Empty State
    if (isEmpty && !loading && query) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                        Không tìm thấy sản phẩm nào
                    </h3>
                    <p className="mt-1 text-gray-500">
                        Không có sản phẩm nào phù hợp với từ khóa "{query}"
                    </p>
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Thử:</p>
                        <ul className="mt-2 text-sm text-gray-500 space-y-1">
                            <li>• Kiểm tra lại chính tả</li>
                            <li>• Sử dụng từ khóa khác</li>
                            <li>• Thử tìm kiếm tổng quát hơn</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // No Query State
    if (!query && !loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                    <Search className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                        Nhập từ khóa để tìm kiếm
                    </h3>
                    <p className="mt-1 text-gray-500">
                        Tìm kiếm sản phẩm, thương hiệu mà bạn quan tâm
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Loading State for Initial Load */}
            {loading && products.length === 0 && (
                <div className="grid gap-4 sm:gap-6">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                                    <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {products.length > 0 && (
                <InfiniteScroll
                    hasMore={hasMore}
                    loading={loading}
                    onLoadMore={onLoadMore}
                    className="space-y-4"
                >
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    showWishlist
                                    showQuickView
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {products.map((product) => (
                                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 flex-shrink-0">
                                            <img
                                                src={product.images[0]?.url || '/placeholder-product.jpg'}
                                                alt={product.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.shortDescription}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <div>
                                                    <span className="text-lg font-bold text-gray-900">
                                                        {product.price.toLocaleString('vi-VN')}₫
                                                    </span>
                                                    {product.originalPrice && product.originalPrice > product.price && (
                                                        <span className="ml-2 text-sm text-gray-500 line-through">
                                                            {product.originalPrice.toLocaleString('vi-VN')}₫
                                                        </span>
                                                    )}
                                                </div>
                                                <Button size="sm">
                                                    Xem chi tiết
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </InfiniteScroll>
            )}
        </div>
    );
};

export default SearchResults;