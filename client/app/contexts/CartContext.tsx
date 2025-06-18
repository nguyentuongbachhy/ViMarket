import React, { createContext, useContext } from 'react';
import { useCart } from '~/hooks/cart';
import type { UseCartReturn } from '~/hooks/cart/useCart.types';

interface CartContextType extends UseCartReturn { }

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const cartData = useCart();

    return (
        <CartContext.Provider value={cartData}>
            {children}
        </CartContext.Provider>
    );
};

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCartContext must be used within CartProvider');
    }
    return context;
};

export { useCart };
