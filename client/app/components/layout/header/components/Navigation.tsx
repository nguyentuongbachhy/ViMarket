import React from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '~/lib/utils';
import type { NavItem } from '../Header.types';

interface NavigationProps {
    navItems: NavItem[];
    isLogged: boolean;
    isMobile?: boolean;
    onItemClick?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
    navItems,
    isLogged,
    isMobile = false,
    onItemClick
}) => {
    const location = useLocation();

    const isActive = (path: string): boolean => {
        if (path === "/" && location.pathname === "/") {
            return true;
        }
        return path !== "/" && location.pathname.includes(path);
    };

    const handleItemClick = () => {
        if (onItemClick) {
            onItemClick();
        }
    };

    // ✅ SỬA: Chỉ hiển thị nav items cơ bản, không thêm notifications vào đây
    // Notifications sẽ được handle trong UserMenu
    const displayNavItems = navItems;

    if (isMobile) {
        return (
            <div className="flex flex-col space-y-1">
                {displayNavItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={handleItemClick}
                        className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive(item.path)
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-gray-300 hover:text-white hover:bg-gray-800"
                        )}
                    >
                        <span>{item.name}</span>
                        {item.badge && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}

                {/* ✅ SỬA: Chỉ hiển thị đăng ký/đăng nhập khi chưa đăng nhập */}
                {!isLogged && (
                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <Link
                            to="/register"
                            onClick={handleItemClick}
                            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-green-400 hover:text-white hover:bg-green-600 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Đăng ký
                        </Link>
                        <Link
                            to="/login"
                            onClick={handleItemClick}
                            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:text-white hover:bg-blue-600 transition-all duration-200 mt-1"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Đăng nhập
                        </Link>
                    </div>
                )}

                {/* ✅ THÊM: Mobile shortcuts cho user đã đăng nhập */}
                {isLogged && (
                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <div className="text-xs text-gray-500 uppercase tracking-wide px-3 mb-2">
                            Tài khoản
                        </div>
                        <Link
                            to="/notifications"
                            onClick={handleItemClick}
                            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z" />
                            </svg>
                            Thông báo
                        </Link>
                        <Link
                            to="/wishlist"
                            onClick={handleItemClick}
                            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Yêu thích
                        </Link>
                        <Link
                            to="/cart"
                            onClick={handleItemClick}
                            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.293.293-.293.767 0 1.06M7 13l-2.293 2.293c-.293.293-.293.767 0 1.06M7 13v6a2 2 0 002 2h8a2 2 0 002-2v-6" />
                            </svg>
                            Giỏ hàng
                        </Link>
                    </div>
                )}
            </div>
        );
    }

    return (
        <nav className="flex items-center">
            <ul className="flex items-center space-x-8 font-medium">
                {displayNavItems.map((item) => (
                    <li key={item.name} className="relative group">
                        <Link to={item.path} className="relative">
                            <span className={cn(
                                "text-lg transition-all duration-200 relative z-10",
                                isActive(item.path)
                                    ? "text-white"
                                    : "text-gray-300 hover:text-white"
                            )}>
                                {item.name}
                                {item.badge && (
                                    <span className="absolute -top-2 -right-6 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {item.badge}
                                    </span>
                                )}
                            </span>

                            {/* Active indicator */}
                            {isActive(item.path) && (
                                <div className="absolute -bottom-6 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
                            )}

                            {/* Hover effect */}
                            <div className="absolute -bottom-6 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 group-hover:w-full" />
                        </Link>
                    </li>
                ))}

                {/* ✅ SỬA: Chỉ hiển thị đăng ký khi chưa đăng nhập */}
                {!isLogged && (
                    <li className="ml-6">
                        <Link
                            to="/register"
                            className="group relative inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <svg className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Đăng ký

                            {/* Shine effect */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:animate-ping"></div>
                        </Link>
                    </li>
                )}
            </ul>
        </nav>
    );
};