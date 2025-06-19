// app/components/features/product/list/ProductListView.tsx
import { Heart, ShoppingCart, Star } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';
import type { ProductListViewProps, ProductSummary } from './ProductListView.types';
import { useCartContext, useWishlistContext } from '~/contexts';
import { useQuickAddToCart } from '~/hooks/cart';
import { useQuickWishlistToggle } from '~/hooks/wishlist';
import { cn } from '~/lib/utils';



const ProductListItem: React.FC<{
    product: ProductSummary;
    showBrand?: boolean;
    showSeller?: boolean;
}> = ({ product, showBrand = true, showSeller = false }) => {
    const { quickAdd, loading: addingToCart } = useQuickAddToCart();
    const { toggle: toggleWishlist, loading: wishlistLoading } = useQuickWishlistToggle();
    const { refresh: refreshCart } = useCartContext();
    const { refresh: refreshWishlist } = useWishlistContext();
    const [isInWishlist, setIsInWishlist] = useState(false);

    const handleAddToCart = async (productId: string) => {
        try {
            const success = await quickAdd(productId, 1);
            if (success) {
                await refreshCart();
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    const handleWishlistToggle = async (productId: string) => {
        try {
            const newStatus = await toggleWishlist(productId);
            if (newStatus !== null) {
                setIsInWishlist(newStatus);
                await refreshWishlist();
            }
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        }
    };

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount
        ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
        : 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getInventoryStatus = () => {
        const status = product.inventoryStatus?.toLowerCase();
        if (status === 'available') return { text: 'Còn hàng', color: 'text-green-400' };
        if (status === 'out_of_stock') return { text: 'Hết hàng', color: 'text-red-400' };
        if (status === 'upcoming') return { text: 'Sắp có hàng', color: 'text-blue-400' };
        return { text: 'Chưa cập nhật', color: 'text-gray-500' };
    };

    const inventoryStatus = getInventoryStatus();
    const primaryImage = product.images?.[0]?.url;

    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-300 overflow-hidden group">
            <div className="flex p-4 gap-4">
                {/* Product Image */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <Link to={`/product/${product.id}`}>
                        <div className="relative w-full h-full bg-slate-700 rounded-lg overflow-hidden cursor-pointer">
                            {primaryImage ? (
                                <img
                                    src={primaryImage}
                                    alt={product.name || 'Product'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                            )}

                            {/* Discount Badge */}
                            {hasDiscount && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                    -{discountPercentage}%
                                </div>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Product Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex flex-col h-full">
                        {/* Brand */}
                        {showBrand && product.brand?.name && (
                            <div className="text-xs text-blue-400 font-medium mb-1">
                                {product.brand.name}
                            </div>
                        )}

                        {/* Product Name */}
                        <Link to={`/product/${product.id}`}>
                            <h3 className="text-white font-medium text-lg hover:text-blue-400 transition-colors cursor-pointer line-clamp-2 mb-2">
                                {product.name || 'Unnamed Product'}
                            </h3>
                        </Link>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                {product.shortDescription}
                            </p>
                        )}

                        {/* Rating */}
                        {product.ratingAverage && product.ratingAverage > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center">
                                    <Star size={16} className="text-yellow-400 fill-current" />
                                    <span className="text-white font-medium ml-1">
                                        {product.ratingAverage.toFixed(1)}
                                    </span>
                                </div>
                                {product.reviewCount > 0 && (
                                    <span className="text-gray-400 text-sm">
                                        ({product.reviewCount} đánh giá)
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Price and Status */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-red-400">
                                        {formatPrice(product.price)}
                                    </span>
                                    {hasDiscount && (
                                        <span className="text-sm text-gray-500 line-through">
                                            {formatPrice(product.originalPrice!)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn("text-sm", inventoryStatus.color)}>
                                    {inventoryStatus.text}
                                </span>
                                {product.quantitySold > 0 && (
                                    <div className="text-gray-400 text-xs">
                                        Đã bán {product.quantitySold}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Seller Info */}
                        {showSeller && product.seller?.name && (
                            <div className="text-xs text-gray-400 mb-3">
                                Bán bởi: {product.seller.name}
                                {product.seller.isOfficial && (
                                    <span className="ml-1 text-blue-400 font-medium">(Chính hãng)</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 items-end justify-between">
                    {/* Wishlist Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleWishlistToggle(product.id);
                        }}
                        disabled={wishlistLoading}
                        className={cn(
                            "p-2 rounded-full transition-all duration-200",
                            wishlistLoading
                                ? "bg-slate-600 cursor-not-allowed"
                                : "bg-slate-700 hover:bg-slate-600",
                        )}
                    >
                        {wishlistLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Heart
                                size={20}
                                className={cn(
                                    "transition-colors duration-200",
                                    isInWishlist
                                        ? "text-red-400 fill-current"
                                        : "text-gray-400 hover:text-red-400"
                                )}
                            />
                        )}
                    </button>

                    {/* Add to Cart Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(product.id);
                        }}
                        disabled={product.inventoryStatus === 'out_of_stock' || product.inventoryStatus === 'upcoming' || addingToCart}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                            (product.inventoryStatus === 'out_of_stock' || product.inventoryStatus === 'upcoming' || addingToCart)
                                ? "bg-slate-600 text-gray-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                    >
                        <ShoppingCart size={16} />
                        {addingToCart && 'Đang thêm...'}
                        {!addingToCart && product.inventoryStatus === 'out_of_stock' && 'Hết hàng'}
                        {!addingToCart && product.inventoryStatus === 'upcoming' && 'Sắp có hàng'}
                        {!addingToCart && (!product.inventoryStatus || product.inventoryStatus === 'available') && 'Thêm vào giỏ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ProductListView: React.FC<ProductListViewProps> = ({
    products,
    loading = false,
    error = null,
    showBrand = true,
    showSeller = false,
}) => {
    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                        <div className="flex gap-4">
                            <div className="w-32 h-32 bg-slate-700 rounded-lg animate-pulse"></div>
                            <div className="flex-grow space-y-3">
                                <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                                <div className="h-6 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                                <div className="h-4 bg-slate-700 rounded w-2/3 animate-pulse"></div>
                                <div className="h-5 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                            </div>
                            <div className="w-24 space-y-2">
                                <div className="h-10 bg-slate-700 rounded animate-pulse"></div>
                                <div className="h-10 bg-slate-700 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    console.log(products)

    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📦</div>
                <h3 className="text-gray-300 text-lg font-medium mb-2">Không có sản phẩm nào</h3>
                <p className="text-gray-400 text-sm">Hãy thử tìm kiếm sản phẩm khác</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {products.map((product, index) => (
                <ProductListItem
                    key={`${product.id}-${index}`}
                    product={product}
                    showBrand={showBrand}
                    showSeller={showSeller}
                />
            ))}
        </div>
    );
};

export default ProductListView;