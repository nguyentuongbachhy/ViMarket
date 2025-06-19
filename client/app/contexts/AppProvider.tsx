import React from 'react';
import { Provider } from 'react-redux';
import { store } from '~/store';
import { CartProvider } from './CartContext';
import { ChatbotProvider } from './ChatbotContext';
import { WishlistProvider } from './WishlistContext';
import {NotificationProvider } from './NotificationContext';

interface AppProviderProps {
    children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    return (
        <Provider store={store}>
            <ChatbotProvider>
                <NotificationProvider>
                    <CartProvider>
                        <WishlistProvider>
                            {children}
                        </WishlistProvider>
                    </CartProvider>
                </NotificationProvider>
            </ChatbotProvider>
        </Provider>
    );
};

export { useCartContext } from './CartContext';
export { useWishlistContext } from './WishlistContext';

