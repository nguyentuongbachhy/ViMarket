// useCart.types.ts
import type { AddToCartRequest, Cart } from '~/api/types';

export interface UseCartReturn {
    cart: Cart | null;
    loading: boolean;
    error: string | null;
    totalItems: number;
    totalPrice: number;
    isEmpty: boolean;
    count: number;

    addToCart: (request: AddToCartRequest) => Promise<void>;
    updateCartItem: (productId: string, quantity: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refresh: () => Promise<void>;
    clearError: () => void;

    isProductInCart: (productId: string) => boolean;
    getProductQuantity: (productId: string) => number;
    canAddToCart: (productId: string, quantity: number) => boolean;
}

export interface UseCartItemCountReturn {
    count: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}