import React, { useCallback, useMemo, useState } from 'react';
import { useCartContext, useWishlistContext } from '~/contexts';
import { useAuth } from '~/hooks/utils/reduxHooks';
import { cn } from '~/lib/utils';
import type { HeaderProps } from './Header.types';
import { Logo } from './components/Logo';
import { Navigation } from './components/Navigation';
import { QuickCheckout } from './components/QuickCheckout';
import { SearchBar } from './components/SearchBar';
import { UserMenu } from './components/UserMenu';

const defaultNavItems = [
    { name: "Trang chủ", path: "/" },
    { name: "Sản phẩm", path: "/products" },
    { name: "Liên hệ", path: "/contact" }
];

export const Header: React.FC<HeaderProps> = ({
    navItems = defaultNavItems,
    onSearch,
    className,
    sticky = true,
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();

    const {
        count: cartItemCount,
        loading: cartLoading,
        error: cartError,
        cart
    } = useCartContext();

    const {
        count: wishlistItemCount,
        loading: wishlistLoading,
        error: wishlistError
    } = useWishlistContext();

    // Memoize computed values
    const cartTotal = useMemo(() => {
        return cart?.pricing?.total || 0;
    }, [cart?.pricing?.total]);

    const hasCartItems = useMemo(() => {
        return cartItemCount > 0;
    }, [cartItemCount]);

    const canCheckout = useMemo(() => {
        return hasCartItems && !cartLoading;
    }, [hasCartItems, cartLoading]);

    // Memoize callbacks
    const toggleMobileMenu = useCallback(() => {
        setMobileMenuOpen(prev => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setMobileMenuOpen(false);
    }, []);

    const handleSearch = useCallback((query: string) => {
        onSearch?.(query);
        closeMobileMenu();
    }, [onSearch, closeMobileMenu]);

    return (
        <>
            <header className={cn(
                "w-full bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-800 shadow-lg z-40",
                sticky && "sticky top-0",
                className
            )}>
                {/* Main Header */}
                <div className="h-16 flex justify-between items-center px-4 md:px-8 lg:px-12 xl:px-16 mx-auto max-w-[1920px]">
                    {/* Left Side - Mobile Menu + Logo */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 text-white hover:text-blue-400 transition-colors rounded-lg hover:bg-white/10"
                            aria-label="Toggle mobile menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                />
                            </svg>
                        </button>

                        {/* Logo */}
                        <Logo className="flex-shrink-0" />
                    </div>

                    {/* Center - Desktop Navigation */}
                    <div className="hidden lg:flex items-center flex-1 max-w-4xl mx-8">
                        <Navigation
                            navItems={navItems}
                            isLogged={isAuthenticated}
                        />
                    </div>

                    {/* Right Side - Search, Quick Checkout, User Menu */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Search Component */}
                        <SearchBar onSearch={handleSearch} />

                        {/* Quick Checkout - Show when has items */}
                        {canCheckout && (
                            <QuickCheckout
                                itemCount={cartItemCount}
                                total={cartTotal}
                                loading={cartLoading}
                            />
                        )}

                        {/* User Menu */}
                        <UserMenu
                            isLogged={isAuthenticated}
                            user={user}
                            cartItemCount={cartItemCount}
                            wishlistItemCount={wishlistItemCount}
                            cartError={cartError}
                            wishlistError={wishlistError}
                        />
                    </div>
                </div>

                {/* Loading Bar */}
                {(cartLoading || wishlistLoading) && (
                    <div className="h-1 bg-gray-800">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse"></div>
                    </div>
                )}
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeMobileMenu}
                    />

                    {/* Mobile Menu Panel */}
                    <div className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out">
                        {/* Mobile Menu Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                            <Logo />
                            <button
                                onClick={closeMobileMenu}
                                className="p-2 text-white hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
                                aria-label="Close mobile menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile Navigation */}
                        <div className="flex flex-col p-4 space-y-4 flex-1 overflow-y-auto">
                            <Navigation
                                navItems={navItems}
                                isLogged={isAuthenticated}
                                isMobile={true}
                                onItemClick={closeMobileMenu}
                            />

                            {/* Mobile Quick Actions */}
                            {hasCartItems && (
                                <div className="pt-4 mt-4 border-t border-gray-700">
                                    <QuickCheckout
                                        itemCount={cartItemCount}
                                        total={cartTotal}
                                        loading={cartLoading}
                                        isMobile={true}
                                        onCheckout={closeMobileMenu}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Mobile User Info */}
                        {isAuthenticated && user && (
                            <div className="p-4 border-t border-gray-700 bg-gray-800">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {user.fullName || user.username}
                                        </p>
                                        <p className="text-gray-400 text-xs truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;