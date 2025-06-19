import { Heart, ShoppingCart, Star } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';
import { useCartContext, useWishlistContext } from '~/contexts';
import { useQuickAddToCart } from '~/hooks/cart';
import { useQuickWishlistToggle } from '~/hooks/wishlist';
import { cn } from '~/lib/utils';
import type { ProductCardProps } from './ProductCard.types';

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    className,
    showBrand = true,
    showSeller = false,
    imageHeight = 'md'
}) => {
    if (!product) {
        return (
            <div className="bg-gray-100 rounded-lg p-4 text-center">
                <span className="text-gray-500">Product not found</span>
            </div>
        );
    }

    const { quickAdd, loading: addingToCart } = useQuickAddToCart();
    const { toggle: toggleWishlist, loading: wishlistLoading } = useQuickWishlistToggle();

    const { refresh: refreshCart } = useCartContext();
    const { refresh: refreshWishlist } = useWishlistContext();

    const [isInWishlist, setIsInWishlist] = useState(false);

    // Handle product interactions
    const handleAddToCart = async (productId: string) => {
        try {
            const success = await quickAdd(productId, 1);
            if (success) {
                await refreshCart();
                console.log('Added to cart:', productId);
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    const handleWishlistToggle = async (productId: string) => {
        try {
            const newStatus = await toggleWishlist(productId)
            if (newStatus !== null) {
                setIsInWishlist(newStatus)
                await refreshWishlist();
                console.log('Toggled to wishlist:', productId)
            }
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
        }
    }

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

    const formatRating = (rating?: number) => {
        return rating ? rating.toFixed(1) : '0.0';
    };

    const getImageHeightClass = () => {
        switch (imageHeight) {
            case 'sm': return 'h-32';
            case 'md': return 'h-40 sm:h-48';
            case 'lg': return 'h-48 sm:h-56';
            default: return 'h-40 sm:h-48';
        }
    };

    const getInventoryStatus = () => {
        const status = product.inventoryStatus?.toLowerCase();
        if (status === 'available') return { text: 'Còn hàng', color: 'text-green-600' };
        if (status === 'out_of_stock') return { text: 'Hết hàng', color: 'text-red-600' };
        if (status === 'upcoming') return { text: 'Sắp có hàng', color: 'text-blue-600' };
        if (status === '' || !status) return { text: 'Chưa cập nhật', color: 'text-gray-500' };
        return { text: 'Không rõ', color: 'text-gray-500' };
    };

    const inventoryStatus = getInventoryStatus();
    const primaryImage = product.images?.[0]?.url;

    return (
        <div className={cn(
            "bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-200 relative",
            className
        )}>
            {/* Product Image */}
            <div className="relative overflow-hidden">
                <Link to={`/product/${product.id}`}>
                    <div className={cn("relative w-full bg-gray-100 cursor-pointer", getImageHeightClass())}>
                        {primaryImage ? (
                            <img
                                src={primaryImage}
                                alt={product.name || 'Product'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}

                        {/* Fallback for missing image */}
                        <div className={cn(
                            "w-full h-full bg-gray-200 flex items-center justify-center",
                            primaryImage ? "hidden" : ""
                        )}>
                            <span className="text-gray-400 text-sm">No Image</span>
                        </div>

                        {/* Discount Badge */}
                        {hasDiscount && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                                -{discountPercentage}%
                            </div>
                        )}

                        {/* Wishlist Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleWishlistToggle(product.id)
                            }}
                            disabled={wishlistLoading}
                            className={cn(
                                "absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-200 cursor-pointer",
                                "hover:scale-110 active:scale-95",
                                wishlistLoading
                                    ? "bg-gray-100 cursor-not-allowed"
                                    : "bg-white hover:bg-gray-50",
                                "opacity-0 group-hover:opacity-100"
                            )}
                            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                            title={isInWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                        >
                            {wishlistLoading ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Heart
                                    size={16}
                                    className={cn(
                                        "transition-colors duration-200",
                                        isInWishlist
                                            ? "text-red-500 fill-current"
                                            : "text-gray-600 hover:text-red-500"
                                    )}
                                />
                            )}
                        </button>
                    </div>
                </Link>
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4 space-y-2">
                {/* Brand */}
                {showBrand && product.brand?.name && (
                    <div className="text-xs text-blue-600 font-medium">
                        {product.brand.name}
                    </div>
                )}

                {/* Product Name */}
                <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm sm:text-base font-medium text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer">
                        {product.name || 'Unnamed Product'}
                    </h3>
                </Link>

                {/* Short Description */}
                {product.shortDescription && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                        {product.shortDescription}
                    </p>
                )}

                {/* Rating */}
                {product.ratingAverage && product.ratingAverage > 0 && (
                    <div className="flex items-center gap-1">
                        <div className="flex items-center">
                            <Star size={14} className="text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-700 ml-1">
                                {formatRating(product.ratingAverage)}
                            </span>
                        </div>
                        {product.reviewCount > 0 && (
                            <span className="text-xs text-gray-500">
                                ({product.reviewCount} đánh giá)
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

                {/* Additional Info */}
                <div className="flex items-center justify-between text-xs">
                    <span className={inventoryStatus.color}>
                        {inventoryStatus.text}
                    </span>
                    {product.quantitySold > 0 && (
                        <span className="text-gray-500">
                            Đã bán {product.quantitySold}
                        </span>
                    )}
                </div>

                {/* Seller Info */}
                {showSeller && product.seller?.name && (
                    <div className="text-xs text-gray-600">
                        Bán bởi: {product.seller.name}
                        {product.seller.isOfficial && (
                            <span className="ml-1 text-blue-600 font-medium">(Chính hãng)</span>
                        )}
                    </div>
                )}

                {/* Add to Cart Button */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product.id);
                    }}
                    disabled={product.inventoryStatus === 'out_of_stock' || product.inventoryStatus === 'upcoming' || addingToCart}
                    className={cn(
                        "w-full py-2 px-3 cursor-pointer rounded-md text-sm font-medium transition-colors",
                        (product.inventoryStatus === 'out_of_stock' || product.inventoryStatus === 'upcoming' || addingToCart)
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                    )}
                >
                    <div className="flex items-center justify-center gap-2">
                        <ShoppingCart size={16} />
                        {addingToCart && 'Đang thêm...'}
                        {!addingToCart && product.inventoryStatus === 'out_of_stock' && 'Hết hàng'}
                        {!addingToCart && product.inventoryStatus === 'upcoming' && 'Sắp có hàng'}
                        {!addingToCart && (!product.inventoryStatus || product.inventoryStatus === 'available' || product.inventoryStatus === '') && 'Thêm vào giỏ'}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default ProductCard;