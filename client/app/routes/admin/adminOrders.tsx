// app/routes/admin/orders.tsx
import { useCallback, useMemo, useState } from 'react';
import api from '~/api';
import type { Order, OrderStatus } from '~/api/types';
import { AdminOrderModal } from '~/components/admin/AdminOrderModal';
import { AdminOrdersFilters } from '~/components/admin/AdminOrdersFilters';
import { AdminOrdersStats } from '~/components/admin/AdminOrdersStats';
import { AdminOrdersTable } from '~/components/admin/AdminOrdersTable';
import { ErrorAlert } from '~/components/ui/alert/ErrorAlert';
import { LoadingSpinner } from '~/components/ui/loading/LoadingSpinner';
import { Pagination } from '~/components/ui/pagination/Pagination';
import { useAdminOrders } from '~/hooks/admin/useAdminOrders';

import type { Route } from "./+types/adminOrders";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Admin Orders | ViMarket" },
        { name: "description", content: "Trang quản lý đơn hàng chung" },
    ];
}
export interface OrderFilters {
    page: number;
    limit: number;
    status: OrderStatus | '';
    search: string;
    dateFrom: string;
    dateTo: string;
    sortBy: 'createdAt' | 'totalAmount' | 'status';
    sortOrder: 'asc' | 'desc';
}

export default function AdminOrders() {
    const [filters, setFilters] = useState<OrderFilters>({
        page: 1,
        limit: 20,
        status: '',
        search: '',
        dateFrom: '',
        dateTo: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const {
        orders,
        total,
        totalPages,
        currentPage,
        loading,
        error,
        refetch,
        updateOrderStatus,
        isUpdating,
        stats
    } = useAdminOrders(filters);

    // Memoized filtered and sorted orders
    const processedOrders = useMemo(() => {
        if (!orders) return [];

        let filtered = [...orders];

        // Client-side search (for additional filtering)
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(order =>
                order.id.toLowerCase().includes(searchLower) ||
                order.userId.toLowerCase().includes(searchLower) ||
                order.items.some(item =>
                    item.productName.toLowerCase().includes(searchLower)
                )
            );
        }

        return filtered;
    }, [orders, filters.search]);

    const handleFilterChange = useCallback((newFilters: Partial<OrderFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleViewOrder = useCallback((order: Order) => {
        setSelectedOrder(order);
        setShowModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setSelectedOrder(null);
    }, []);

    const handleUpdateStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
        try {
            setActionInProgress(orderId);
            await updateOrderStatus(orderId, newStatus);

            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            notification.textContent = 'Cập nhật trạng thái thành công!';
            document.body.appendChild(notification);

            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);

        } catch (error: any) {
            // Show error notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            notification.textContent = `Lỗi: ${error.message}`;
            document.body.appendChild(notification);

            setTimeout(() => {
                document.body.removeChild(notification);
            }, 5000);
        } finally {
            setActionInProgress(null);
        }
    }, [updateOrderStatus]);

    const handleBulkAction = useCallback(async (orderIds: string[], action: string) => {
        // Implementation for bulk actions
        console.log('Bulk action:', action, 'for orders:', orderIds);
    }, []);

    const handleExport = useCallback(async (format: 'excel' | 'pdf') => {
        try {
            const blob = await api.orders.exportOrders({
                status: filters.status || undefined,
                dateFrom: filters.dateFrom || undefined,
                dateTo: filters.dateTo || undefined,
                format
            });

            // Download file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `orders_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            notification.textContent = `Xuất file ${format.toUpperCase()} thành công!`;
            document.body.appendChild(notification);

            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);

        } catch (error: any) {
            console.error('Export failed:', error);

            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            notification.textContent = `Lỗi xuất file: ${error.message}`;
            document.body.appendChild(notification);

            setTimeout(() => {
                document.body.removeChild(notification);
            }, 5000);
        }
    }, [filters]);

    if (loading && !orders) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Quản lý và theo dõi tất cả đơn hàng trong hệ thống
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && <AdminOrdersStats stats={stats} />}

            {/* Error Alert */}
            {error && (
                <ErrorAlert
                    message={error}
                    onRetry={refetch}
                    onDismiss={() => { }}
                />
            )}

            {/* Filters */}
            <AdminOrdersFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                loading={loading}
            />

            {/* Orders Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <AdminOrdersTable
                    orders={processedOrders}
                    loading={loading}
                    isUpdating={isUpdating}
                    actionInProgress={actionInProgress}
                    onViewOrder={handleViewOrder}
                    onUpdateStatus={handleUpdateStatus}
                    onBulkAction={handleBulkAction}
                    sortBy={filters.sortBy}
                    sortOrder={filters.sortOrder}
                    onSort={(sortBy, sortOrder) => {
                        const validSortBy = sortBy as 'createdAt' | 'totalAmount' | 'status';
                        handleFilterChange({ sortBy: validSortBy, sortOrder });
                    }}
                    onExport={handleExport}
                />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    total={total}
                    limit={filters.limit}
                    onPageChange={handlePageChange}
                    onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
                />
            )}

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <AdminOrderModal
                    order={selectedOrder}
                    onClose={handleCloseModal}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={isUpdating === selectedOrder.id}
                />
            )}
        </div>
    );
}