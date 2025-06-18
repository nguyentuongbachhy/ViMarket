import { ArrowLeft, ShoppingBag } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useCartContext } from '~/contexts';
import { cn } from '~/lib/utils';
import type { CartProps } from './Cart.types';
import { cartVariants } from './Cart.variants';
import { CartEmpty } from './components/CartEmpty';
import { CartItem } from './components/CartItem';
import { CartSummary } from './components/CartSummary';

export const Cart: React.FC<CartProps> = ({
    className,
    showBackButton = true,
    ...props
}) => {
    const navigate = useNavigate();
    const {
        cart,
        loading,
        error,
        isEmpty,
        updateCartItem,
        removeFromCart,
        clearCart,
        clearError
    } = useCartContext();

    // Quick checkout handler for header button
    const handleQuickCheckout = () => {
        if (cart && cart.items.length > 0) {
            navigate('/checkout');
        }
    };

    if (loading && !cart) {
        return (
            <div className={cn(cartVariants(), className)} {...props}>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-700 rounded w-1/3"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className={cn(cartVariants(), className)} {...props}>
                <CartEmpty showBackButton={showBackButton} />
            </div>
        );
    }

    return (
        <div className={cn(cartVariants(), className)} {...props}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {showBackButton && (
                        <Link
                            to="/"
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag size={28} className="text-blue-400" />
                        Giỏ hàng
                        {cart && (
                            <span className="text-lg text-gray-400 font-normal">
                                ({cart.totalItems} sản phẩm)
                            </span>
                        )}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Checkout Button */}
                    {cart && cart.items.length > 0 && (
                        <button
                            onClick={handleQuickCheckout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            Thanh toán ngay
                        </button>
                    )}

                    {/* Clear All Button */}
                    {cart && cart.items.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                            disabled={loading}
                        >
                            Xóa tất cả
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={clearError}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Cart Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart?.items.map((item) => (
                        <CartItem
                            key={item.productId}
                            item={item}
                            onUpdateQuantity={(quantity) => updateCartItem(item.productId, quantity)}
                            onRemove={() => removeFromCart(item.productId)}
                            loading={loading}
                        />
                    ))}
                </div>

                {/* Cart Summary */}
                <div className="lg:col-span-1">
                    <CartSummary cart={cart} loading={loading} />
                </div>
            </div>
        </div>
    );
};

export default Cart;