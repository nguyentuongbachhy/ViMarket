import { ArrowRight, CheckCircle, Home } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useCartContext } from '~/contexts';
import { useOrder } from '~/hooks/orders';

export default function OrderSuccessPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { order, loading } = useOrder(orderId!);
    const { refresh: refreshCart } = useCartContext();

    useEffect(() => {
        // Refresh cart after successful order
        refreshCart();
    }, [refreshCart]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>

                    {/* Success Message */}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Đặt hàng thành công!
                    </h1>

                    <p className="text-slate-400 mb-8">
                        Cảm ơn bạn đã đặt hàng. Chúng tôi đã gửi email xác nhận đến địa chỉ email của bạn.
                    </p>

                    {/* Order Details */}
                    {order && (
                        <div className="bg-slate-700 rounded-lg p-6 mb-8 text-left">
                            <h3 className="text-lg font-semibold text-white mb-4">Thông tin đơn hàng</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Mã đơn hàng:</span>
                                    <span className="text-white font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tổng tiền:</span>
                                    <span className="text-green-400 font-semibold">{formatPrice(order.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Trạng thái:</span>
                                    <span className="text-yellow-400">Đang xử lý</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(`/order/${orderId}`)}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>Xem chi tiết đơn hàng</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full bg-slate-600 text-white py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Xem tất cả đơn hàng
                        </button>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full border border-slate-600 text-slate-300 py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <Home className="w-5 h-5" />
                            <span>Tiếp tục mua sắm</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}