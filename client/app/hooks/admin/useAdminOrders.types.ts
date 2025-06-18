export type { Order, OrderStatus } from '~/api/types';

import type { Order, OrderStatus } from '~/api/types';

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