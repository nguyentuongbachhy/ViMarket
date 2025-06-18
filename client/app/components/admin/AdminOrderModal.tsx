import { useState } from 'react';
import type { Order, OrderStatus } from '~/api/types';
import { mappingOrderStatus } from '../../api/types/order';

interface AdminOrderModalProps {
    order: Order;
    onClose: () => void;
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating: boolean;
}

export function AdminOrderModal({ order, onClose, onUpdateStatus, isUpdating }: AdminOrderModalProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState<{
        show: boolean;
        status: OrderStatus | null;
        message: string;
    }>({ show: false, status: null, message: '' });

    const getStatusBadge = (status: OrderStatus) => {
        const statusConfig = {
            pending: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                text: '⏳ Chờ xử lý'
            },
            confirmed: {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                text: '✅ Đã xác nhận'
            },
            shipped: {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                text: '🚚 Đang giao'
            },
            delivered: {
                color: 'bg-green-100 text-green-800 border-green-200',
                text: '🎉 Đã giao'
            },
            cancelled: {
                color: 'bg-red-100 text-red-800 border-red-200',
                text: '❌ Đã hủy'
            },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const config = {
            paid: { color: 'bg-green-100 text-green-800', text: '✅ Đã thanh toán' },
            pending: { color: 'bg-yellow-100 text-yellow-800', text: '⏳ Chờ thanh toán' },
            failed: { color: 'bg-red-100 text-red-800', text: '❌ Thanh toán thất bại' },
        };

        const statusConfig = config[status as keyof typeof config] || config.pending;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.text}
            </span>
        );
    };

    const getAvailableActions = (currentStatus: OrderStatus) => {
        const actions: Array<{ status: OrderStatus; text: string; color: string; confirmMessage: string }> = [];

        switch (currentStatus) {
            case 'pending':
                actions.push(
                    {
                        status: mappingOrderStatus['confirmed'],
                        text: '✅ Xác nhận đơn hàng',
                        color: 'bg-blue-600 hover:bg-blue-700',
                        confirmMessage: 'Bạn có chắc chắn muốn xác nhận đơn hàng này? Email xác nhận sẽ được gửi tới khách hàng.'
                    },
                    {
                        status: mappingOrderStatus['cancelled'],
                        text: '❌ Hủy đơn hàng',
                        color: 'bg-red-600 hover:bg-red-700',
                        confirmMessage: 'Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.'
                    }
                );
                break;
            case 'confirmed':
                actions.push(
                    {
                        status: mappingOrderStatus['shipped'],
                        text: '🚚 Đánh dấu đã gửi hàng',
                        color: 'bg-purple-600 hover:bg-purple-700',
                        confirmMessage: 'Bạn có chắc chắn đơn hàng đã được gửi đi? Email thông báo sẽ được gửi tới khách hàng.'
                    },
                    {
                        status: mappingOrderStatus['cancelled'],
                        text: '❌ Hủy đơn hàng',
                        color: 'bg-red-600 hover:bg-red-700',
                        confirmMessage: 'Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.'
                    }
                );
                break;
            case 'shipped':
                actions.push({
                    status: mappingOrderStatus['delivered'],
                    text: '🎉 Đánh dấu đã giao hàng',
                    color: 'bg-green-600 hover:bg-green-700',
                    confirmMessage: 'Bạn có chắc chắn đơn hàng đã được giao thành công? Email xác nhận sẽ được gửi tới khách hàng.'
                });
                break;
        }

        return actions;
    };

    const handleStatusUpdate = (status: OrderStatus, message: string) => {
        setShowConfirmDialog({ show: true, status, message });
    };

    const confirmStatusUpdate = () => {
        if (showConfirmDialog.status) {
            onUpdateStatus(order.id, showConfirmDialog.status);
        }
        setShowConfirmDialog({ show: false, status: null, message: '' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDateTime = (dateInput: string | Date) => {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return {
            date: date.toLocaleDateString('vi-VN'),
            time: date.toLocaleTimeString('vi-VN')
        };
    };

    const availableActions = getAvailableActions(order.status);

    return (
        <>
            {/* Main Modal */}
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Chi tiết đơn hàng #{order.id.slice(-8)}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Tạo lúc: {formatDateTime(order.createdAt).date} - {formatDateTime(order.createdAt).time}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Order Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Order Status and Payment */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Trạng thái đơn hàng</h4>
                                    <div className="flex flex-wrap gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Trạng thái đơn hàng</label>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Trạng thái thanh toán</label>
                                            {getPaymentStatusBadge(order.paymentStatus)}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Phương thức thanh toán</label>
                                            <span className="text-sm font-medium text-gray-900">
                                                {order.paymentMethod === 'cash_on_delivery' ? '💵 COD' :
                                                    order.paymentMethod === 'credit_card' ? '💳 Thẻ tín dụng' :
                                                        order.paymentMethod === 'bank_transfer' ? '🏦 Chuyển khoản' :
                                                            order.paymentMethod}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Thông tin khách hàng</h4>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-sm text-gray-600">Mã khách hàng</label>
                                            <p className="text-sm font-mono text-gray-900">{order.userId}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Địa chỉ giao hàng</h4>
                                    <div className="text-sm text-gray-900 space-y-1">
                                        <p>{order.shippingAddress.street}</p>
                                        <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                        <p>{order.shippingAddress.zipCode}</p>
                                        <p>{order.shippingAddress.country}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Sản phẩm đã đặt</h4>
                                    <div className="space-y-3">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {item.imageUrl && (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.productName}
                                                            className="w-12 h-12 object-cover rounded-md border border-gray-200"
                                                        />
                                                    )}
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{item.productName}</h5>
                                                        <p className="text-sm text-gray-600">
                                                            {formatCurrency(item.price)} × {item.quantity}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">
                                                        {formatCurrency(item.totalPrice)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Notes */}
                                {order.notes && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Ghi chú đơn hàng</h4>
                                        <p className="text-sm text-gray-700">{order.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Actions and Summary */}
                            <div className="space-y-6">
                                {/* Order Summary */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Tóm tắt đơn hàng</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Số lượng sản phẩm:</span>
                                            <span className="font-medium">{order.items.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tổng số lượng:</span>
                                            <span className="font-medium">
                                                {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tạm tính:</span>
                                            <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phí vận chuyển:</span>
                                            <span className="font-medium">Miễn phí</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-2 mt-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-900">Tổng cộng:</span>
                                                <span className="font-bold text-lg text-indigo-600">
                                                    {formatCurrency(order.totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Timeline */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Lịch sử đơn hàng</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Đơn hàng được tạo</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDateTime(order.createdAt).date} - {formatDateTime(order.createdAt).time}
                                                </p>
                                            </div>
                                        </div>
                                        {order.status !== 'pending' && (
                                            <div className="flex items-start space-x-3">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Đơn hàng được xác nhận</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDateTime(order.updatedAt).date} - {formatDateTime(order.updatedAt).time}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {/* Add more timeline items based on status */}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {availableActions.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Hành động</h4>
                                        <div className="space-y-2">
                                            {availableActions.map((action) => (
                                                <button
                                                    key={action.status}
                                                    onClick={() => handleStatusUpdate(action.status, action.confirmMessage)}
                                                    disabled={isUpdating}
                                                    className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                                                >
                                                    {isUpdating ? 'Đang xử lý...' : action.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Additional Actions */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Thao tác khác</h4>
                                    <div className="space-y-2">
                                        <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                            📄 In hóa đơn
                                        </button>
                                        <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                            📧 Gửi lại email
                                        </button>
                                        <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                            📋 Sao chép thông tin
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog.show && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-3 text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Xác nhận thay đổi
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {showConfirmDialog.message}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    onClick={confirmStatusUpdate}
                                    disabled={isUpdating}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                >
                                    {isUpdating ? 'Đang xử lý...' : 'Xác nhận'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmDialog({ show: false, status: null, message: '' })}
                                    disabled={isUpdating}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}