import React, { createContext, useContext } from 'react';
import { useWishlist } from '~/hooks/wishlist';
import type { UseWishlistReturn } from '~/hooks/wishlist/useWishlist.types';

interface WishlistContextType extends UseWishlistReturn { }

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const wishlistData = useWishlist();

    return (
        <WishlistContext.Provider value={wishlistData}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlistContext = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlistContext must be used within WishlistProvider');
    }
    return context;
};

export { useWishlist };
