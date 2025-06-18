// app/components/admin/AdminOrdersTable.tsx
import { useState } from 'react';
import type { Order, OrderStatus } from '~/api/types';
import { mappingOrderStatus } from '../../api/types/order';

interface AdminOrdersTableProps {
    orders: Order[];
    loading: boolean;
    isUpdating: string | null;
    actionInProgress: string | null;
    onViewOrder: (order: Order) => void;
    onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
    onBulkAction: (orderIds: string[], action: string) => void;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function AdminOrdersTable({
    orders,
    loading,
    isUpdating,
    actionInProgress,
    onViewOrder,
    onUpdateStatus,
    onBulkAction,
    sortBy,
    sortOrder,
    onSort,
    onExport
}: AdminOrdersTableProps & { onExport: (format: 'excel' | 'pdf') => void }) {
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    const getStatusBadge = (status: OrderStatus) => {
        const statusConfig = {
            pending: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                text: '⏳ Chờ xử lý',
                icon: '⏳'
            },
            confirmed: {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                text: '✅ Đã xác nhận',
                icon: '✅'
            },
            shipped: {
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                text: '🚚 Đang giao',
                icon: '🚚'
            },
            delivered: {
                color: 'bg-green-100 text-green-800 border-green-200',
                text: '🎉 Đã giao',
                icon: '🎉'
            },
            cancelled: {
                color: 'bg-red-100 text-red-800 border-red-200',
                text: '❌ Đã hủy',
                icon: '❌'
            },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                <span className="mr-1">{config.icon}</span>
                {config.text.replace(/^.+ /, '')}
            </span>
        );
    };

    const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
        const transitions: Record<OrderStatus, OrderStatus | null> = {
            pending: mappingOrderStatus['confirmed'],
            confirmed: mappingOrderStatus['shipped'],
            shipped: mappingOrderStatus['delivered'],
            delivered: null,
            cancelled: null,
        };
        return transitions[currentStatus];
    };

    const getNextStatusText = (currentStatus: OrderStatus): string => {
        const nextStatus = getNextStatus(currentStatus);
        const actionTexts: Record<OrderStatus, string> = {
            confirmed: 'Xác nhận',
            shipped: 'Đánh dấu đã gửi',
            delivered: 'Đánh dấu đã giao',
            pending: '',
            cancelled: '',
        };
        return nextStatus ? actionTexts[nextStatus] : '';
    };

    const handleSelectOrder = (orderId: string) => {
        const newSelected = new Set(selectedOrders);
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId);
        } else {
            newSelected.add(orderId);
        }
        setSelectedOrders(newSelected);
        setShowBulkActions(newSelected.size > 0);
    };

    const handleSelectAll = () => {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set());
            setShowBulkActions(false);
        } else {
            setSelectedOrders(new Set(orders.map(order => order.id)));
            setShowBulkActions(true);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            onSort(column, sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            onSort(column, 'desc');
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortBy !== column) {
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortOrder === 'asc' ? (
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
        );
    };

    if (loading && orders.length === 0) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đơn hàng</h3>
                <p className="mt-1 text-sm text-gray-500">Chưa có đơn hàng nào phù hợp với bộ lọc hiện tại.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Bulk Actions Bar */}
            {showBulkActions && (
                <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-indigo-700">
                                Đã chọn {selectedOrders.size} đơn hàng
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onExport('excel')}
                                className="text-sm bg-white border border-indigo-300 rounded-md px-3 py-1 text-indigo-700 hover:bg-indigo-50"
                            >
                                📊 Xuất Excel
                            </button>
                            <button
                                onClick={() => onExport('pdf')}
                                className="text-sm bg-white border border-indigo-300 rounded-md px-3 py-1 text-indigo-700 hover:bg-indigo-50"
                            >
                                📄 Xuất PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.size === orders.length && orders.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('id')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Mã đơn hàng</span>
                                    <SortIcon column="id" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Khách hàng
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sản phẩm
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('totalAmount')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Tổng tiền</span>
                                    <SortIcon column="totalAmount" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Trạng thái</span>
                                    <SortIcon column="status" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thanh toán
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Ngày tạo</span>
                                    <SortIcon column="createdAt" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => {
                            const nextStatus = getNextStatus(order.status);
                            const nextStatusText = getNextStatusText(order.status);
                            const isSelected = selectedOrders.has(order.id);
                            const isOrderUpdating = isUpdating === order.id || actionInProgress === order.id;

                            return (
                                <tr
                                    key={order.id}
                                    className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''} ${isOrderUpdating ? 'opacity-50' : ''}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectOrder(order.id)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            #{order.id.slice(-8)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.paymentMethod}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {order.userId.slice(0, 8)}...
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.shippingAddress.city}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            {order.items.length} sản phẩm
                                        </div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                            {order.items.slice(0, 2).map(item => item.productName).join(', ')}
                                            {order.items.length > 2 && '...'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND'
                                            }).format(order.totalAmount)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.currency}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : order.paymentStatus === 'failed'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.paymentStatus === 'paid' ? '✅ Đã thanh toán' :
                                                order.paymentStatus === 'failed' ? '❌ Thất bại' : '⏳ Chờ thanh toán'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="text-xs">
                                            {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => onViewOrder(order)}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                            >
                                                Xem
                                            </button>
                                            {nextStatus && (
                                                <button
                                                    onClick={() => onUpdateStatus(order.id, nextStatus)}
                                                    disabled={isOrderUpdating}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50 text-sm font-medium"
                                                >
                                                    {isOrderUpdating ? 'Đang cập nhật...' : nextStatusText}
                                                </button>
                                            )}
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => onUpdateStatus(order.id, mappingOrderStatus['cancelled'])}
                                                    disabled={isOrderUpdating}
                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50 text-sm font-medium"
                                                >
                                                    Hủy
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {loading && (
                <div className="p-4 text-center">
                    <div className="inline-flex items-center text-sm text-gray-500">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tải thêm dữ liệu...
                    </div>
                </div>
            )}
        </div>
    );
}