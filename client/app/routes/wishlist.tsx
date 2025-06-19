import { Heart, ShoppingCart, Star, Trash2, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '~/hooks/cart';
import { useWishlist, useWishlistStats } from '~/hooks/wishlist';
import { cn } from '~/lib/utils';

const WishlistPage: React.FC = () => {
    const {
        wishlist,
        loading,
        error,
        isEmpty,
        removeFromWishlist,
        clearWishlist,
        loadMore,
        hasMore,
        refresh
    } = useWishlist();

    const { addToCart } = useCart();
    const { stats } = useWishlistStats();

    const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
    const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatRating = (rating?: number) => {
        return rating ? rating.toFixed(1) : '0.0';
    };

    const handleRemoveFromWishlist = async (productId: string) => {
        setRemovingItems(prev => new Set([...prev, productId]));
        try {
            await removeFromWishlist(productId);
        } catch (error) {
            console.error('Failed to remove from wishlist:', error);
        } finally {
            setRemovingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
        }
    };

    const handleAddToCart = async (productId: string) => {
        setAddingToCart(prev => new Set([...prev, productId]));
        try {
            await addToCart({ productId, quantity: 1 });
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setAddingToCart(prev => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
        }
    };

    const handleClearWishlist = async () => {
        if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
            try {
                await clearWishlist();
            } catch (error) {
                console.error('Failed to clear wishlist:', error);
            }
        }
    };

    if (loading && !wishlist) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-md p-4 space-y-4">
                                <div className="h-48 bg-gray-200 rounded"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-300 rounded-lg p-6 text-center">
                    <h2 className="text-red-800 font-medium mb-2">Có lỗi xảy ra</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={refresh}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-16">
                    <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">
                        Danh sách yêu thích trống
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Hãy thêm những sản phẩm bạn yêu thích để dễ dàng tìm lại sau này
                    </p>
                    <Link
                        to="/products"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <ShoppingCart size={20} />
                        Khám phá sản phẩm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Danh sách yêu thích
                    </h1>
                    <p className="text-gray-600">
                        {wishlist?.total || 0} sản phẩm
                    </p>
                </div>

                {!isEmpty && (
                    <button
                        onClick={handleClearWishlist}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Xóa tất cả
                    </button>
                )}
            </div>

            {/* Stats */}
            {stats && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Thống kê
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.totalItems}
                            </div>
                            <div className="text-sm text-gray-600">Sản phẩm</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {formatPrice(stats.totalValue)}
                            </div>
                            <div className="text-sm text-gray-600">Tổng giá trị</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {formatPrice(stats.averagePrice)}
                            </div>
                            <div className="text-sm text-gray-600">Giá trung bình</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {wishlist?.items.map((item) => {
                    const { product } = item;
                    const isRemoving = removingItems.has(item.productId);
                    const isAddingToCartLoading = addingToCart.has(item.productId);

                    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                    const discountPercentage = hasDiscount
                        ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                        : 0;

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300",
                                isRemoving && "opacity-50 transform scale-95"
                            )}
                        >
                            {/* Product Image */}
                            <div className="relative">
                                <Link to={`/product/${product.id}`}>
                                    <div className="relative h-48 bg-gray-100 cursor-pointer">
                                        {product.images?.[0]?.url ? (
                                            <img
                                                src={product.images[0].url}
                                                alt={product.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">No Image</span>
                                            </div>
                                        )}

                                        {/* Discount Badge */}
                                        {hasDiscount && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                                                -{discountPercentage}%
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveFromWishlist(item.productId)}
                                    disabled={isRemoving}
                                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                                    title="Xóa khỏi danh sách yêu thích"
                                >
                                    {isRemoving ? (
                                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Heart size={16} className="text-red-500 fill-current" />
                                    )}
                                </button>
                            </div>

                            {/* Product Info */}
                            <div className="p-4 space-y-3">
                                {/* Brand */}
                                {product.brand?.name && (
                                    <div className="text-xs text-blue-600 font-medium">
                                        {product.brand.name}
                                    </div>
                                )}

                                {/* Product Name */}
                                <Link to={`/product/${product.id}`}>
                                    <h3 className="font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                                        {product.name}
                                    </h3>
                                </Link>

                                {/* Rating */}
                                {product.ratingAverage && product.ratingAverage > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star size={14} className="text-yellow-400 fill-current" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {formatRating(product.ratingAverage)}
                                        </span>
                                        {product.reviewCount > 0 && (
                                            <span className="text-xs text-gray-500">
                                                ({product.reviewCount})
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Price */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-red-600">
                                            {formatPrice(product.price)}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-sm text-gray-500 line-through">
                                                {formatPrice(product.originalPrice!)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={() => handleAddToCart(item.productId)}
                                    disabled={
                                        product.inventoryStatus === 'out_of_stock' ||
                                        product.inventoryStatus === 'upcoming' ||
                                        isAddingToCartLoading
                                    }
                                    className={cn(
                                        "w-full py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
                                        (product.inventoryStatus === 'out_of_stock' || product.inventoryStatus === 'upcoming' || isAddingToCartLoading)
                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                                    )}
                                >
                                    {isAddingToCartLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Đang thêm...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={16} />
                                            {product.inventoryStatus === 'out_of_stock' && 'Hết hàng'}
                                            {product.inventoryStatus === 'upcoming' && 'Sắp có hàng'}
                                            {(!product.inventoryStatus || product.inventoryStatus === 'available') && 'Thêm vào giỏ'}
                                        </>
                                    )}
                                </button>

                                {/* Added Date */}
                                <div className="text-xs text-gray-500">
                                    Đã thêm: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className={cn(
                            "px-6 py-3 rounded-lg font-medium transition-colors",
                            loading
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                Đang tải...
                            </div>
                        ) : (
                            'Xem thêm'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WishlistPage;