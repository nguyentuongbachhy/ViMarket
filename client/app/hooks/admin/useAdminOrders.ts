// app/hooks/admin/useAdminOrders.ts
import { useCallback, useEffect, useState } from 'react';
import { api } from '~/api';
import type { Order, OrderStatus } from '~/api/types';

export interface OrderFilters {
    page: number;
    limit: number;
    status: OrderStatus | '';
    search: string;
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface OrderStats {
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
}

export interface UseAdminOrdersReturn {
    orders: Order[] | null;
    total: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
    error: string | null;
    stats: OrderStats | null;
    refetch: () => Promise<void>;
    updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
    isUpdating: string | null;
}

export const useAdminOrders = (filters: OrderFilters): UseAdminOrdersReturn => {
    const [data, setData] = useState<{
        orders: Order[];
        total: number;
        totalPages: number;
        currentPage: number;
    } | null>(null);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page: filters.page,
                limit: filters.limit,
            };

            if (filters.status) params.status = filters.status;

            // Fetch orders and stats in parallel
            const [ordersResponse, statsResponse] = await Promise.all([
                api.orders.getAllOrders(params),
                api.orders.getOrderStats().catch(() => null)
            ]);

            setData(ordersResponse);
            setStats(statsResponse);
        } catch (err: any) {
            setError(err.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
        setIsUpdating(orderId);
        try {
            await api.orders.updateOrderStatus(orderId, newStatus);
            await fetchOrders(); // Refresh data
        } catch (error: any) {
            throw error;
        } finally {
            setIsUpdating(null);
        }
    }, [fetchOrders]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders: data?.orders || null,
        total: data?.total || 0,
        totalPages: data?.totalPages || 0,
        currentPage: data?.currentPage || 1,
        loading,
        error,
        stats,
        refetch: fetchOrders,
        updateOrderStatus,
        isUpdating,
    };
};