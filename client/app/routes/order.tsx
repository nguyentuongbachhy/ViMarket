// ~/routes/order/+page.tsx
import { ArrowLeft, Calendar, CheckCircle, Package, Truck, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { OrderStatus } from '~/api';
import { useCancelOrder, useOrder } from '~/hooks/orders';
import { cn } from '~/lib/utils';
import type { Route } from './+types/order';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Chi tiết đơn hàng | ViMarket' },
        { name: 'description', content: 'Xem chi tiết đơn hàng và trạng thái giao hàng' },
    ];
}

const orderStatusConfig = {
    pending: {
        label: 'Chờ xác nhận',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        icon: Package,
        description: 'Đơn hàng đang được xử lý'
    },
    confirmed: {
        label: 'Đã xác nhận',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        icon: CheckCircle,
        description: 'Đơn hàng đã được xác nhận'
    },
    shipped: {
        label: 'Đang giao',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        icon: Truck,
        description: 'Đơn hàng đang được giao'
    },
    delivered: {
        label: 'Đã giao',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: CheckCircle,
        description: 'Đơn hàng đã được giao thành công'
    },
    cancelled: {
        label: 'Đã hủy',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: XCircle,
        description: 'Đơn hàng đã bị hủy'
    }
};

// Loading Skeleton
const OrderDetailSkeleton = () => (
    <div className="min-h-screen bg-slate-900">
        <div className="bg-slate-800 border-b border-slate-700">
            <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex items-center space-x-4 animate-pulse">
                    <div className="w-6 h-6 bg-slate-700 rounded"></div>
                    <div>
                        <div className="h-8 bg-slate-700 rounded w-64 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-48"></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
                            <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-slate-700 rounded"></div>
                                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
                        <div className="h-6 bg-slate-700 rounded w-1/2 mb-6"></div>
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                                    <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Order Timeline Component
const OrderTimeline: React.FC<{
    order: {
        status: OrderStatus;
        updatedAt: string | Date;
    }
}> = ({ order }) => {
    const getStatusSteps = (currentStatus: OrderStatus) => {
        const allSteps = [
            { status: 'pending', label: 'Đơn hàng được tạo', icon: Package },
            { status: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle },
            { status: 'shipped', label: 'Đang vận chuyển', icon: Truck },
            { status: 'delivered', label: 'Đã giao hàng', icon: CheckCircle },
        ];

        if (currentStatus === 'cancelled') {
            return [
                { status: 'pending', label: 'Đơn hàng được tạo', icon: Package },
                { status: 'cancelled', label: 'Đơn hàng đã bị hủy', icon: XCircle },
            ];
        }

        return allSteps;
    };

    const steps = getStatusSteps(order.status);
    const currentIndex = steps.findIndex(step => step.status === order.status);

    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-blue-400" />
                Trạng thái đơn hàng
            </h2>

            <div className="space-y-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const isCancelled = order.status === 'cancelled' && step.status === 'cancelled';

                    return (
                        <div key={step.status} className="flex items-center space-x-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2",
                                isCompleted || isCurrent
                                    ? isCancelled
                                        ? "bg-red-500/20 border-red-500 text-red-400"
                                        : "bg-green-500/20 border-green-500 text-green-400"
                                    : "bg-slate-700 border-slate-600 text-slate-400"
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1">
                                <div className={cn(
                                    "font-medium",
                                    isCompleted || isCurrent ? "text-white" : "text-slate-400"
                                )}>
                                    {step.label}
                                </div>
                                {isCurrent && (
                                    <div className="text-sm text-slate-400 mt-1">
                                        {orderStatusConfig[order.status]?.description}
                                    </div>
                                )}
                            </div>

                            {isCurrent && (
                                <div className="text-sm text-slate-400">
                                    {new Date(order.updatedAt).toLocaleDateString('vi-VN')}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Address Card Component
const AddressCard: React.FC<{
    title: string;
    address: any;
    icon: React.ReactNode;
}> = ({ title, address, icon }) => {
    if (!address) return null;

    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                {icon}
                <span className="ml-3">{title}</span>
            </h2>

            <div className="space-y-2 text-slate-300">
                <div>{address.street}</div>
                <div>{address.city}, {address.state}</div>
                <div>{address.zipCode}, {address.country}</div>
            </div>
        </div>
    );
};

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { order, loading, error, refetch } = useOrder(orderId!);
    const { cancelOrder, loading: cancelling, error: cancelError } = useCancelOrder();
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString: string | Date) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCancelOrder = async () => {
        if (!orderId) return;

        try {
            await cancelOrder(orderId);
            setShowCancelConfirm(false);
            await refetch();
        } catch (error) {
            console.error('Failed to cancel order:', error);
        }
    };

    const canCancelOrder = order?.status === 'pending' || order?.status === 'confirmed';

    if (loading && !order) {
        return <OrderDetailSkeleton />;
    }

    if ((error && !order) || !orderId) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {error || 'Không tìm thấy đơn hàng'}
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Đơn hàng không tồn tại hoặc bạn không có quyền truy cập
                    </p>
                    <div className="space-x-4">
                        <button
                            onClick={() => navigate('/orders')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Xem đơn hàng khác
                        </button>
                        <button
                            onClick={refetch}
                            className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Đang tải đơn hàng...</h2>
                </div>
            </div>
        );
    }

    const statusConfig = orderStatusConfig[order.status];
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/orders')}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Đơn hàng #{order.id.slice(-8).toUpperCase()}
                                </h1>
                                <p className="text-slate-400">
                                    Đặt ngày {formatDate(order.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <span className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium border flex items-center space-x-2",
                                statusConfig.color,
                                statusConfig.bgColor,
                                statusConfig.borderColor
                            )}>
                                <StatusIcon className="w-4 h-4" />
                                <span>{statusConfig.label}</span>
                            </span>

                            {canCancelOrder && (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    disabled={cancelling}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Cancel Error */}
                {cancelError && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">
                        <p>{cancelError}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Timeline */}
                        <OrderTimeline order={order} />

                        {/* Order Items */}
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                                <Package className="w-6 h-6 mr-3 text-blue-400" />
                                Sản phẩm đã đặt ({order.items?.length || 0})
                            </h2>

                            <div className="space-y-4">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-slate-700 rounded-lg">
                                        <div className="w-20 h-20 bg-slate-600 rounded-lg overflow-hidden">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Package className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium mb-1">{item.productName}</h3>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">
                                                    {formatPrice(item.price)} × {item.quantity}
                                                </span>
                                                <span className="text-white font-medium">
                                                    {formatPrice(item.totalPrice)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <AddressCard
                            title="Địa chỉ giao hàng"
                            address={order.shippingAddress}
                            icon={<Truck className="w-5 h-5 text-green-400" />}
                        />

                        {/* Order Notes */}
                        {order.notes && (
                            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                                <h2 className="text-xl font-bold text-white mb-4">Ghi chú đơn hàng</h2>
                                <p className="text-slate-300">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 sticky top-4">
                            <h2 className="text-xl font-bold text-white mb-6">Tóm tắt đơn hàng</h2>

                            {/* Order Info */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Mã đơn hàng:</span>
                                    <span className="text-white font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Ngày đặt:</span>
                                    <span className="text-white">{formatDate(order.createdAt)}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Phương thức thanh toán:</span>
                                    <span className="text-white">{order.paymentMethod}</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Trạng thái thanh toán:</span>
                                    <span className={cn(
                                        "font-medium",
                                        order.paymentStatus === 'paid' ? 'text-green-400' :
                                            order.paymentStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'
                                    )}>
                                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' :
                                            order.paymentStatus === 'failed' ? 'Thanh toán thất bại' : 'Chờ thanh toán'}
                                    </span>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 border-t border-slate-700 pt-4">
                                <div className="flex justify-between text-slate-300">
                                    <span>Tạm tính ({order.items?.length || 0} sản phẩm)</span>
                                    <span>{formatPrice(order.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0)}</span>
                                </div>

                                <div className="flex justify-between text-slate-300">
                                    <span>Phí vận chuyển</span>
                                    <span>Miễn phí</span>
                                </div>

                                <div className="flex justify-between text-xl font-bold text-white border-t border-slate-700 pt-3">
                                    <span>Tổng cộng</span>
                                    <span className="text-red-400">{formatPrice(order.totalAmount)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <button
                                    onClick={() => navigate(`/product/${order.items?.[0]?.productId}`)}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                    disabled={!order.items?.[0]?.productId}
                                >
                                    Mua lại
                                </button>

                                {order.status === 'delivered' && (
                                    <button className="w-full bg-slate-600 text-white py-3 rounded-lg hover:bg-slate-700 transition-colors">
                                        Đánh giá sản phẩm
                                    </button>
                                )}

                                <button
                                    onClick={() => navigate('/orders')}
                                    className="w-full border border-slate-600 text-slate-300 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    Xem tất cả đơn hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-white mb-4">Xác nhận hủy đơn hàng</h3>
                        <p className="text-slate-300 mb-6">
                            Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={cancelling}
                                className="flex-1 bg-slate-600 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                                Không
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}