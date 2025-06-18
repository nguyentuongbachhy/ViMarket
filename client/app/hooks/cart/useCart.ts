// useCart.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiUtils, type AddToCartRequest, type Cart } from '~/api';
import { cartService } from '~/api/services/cartService';
import { useHydrated } from '~/hooks/utils/useHydrated';
import type { UseCartItemCountReturn, UseCartReturn } from './useCart.types';

export const useCart = (): UseCartReturn => {
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const totalItems = cart?.totalItems || 0;
    const totalPrice = cart?.totalPrice || 0;
    const isEmpty = !cart || cart.items.length === 0;
    const count = cart?.totalItems || 0;

    const fetchCart = useCallback(async () => {
        if (!hydrated || loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const cartData = await cartService.getCart();
            setCart(cartData);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch cart:', errorMessage);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hydrated]);

    const addToCart = useCallback(async (request: AddToCartRequest) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const updatedCart = await cartService.addToCart(request);
            setCart(updatedCart);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const updateCartItem = useCallback(async (productId: string, quantity: number) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const updatedCart = await cartService.updateCartItem(productId, { quantity });
            setCart(updatedCart);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const removeFromCart = useCallback(async (productId: string) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const updatedCart = await cartService.removeFromCart(productId);
            setCart(updatedCart);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const clearCart = useCallback(async () => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            await cartService.clearCart();
            setCart(null);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        await fetchCart();
    }, [fetchCart]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const isProductInCart = useCallback((productId: string): boolean => {
        return cart?.items.some(item => item.productId === productId) || false;
    }, [cart]);

    const getProductQuantity = useCallback((productId: string): number => {
        const item = cart?.items.find(item => item.productId === productId);
        return item?.quantity || 0;
    }, [cart]);

    const canAddToCart = useCallback((productId: string, quantity: number): boolean => {
        const currentQuantity = getProductQuantity(productId);
        const newQuantity = currentQuantity + quantity;
        return newQuantity <= 10;
    }, [getProductQuantity]);

    // Fix: Đổi điều kiện từ !hydrated thành hydrated
    useEffect(() => {
        if (hydrated && !isInitialized.current) {
            isInitialized.current = true;
            fetchCart();
        }
    }, [hydrated, fetchCart]);

    return {
        cart,
        loading,
        error,
        totalItems,
        totalPrice,
        isEmpty,
        count,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refresh,
        clearError,
        isProductInCart,
        getProductQuantity,
        canAddToCart,
    };
};

// Cập nhật useCartItemCount hook
export const useCartItemCount = (): UseCartItemCountReturn => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();
    const isInitialized = useRef(false);
    const loadingRef = useRef(false);

    const fetchCount = useCallback(async () => {
        if (!hydrated || loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const itemCount = await cartService.getCartItemCount();
            setCount(itemCount);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            setCount(0);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [hydrated]);

    const refresh = useCallback(async () => {
        if (loadingRef.current) return;
        await fetchCount();
    }, [fetchCount]);

    // Fix: Đổi điều kiện từ !hydrated thành hydrated
    useEffect(() => {
        if (hydrated && !isInitialized.current) {
            isInitialized.current = true;
            fetchCount();
        }
    }, [hydrated, fetchCount]);

    return {
        count,
        loading,
        error,
        refresh,
    };
};

export const useQuickAddToCart = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadingRef = useRef(false);

    const quickAdd = useCallback(async (productId: string, quantity: number = 1) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            await cartService.addToCart({ productId, quantity });
            return true;
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        quickAdd,
        loading,
        error,
        clearError,
    };
};