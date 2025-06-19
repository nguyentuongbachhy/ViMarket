import { Heart, Minus, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';
import type { CartItemWithProduct } from '~/api/types';
import { cn } from '~/lib/utils';

interface CartItemProps {
    item: CartItemWithProduct;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
    loading?: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
    item,
    onUpdateQuantity,
    onRemove,
    loading = false
}) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1 || newQuantity > 10 || isUpdating) return;

        setIsUpdating(true);
        try {
            await onUpdateQuantity(newQuantity);
        } finally {
            setIsUpdating(false);
        }
    };

    const product = item.product;
    if (!product) {
        return (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-center text-gray-400">
                    <p>Sản phẩm không tồn tại</p>
                    <button
                        onClick={onRemove}
                        className="mt-2 text-red-400 hover:text-red-300 text-sm"
                    >
                        Xóa khỏi giỏ hàng
                    </button>
                </div>
            </div>
        );
    }

    const productName = product.name || 'Sản phẩm không tên';
    const productPrice = product.price || 0;
    const productOriginalPrice = product.originalPrice;
    const productBrand = product.brand?.name;
    const productImage = product.images?.[0]?.url;
    const hasDiscount = productOriginalPrice && productOriginalPrice > productPrice;

    return (
        <div className={cn(
            "bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors",
            "relative", // For loading overlay
            (isUpdating || loading) && "pointer-events-none"
        )}>
            <div className="flex gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                    <Link to={`/product/${item.productId}`}>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-700 rounded-lg overflow-hidden">
                            {productImage ? (
                                <img
                                    src={productImage}
                                    alt={productName}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}

                            {/* Fallback for missing image */}
                            <div className={cn(
                                "w-full h-full flex items-center justify-center bg-gray-700",
                                productImage ? "hidden" : ""
                            )}>
                                <span className="text-gray-500 text-xs">No Image</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Product Info */}
                <div className="flex-grow min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        {/* Product Details */}
                        <div className="flex-grow min-w-0">
                            <Link
                                to={`/product/${item.productId}`}
                                className="text-white hover:text-blue-400 transition-colors"
                            >
                                <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-1">
                                    {productName}
                                </h3>
                            </Link>

                            {productBrand && (
                                <p className="text-blue-400 text-xs mb-2">{productBrand}</p>
                            )}

                            {product.shortDescription && (
                                <p className="text-gray-400 text-xs mb-2 line-clamp-1">
                                    {product.shortDescription}
                                </p>
                            )}

                            {/* Individual Price */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-red-400 font-bold text-sm sm:text-base">
                                    {formatPrice(productPrice)}
                                </span>
                                {hasDiscount && (
                                    <span className="text-gray-500 line-through text-xs sm:text-sm">
                                        {formatPrice(productOriginalPrice!)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 sm:items-end">
                            {/* Subtotal */}
                            <div className="text-right">
                                <p className="text-white font-bold text-sm sm:text-base">
                                    {formatPrice(item.totalPrice)}
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {formatPrice(productPrice)} x {item.quantity}
                                </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-gray-700 rounded-lg">
                                    <button
                                        onClick={() => handleQuantityChange(item.quantity - 1)}
                                        disabled={item.quantity <= 1 || isUpdating || loading}
                                        className={cn(
                                            "p-2 hover:bg-gray-600 rounded-l-lg transition-colors",
                                            (item.quantity <= 1 || isUpdating || loading) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <Minus size={14} />
                                    </button>

                                    <span className="px-3 py-2 text-sm font-medium min-w-[3rem] text-center">
                                        {item.quantity}
                                    </span>

                                    <button
                                        onClick={() => handleQuantityChange(item.quantity + 1)}
                                        disabled={item.quantity >= 10 || isUpdating || loading}
                                        className={cn(
                                            "p-2 hover:bg-gray-600 rounded-r-lg transition-colors",
                                            (item.quantity >= 10 || isUpdating || loading) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={onRemove}
                                    disabled={loading || isUpdating}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Xóa khỏi giỏ hàng"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Save for later */}
                                <button
                                    className="p-2 text-gray-400 hover:text-pink-400 hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Lưu để mua sau"
                                    disabled={loading || isUpdating}
                                >
                                    <Heart size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Status */}
                    {product.inventoryStatus && product.inventoryStatus !== 'available' && (
                        <div className="mt-2 text-xs">
                            {product.inventoryStatus === 'out_of_stock' && (
                                <span className="text-red-400 bg-red-900/20 px-2 py-1 rounded">
                                    Hết hàng
                                </span>
                            )}
                            {product.inventoryStatus === 'upcoming' && (
                                <span className="text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                                    Sắp có hàng
                                </span>
                            )}
                        </div>
                    )}

                    {/* Item metadata */}
                    {item.addedAt && (
                        <div className="mt-2 text-xs text-gray-500">
                            Thêm vào: {new Date(item.addedAt).toLocaleDateString('vi-VN')}
                        </div>
                    )}
                </div>
            </div>

            {/* Loading overlay */}
            {(isUpdating || loading) && (
                <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};