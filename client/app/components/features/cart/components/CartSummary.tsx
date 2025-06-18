// ~/components/features/cart/components/CartSummary.tsx
import { CreditCard, Shield, Tag, Truck } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Cart } from '~/api/types';
import { cn } from '~/lib/utils';

interface CartSummaryProps {
    cart: Cart | null;
    loading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
    cart,
    loading = false
}) => {
    const navigate = useNavigate();
    const [promoCode, setPromoCode] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: cart?.pricing.currency || 'VND'
        }).format(price);
    };

    const subtotal = cart?.pricing.subtotal || 0;
    const shipping = cart?.pricing.shipping || 0;
    const tax = cart?.pricing.tax || 0;
    const discount = cart?.pricing.discount || 0;
    const total = cart?.pricing.total || 0;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;

        setIsApplyingPromo(true);
        // TODO: Implement promo code API call
        setTimeout(() => {
            setIsApplyingPromo(false);
            // Handle promo code logic here
        }, 1000);
    };

    const handleCheckout = () => {
        if (!cart || cart.items.length === 0) return;

        // Navigate to checkout page
        navigate('/checkout');
    };

    const canCheckout = cart && cart.items.length > 0 && !loading;

    if (!cart) return null;

    return (
        <div className="sticky top-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
                    <h2 className="text-lg font-semibold text-white">Tóm tắt đơn hàng</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Promo Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Mã giảm giá
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                placeholder="Nhập mã giảm giá"
                                className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleApplyPromo}
                                disabled={!promoCode.trim() || isApplyingPromo}
                                className={cn(
                                    "px-4 py-2 rounded-lg font-medium transition-colors",
                                    promoCode.trim() && !isApplyingPromo
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                )}
                            >
                                {isApplyingPromo ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Áp dụng"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-300">
                            <span>Tạm tính ({cart.totalItems} sản phẩm)</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>

                        <div className="flex justify-between text-gray-300">
                            <span className="flex items-center gap-2">
                                <Truck size={16} />
                                Phí vận chuyển
                            </span>
                            <span className={shipping === 0 ? "text-green-400" : ""}>
                                {shipping === 0 ? "Miễn phí" : formatPrice(shipping)}
                            </span>
                        </div>

                        {tax > 0 && (
                            <div className="flex justify-between text-gray-300">
                                <span>Thuế VAT (10%)</span>
                                <span>{formatPrice(tax)}</span>
                            </div>
                        )}

                        {discount > 0 && (
                            <div className="flex justify-between text-green-400">
                                <span className="flex items-center gap-2">
                                    <Tag size={16} />
                                    Giảm giá
                                </span>
                                <span>-{formatPrice(discount)}</span>
                            </div>
                        )}

                        <div className="border-t border-gray-600 pt-3">
                            <div className="flex justify-between text-white font-bold text-lg">
                                <span>Tổng cộng</span>
                                <span className="text-red-400">{formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Free Shipping Notice */}
                    {shipping === 0 && subtotal > 0 && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                <Shield size={16} />
                                <span>Bạn được miễn phí vận chuyển!</span>
                            </div>
                        </div>
                    )}

                    {/* Shipping Threshold */}
                    {shipping > 0 && cart.pricing.freeShippingThreshold && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                            <div className="text-blue-400 text-sm">
                                <p>Mua thêm {formatPrice(cart.pricing.freeShippingThreshold - subtotal)} để được miễn phí vận chuyển</p>
                            </div>
                        </div>
                    )}

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        disabled={!canCheckout}
                        className={cn(
                            "w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2",
                            canCheckout
                                ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-lg hover:shadow-red-600/25"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        <CreditCard size={20} />
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Đang xử lý...
                            </>
                        ) : (
                            `Thanh toán - ${formatPrice(total)}`
                        )}
                    </button>

                    {/* Continue Shopping */}
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Tiếp tục mua sắm
                    </button>

                    {/* Security Info */}
                    <div className="text-center text-xs text-gray-400">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Shield size={14} />
                            <span>Thanh toán bảo mật 100%</span>
                        </div>
                        <p>Thông tin của bạn được mã hóa và bảo vệ</p>
                    </div>

                    {/* Payment Methods */}
                    <div className="text-center">
                        <p className="text-xs text-gray-400 mb-2">Phương thức thanh toán</p>
                        <div className="flex justify-center gap-2">
                            <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                VISA
                            </div>
                            <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                MC
                            </div>
                            <div className="w-8 h-5 bg-pink-500 rounded text-white text-xs flex items-center justify-center font-bold">
                                M
                            </div>
                            <div className="w-8 h-5 bg-gray-600 rounded text-white text-xs flex items-center justify-center">
                                COD
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};