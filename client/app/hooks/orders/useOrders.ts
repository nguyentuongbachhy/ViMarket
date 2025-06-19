// ~/hooks/orders/useOrderActions.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiUtils } from '~/api';
import type {
    CheckoutRequest,
    CreateOrderFromCartRequest,
    CreateOrderRequest,
    GetOrdersParams,
    Order,
    UseCancelOrderReturn,
    UseCheckoutReturn,
    UseCreateOrderReturn,
    UseOrderReturn,
    UseOrdersReturn
} from './useOrders.types';

// Main checkout hook
export const useCheckout = (): UseCheckoutReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const checkout = useCallback(async (request: CheckoutRequest) => {
        if (loadingRef.current) throw new Error('Checkout already in progress');

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const order = await api.orders.checkout(request);
            return order;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        checkout,
        loading,
        error,
        clearError,
    };
};

// Create order hooks
export const useCreateOrder = (): UseCreateOrderReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const createOrder = useCallback(async (request: CreateOrderRequest) => {
        if (loadingRef.current) throw new Error('Order creation already in progress');

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const order = await api.orders.createOrder(request);
            return order;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const createOrderFromCart = useCallback(async (request: CreateOrderFromCartRequest) => {
        if (loadingRef.current) throw new Error('Order creation already in progress');

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const order = await api.orders.createOrderFromCart(request);
            return order;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        createOrder,
        createOrderFromCart,
        loading,
        error,
        clearError,
    };
};

// Cancel order hook
export const useCancelOrder = (): UseCancelOrderReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const cancelOrder = useCallback(async (orderId: string) => {
        if (loadingRef.current) throw new Error('Order cancellation already in progress');

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const order = await api.orders.cancelOrder(orderId);
            return order;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        cancelOrder,
        loading,
        error,
        clearError,
    };
};

// ✅ Hook để lấy order theo ID
export const useOrder = (orderId: string | null): UseOrderReturn => {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const fetchOrder = useCallback(async () => {
        if (!orderId || loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const fetchedOrder = await api.orders.getOrderById(orderId);
            setOrder(fetchedOrder);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setOrder(null);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [orderId]);

    const refetch = useCallback(async () => {
        await fetchOrder();
    }, [fetchOrder]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Auto fetch khi orderId thay đổi
    useEffect(() => {
        if (orderId) {
            fetchOrder();
        } else {
            setOrder(null);
            setError(null);
        }
    }, [orderId, fetchOrder]);

    return {
        order,
        loading,
        error,
        refetch,
        clearError,
    };
};

// ✅ Hook để lấy danh sách orders của user
export const useOrders = (initialParams?: GetOrdersParams): UseOrdersReturn => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);
    const paramsRef = useRef(initialParams);

    const fetchOrders = useCallback(async (params?: GetOrdersParams) => {
        if (loadingRef.current) return;

        // Update params ref
        if (params !== undefined) {
            paramsRef.current = params;
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const fetchedOrders = await api.orders.getUserOrders(paramsRef.current);
            setOrders(fetchedOrders);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setOrders([]);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const refetch = useCallback(async (params?: GetOrdersParams) => {
        await fetchOrders(params);
    }, [fetchOrders]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Auto fetch khi component mount
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return {
        orders,
        loading,
        error,
        refetch,
        clearError,
    };
};

export const useCheckPurchase = (productId: string | null): {
    hasPurchased: boolean | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
} => {
    const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkPurchase = useCallback(async () => {
        if (!productId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await api.orders.checkUserPurchase(productId);
            setHasPurchased(result.hasPurchased);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setHasPurchased(false);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const refetch = useCallback(async () => {
        await checkPurchase();
    }, [checkPurchase]);

    useEffect(() => {
        if (productId) {
            checkPurchase();
        } else {
            setHasPurchased(null);
            setError(null);
        }
    }, [productId, checkPurchase]);

    return {
        hasPurchased,
        loading,
        error,
        refetch,
    };
};