import { CreditCard, Minus, Plus, Shield, Truck } from 'lucide-react';
import React from 'react';
import { cn } from '~/lib/utils';

interface ProductPurchasePanelProps {
    product: any;
    quantity: number;
    onAddToCart: () => void;
    onBuyNow: () => void;
    addingToCart: boolean;
    canAddToCart: boolean;
    isOutOfStock: boolean;
    isUpcoming: boolean;
}

export const ProductPurchasePanel: React.FC<ProductPurchasePanelProps> = ({
    product,
    quantity,
    onAddToCart,
    onBuyNow,
    addingToCart,
    canAddToCart,
    isOutOfStock,
    isUpcoming
}) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;

    return (
        <div className="sticky top-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-6">
                {/* Seller Info */}
                {product.seller && (
                    <div className="pb-4 border-b border-slate-700">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    {product.seller.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{product.seller.name}</h3>
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="text-slate-400">4.8 ⭐</span>
                                    <span className="text-slate-500">(4.6k+ đánh giá)</span>
                                </div>
                            </div>
                        </div>
                        {product.seller.isOfficial && (
                            <div className="mt-2">
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-500/30">
                                    ✓ Chính hãng
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Price Display */}
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="text-3xl font-bold text-red-400">
                            {formatPrice(product.price)}
                        </span>
                        {hasDiscount && (
                            <span className="text-lg text-slate-500 line-through">
                                {formatPrice(product.originalPrice)}
                            </span>
                        )}
                    </div>

                    {hasDiscount && (
                        <div className="flex items-center space-x-2">
                            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-medium border border-red-500/30">
                                Giảm {discountPercent}%
                            </span>
                            <span className="text-xs text-slate-400">
                                Tiết kiệm {formatPrice(product.originalPrice - product.price)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Stock Status */}
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-slate-400">Tình trạng:</span>
                        <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            isOutOfStock
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : isUpcoming
                                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                    : "bg-green-500/20 text-green-300 border border-green-500/30"
                        )}>
                            {isOutOfStock ? "Hết hàng" : isUpcoming ? "Sắp có hàng" : "Còn hàng"}
                        </span>
                    </div>

                    {!isOutOfStock && !isUpcoming && (
                        <div className="text-xs text-slate-400">
                            Số lượng có sẵn: {product.quantityInStock || 'Nhiều'}
                        </div>
                    )}
                </div>

                {/* Quantity Selector */}
                {canAddToCart && (
                    <div>
                        <label className="block text-white font-medium mb-3">Số Lượng</label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center border border-slate-600 rounded bg-slate-700">
                                <button
                                    disabled={quantity <= 1}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-l"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    min="1"
                                    max="10"
                                    className="w-16 text-center bg-transparent text-white border-none outline-none py-2"
                                    readOnly
                                />
                                <button
                                    disabled={quantity >= 10}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <span className="text-slate-400 text-sm">Tối đa 10</span>
                        </div>
                    </div>
                )}

                {/* Total Price */}
                <div className="pb-4 border-b border-slate-700">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Tạm tính ({quantity} sản phẩm)</span>
                        <span className="text-2xl font-bold text-red-400">
                            {formatPrice(product.price * quantity)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={onBuyNow}
                        disabled={!canAddToCart || addingToCart}
                        className={cn(
                            "w-full py-3 px-6 font-semibold rounded-lg transition-all duration-200",
                            canAddToCart && !addingToCart
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/25"
                                : "bg-slate-600 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {addingToCart ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Đang xử lý...</span>
                            </div>
                        ) : (
                            isOutOfStock ? "Hết hàng" :
                                isUpcoming ? "Sắp có hàng" : "Mua ngay"
                        )}
                    </button>

                    <button
                        onClick={onAddToCart}
                        disabled={!canAddToCart || addingToCart}
                        className={cn(
                            "w-full py-3 px-6 border font-semibold rounded-lg transition-all duration-200",
                            canAddToCart && !addingToCart
                                ? "border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white shadow-lg hover:shadow-blue-500/25"
                                : "border-slate-600 text-slate-500 cursor-not-allowed"
                        )}
                    >
                        {addingToCart ? "Đang thêm..." : "Thêm vào giỏ"}
                    </button>
                </div>

                {/* Features */}
                <div className="pt-4 border-t border-slate-700">
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Truck size={14} className="text-white" />
                            </div>
                            <span className="text-slate-300">Miễn phí vận chuyển đơn từ 299k</span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Shield size={14} className="text-white" />
                            </div>
                            <span className="text-slate-300">Bảo hành chính hãng 12 tháng</span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <CreditCard size={14} className="text-white" />
                            </div>
                            <span className="text-slate-300">Đổi trả miễn phí trong 7 ngày</span>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="text-center text-xs text-slate-400">
                    🔒 An toàn & Bảo mật 100%
                </div>
            </div>
        </div>
    );
};