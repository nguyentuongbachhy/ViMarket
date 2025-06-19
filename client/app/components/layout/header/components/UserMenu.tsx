import { AlertTriangle, Bell, Heart, LogOut, Package, Settings, ShoppingCart, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { UserInfo } from '~/api/types';
import { NotificationPopup } from '~/components/layout/notifications/NotificationPopup';
import { useNotificationContext } from '~/contexts/NotificationContext';
import { useAppDispatch } from '~/hooks/utils/reduxHooks';
import { cn } from '~/lib/utils';
import { logoutAsync } from '~/store/slices/authSlice';

interface UserMenuProps {
    isLogged: boolean;
    user?: UserInfo;
    cartItemCount?: number;
    wishlistItemCount?: number;
    cartError?: string | null;
    wishlistError?: string | null;
}

export const UserMenu: React.FC<UserMenuProps> = ({
    isLogged,
    user,
    cartItemCount = 0,
    wishlistItemCount = 0,
    cartError,
    wishlistError
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Use notification context only if logged in
    const notificationContext = isLogged ? useNotificationContext() : null;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await dispatch(logoutAsync()).unwrap();
            setDropdownOpen(false);
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const hasErrors = cartError || wishlistError;

    const iconButtonClass = "relative p-2 text-white hover:text-blue-400 transition-all duration-200 rounded-lg hover:bg-white/10 group flex items-center justify-center";
    const badgeClass = "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium transform group-hover:scale-110 transition-transform";
    const errorBadgeClass = "absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium";

    // ✅ SỬA: Nếu chưa đăng nhập, chỉ hiển thị nút đăng nhập
    if (!isLogged) {
        return (
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Desktop Login Button */}
                <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    <User className="w-4 h-4 mr-2" />
                    Đăng nhập
                </Link>

                {/* Mobile Login Button */}
                <Link to="/login" className="sm:hidden">
                    <div className={iconButtonClass}>
                        <User size={24} />
                    </div>
                </Link>

                {/* Register Button - Desktop only */}
                <Link
                    to="/register"
                    className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200"
                >
                    Đăng ký
                </Link>
            </div>
        );
    }

    // ✅ Khi đã đăng nhập, hiển thị đầy đủ các icon
    return (
        <div className="flex items-center gap-2 sm:gap-3">
            {/* Error Indicator - Chỉ hiện khi có lỗi */}
            {hasErrors && (
                <div className="relative">
                    <button
                        onClick={() => setShowErrors(!showErrors)}
                        className={cn(iconButtonClass, "text-yellow-400 hover:text-yellow-300")}
                        title="Có lỗi xảy ra"
                    >
                        <AlertTriangle size={20} />
                    </button>

                    {/* Error Dropdown */}
                    {showErrors && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 z-50">
                            <h4 className="text-red-800 font-medium text-sm mb-2">Có lỗi xảy ra:</h4>
                            {cartError && (
                                <p className="text-red-700 text-xs mb-1">Giỏ hàng: {cartError}</p>
                            )}
                            {wishlistError && (
                                <p className="text-red-700 text-xs">Wishlist: {wishlistError}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Notifications - Chỉ hiện khi đã đăng nhập */}
            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={() => {
                        setNotificationOpen(!notificationOpen);
                        setDropdownOpen(false);
                    }}
                    className={cn(iconButtonClass, notificationOpen && "text-blue-400")} 
                    title="Thông báo"
                >
                    <Bell size={24} />
                    {notificationContext && notificationContext.unreadCount > 0 && (
                        <span className={badgeClass}>
                            {notificationContext.unreadCount > 99 ? '99+' : notificationContext.unreadCount}
                        </span>
                    )}
                </button>

                {/* Notification Popup */}
                {notificationOpen && notificationContext && (
                    <NotificationPopup
                        notifications={notificationContext.notifications}
                        unreadCount={notificationContext.unreadCount}
                        loading={notificationContext.loading}
                        onMarkAsRead={notificationContext.markAsRead}
                        onMarkAllAsRead={notificationContext.markAllAsRead}
                        onDelete={notificationContext.deleteNotification}
                        onClose={() => setNotificationOpen(false)}
                    />
                )}
            </div>

            {/* Wishlist - Chỉ hiện khi đã đăng nhập */}
            <div className="relative">
                <Link to="/wishlist">
                    <div className={iconButtonClass} title="Danh sách yêu thích">
                        <Heart size={24} />
                        {wishlistItemCount > 0 && (
                            <span className={badgeClass}>
                                {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                            </span>
                        )}
                        {wishlistError && (
                            <span className={errorBadgeClass}>
                                <AlertTriangle size={12} />
                            </span>
                        )}
                    </div>
                </Link>
            </div>

            {/* Cart - Chỉ hiện khi đã đăng nhập */}
            <div className="relative">
                <Link to="/cart">
                    <div className={iconButtonClass} title="Giỏ hàng">
                        <ShoppingCart size={24} />
                        {cartItemCount > 0 && (
                            <span className={badgeClass}>
                                {cartItemCount > 99 ? '99+' : cartItemCount}
                            </span>
                        )}
                        {cartError && (
                            <span className={errorBadgeClass}>
                                <AlertTriangle size={12} />
                            </span>
                        )}
                    </div>
                </Link>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                        setNotificationOpen(false);
                    }}
                    className="flex items-center space-x-3 p-2 text-white hover:text-blue-400 transition-all duration-200 rounded-lg hover:bg-white/10 group"
                >
                    {/* User Avatar */}
                    <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-gray-600 group-hover:border-blue-400 transition-colors">
                            <span className="text-white text-sm font-semibold">
                                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                    </div>

                    {/* User Info - Hidden on mobile */}
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-medium truncate max-w-[120px]">
                            {user?.fullName || user?.username}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">
                            {user?.email}
                        </p>
                    </div>

                    {/* Dropdown Arrow */}
                    <svg
                        className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            dropdownOpen && "rotate-180"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-fade-in">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                        {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 text-sm font-medium truncate">
                                        {user?.fullName || user?.username}
                                    </p>
                                    <p className="text-gray-500 text-xs truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cart Summary */}
                        {cartItemCount > 0 && (
                            <div className="px-4 py-2 bg-blue-50 border-b border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-blue-700">Giỏ hàng</span>
                                    <span className="text-blue-600 font-medium">{cartItemCount} sản phẩm</span>
                                </div>
                            </div>
                        )}

                        {/* Menu Items */}
                        <div className="py-2">
                            <Link
                                to="/profile"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <User className="w-4 h-4 mr-3 text-gray-500" />
                                Thông tin cá nhân
                            </Link>

                            <Link
                                to="/orders"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Package className="w-4 h-4 mr-3 text-gray-500" />
                                Đơn hàng của tôi
                            </Link>

                            <Link
                                to="/notifications"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Bell className="w-4 h-4 mr-3 text-gray-500" />
                                Thông báo
                                {notificationContext && notificationContext.unreadCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                        {notificationContext.unreadCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                to="/settings"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Settings className="w-4 h-4 mr-3 text-gray-500" />
                                Cài đặt
                            </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-2">
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};