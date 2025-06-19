import { CreditCard } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router';
import { cn } from '~/lib/utils';

interface QuickCheckoutProps {
    itemCount: number;
    total: number;
    loading?: boolean;
    isMobile?: boolean;
    onCheckout?: () => void;
}

export const QuickCheckout: React.FC<QuickCheckoutProps> = ({
    itemCount,
    total,
    loading = false,
    isMobile = false,
    onCheckout
}) => {
    const navigate = useNavigate();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleCheckout = () => {
        onCheckout?.();
        navigate('/checkout');
    };

    if (isMobile) {
        return (
            <button
                onClick={handleCheckout}
                disabled={loading || itemCount === 0}
                className={cn(
                    "w-full flex items-center justify-center gap-3 p-4 rounded-lg font-semibold transition-all",
                    loading || itemCount === 0
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700 shadow-lg"
                )}
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải...</span>
                    </>
                ) : (
                    <>
                        <CreditCard size={20} />
                        <div className="text-left">
                            <div className="text-sm">Thanh toán ngay</div>
                            <div className="text-xs opacity-90">{itemCount} sản phẩm - {formatPrice(total)}</div>
                        </div>
                    </>
                )}
            </button>
        );
    }

    return (
        <div className="hidden md:flex items-center">
            {/* <button
                onClick={handleCheckout}
                disabled={loading || itemCount === 0}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm",
                    loading || itemCount === 0
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-600/25"
                )}
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải...</span>
                    </>
                ) : (
                    <>
                        <ShoppingCart size={16} />
                        <span>Thanh toán ({itemCount})</span>
                        <span className="hidden lg:inline text-xs opacity-90">
                            {formatPrice(total)}
                        </span>
                    </>
                )}
            </button> */}
        </div>
    );
};