export type {
    CheckoutRequest,
    CreateOrderFromCartRequest,
    CreateOrderRequest,
    GetOrdersParams, Order
} from '~/api';

import type {
    CheckoutRequest,
    CreateOrderFromCartRequest,
    CreateOrderRequest,
    GetOrdersParams, Order
} from '~/api';

export interface UseCheckoutReturn {
    checkout: (request: CheckoutRequest) => Promise<any>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

export interface UseCreateOrderReturn {
    createOrder: (request: CreateOrderRequest) => Promise<any>;
    createOrderFromCart: (request: CreateOrderFromCartRequest) => Promise<any>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

export interface UseCancelOrderReturn {
    cancelOrder: (orderId: string) => Promise<any>;
    loading: boolean;
    error: string | null;
    clearError: () => void;
}

export interface UseOrderReturn {
    order: Order | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    clearError: () => void;
}

export interface UseOrdersReturn {
    orders: Order[];
    loading: boolean;
    error: string | null;
    refetch: (params?: GetOrdersParams) => Promise<void>;
    clearError: () => void;
}