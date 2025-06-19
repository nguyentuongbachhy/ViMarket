import { Bell, Check, CheckCheck, Clock, Package, ShoppingCart, Trash2, X } from 'lucide-react';
import React, { useMemo } from 'react';
import { Link } from 'react-router';
import type { NotificationEvent, NotificationEventType } from '~/api/types';
import { cn } from '~/lib/utils';

interface NotificationPopupProps {
    notifications: NotificationEvent[];
    unreadCount: number;
    loading: boolean;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

const getNotificationIcon = (type: NotificationEventType) => {
    switch (type) {
        case 'cart.item.added':
        case 'cart.item.low.stock':
        case 'cart.abandoned':
            return ShoppingCart;
        case 'wishlist.product.price.changed':
        case 'wishlist.product.restocked':
            return Package;
        default:
            return Bell;
    }
};

const getNotificationColor = (type: NotificationEventType, priority: string) => {
    if (priority === 'urgent') return 'text-red-500 bg-red-50';
    if (priority === 'high') return 'text-orange-500 bg-orange-50';
    
    switch (type) {
        case 'cart.item.added':
            return 'text-green-500 bg-green-50';
        case 'cart.item.low.stock':
            return 'text-yellow-500 bg-yellow-50';
        case 'cart.abandoned':
            return 'text-blue-500 bg-blue-50';
        case 'wishlist.product.price.changed':
            return 'text-purple-500 bg-purple-50';
        case 'wishlist.product.restocked':
            return 'text-emerald-500 bg-emerald-50';
        default:
            return 'text-gray-500 bg-gray-50';
    }
};

const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return new Date(date).toLocaleDateString('vi-VN');
};

const NotificationItem: React.FC<{
    notification: NotificationEvent;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
    const Icon = getNotificationIcon(notification.type as NotificationEventType);
    const colorClasses = getNotificationColor(
        notification.type as NotificationEventType, 
        notification.priority
    );

    const getActionLink = () => {
        const productId = notification.metadata.productId;
        const cartId = notification.metadata.cartId;
        const orderId = notification.metadata.orderId;

        switch (notification.type) {
            case 'cart.item.added':
            case 'cart.item.low.stock':
            case 'cart.abandoned':
                return '/cart';
            case 'wishlist.product.price.changed':
            case 'wishlist.product.restocked':
                return productId ? `/product/${productId}` : '/wishlist';
            default:
                return null;
        }
    };

    const actionLink = getActionLink();

    const content = (
        <div
            className={cn(
                "flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors border-l-4 border-transparent",
                !notification.isRead && "bg-blue-50 border-l-blue-500"
            )}
        >
            {/* Icon */}
            <div className={cn("flex-shrink-0 p-2 rounded-full", colorClasses)}>
                <Icon size={16} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className={cn(
                            "text-sm font-medium text-gray-900 truncate",
                            !notification.isRead && "font-semibold"
                        )}>
                            {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Clock size={12} className="mr-1" />
                            {formatTime(notification.createdAt)}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-2">
                        {!notification.isRead && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onMarkAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                title="Đánh dấu đã đọc"
                            >
                                <Check size={14} />
                            </button>
                        )}
                        
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Xóa thông báo"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (actionLink) {
        return (
            <Link to={actionLink} className="block">
                {content}
            </Link>
        );
    }

    return <div>{content}</div>;
};

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
    notifications,
    unreadCount,
    loading,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClose
}) => {
    const sortedNotifications = useMemo(() => {
        return [...notifications].sort((a, b) => {
            // Unread first, then by date
            if (a.isRead !== b.isRead) {
                return a.isRead ? 1 : -1;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [notifications]);

    return (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center space-x-2">
                    <Bell size={20} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Thông báo</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center"
                            title="Đánh dấu tất cả đã đọc"
                        >
                            <CheckCheck size={16} className="mr-1" />
                            Đọc tất cả
                        </button>
                    )}
                    
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Đóng"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="inline-flex items-center space-x-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-sm">Đang tải...</span>
                        </div>
                    </div>
                ) : sortedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Bell size={48} className="text-gray-300 mb-4" />
                        <h4 className="text-lg font-medium text-gray-400 mb-2">Không có thông báo</h4>
                        <p className="text-sm text-center text-gray-400">
                            Các thông báo mới sẽ xuất hiện ở đây
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {sortedNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={onMarkAsRead}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {sortedNotifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <Link
                        to="/notifications"
                        className="block text-center text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                        onClick={onClose}
                    >
                        Xem tất cả thông báo
                    </Link>
                </div>
            )}
        </div>
    );
};