import React from 'react';
import { cn } from '~/lib/utils';

interface CartItem {
    productId: string;
    quantity: number;
    totalPrice: number;
    product: {
        name: string;
        images?: Array<{ url: string }>;
    };
}

interface Cart {
    items: CartItem[];
    totalItems: number;
    pricing: {
        subtotal: number;
        total: number;
    };
}

interface OrderSummaryProps {
    cart: Cart;
    loading?: boolean;
    error?: string | null;
    onCheckout: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    cart,
    loading = false,
    error,
    onCheckout
}) => {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 sticky top-4">
            <h2 className="text-xl font-bold text-white mb-6">Đơn hàng của bạn</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                {cart.items.map((item) => (
                    <div key={item.productId} className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                                src={item.product.images?.[0]?.url || '/api/placeholder/64/64'}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">{item.product.name}</h3>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">SL: {item.quantity}</span>
                                <span className="text-slate-300">{formatPrice(item.totalPrice)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-3 border-t border-slate-700 pt-4">
                <div className="flex justify-between text-slate-300">
                    <span>Tạm tính ({cart.totalItems} sản phẩm)</span>
                    <span>{formatPrice(cart.pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                    <span>Phí vận chuyển</span>
                    <span>Miễn phí</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white border-t border-slate-700 pt-3">
                    <span>Tổng cộng</span>
                    <span className="text-red-400">{formatPrice(cart.pricing.total)}</span>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
                    <p className="text-red-200 text-sm">{error}</p>
                </div>
            )}

            {/* Checkout Button */}
            <button
                onClick={onCheckout}
                disabled={loading}
                className={cn(
                    "w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-all",
                    loading
                        ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-600/25"
                )}
            >
                {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span>Đang xử lý...</span>
                    </div>
                ) : (
                    `Đặt hàng - ${formatPrice(cart.pricing.total)}`
                )}
            </button>

            {/* Security Notice */}
            <div className="mt-4 text-xs text-slate-400 text-center">
                🔒 Thông tin của bạn được bảo mật an toàn
            </div>
        </div>
    );
};