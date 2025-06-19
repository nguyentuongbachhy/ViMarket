import { Bell, Check, CheckCheck, Clock, Filter, RotateCcw, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { NotificationEvent, NotificationEventType } from '~/api/types';
import { LoadingSpinner } from '~/components/ui/loading/LoadingSpinner';
import { useNotificationContext } from '~/contexts/NotificationContext';
import { NotificationPermissionBanner } from '~/components/layout/notifications/NotificationPermissionBanner';
import { useAuth } from '~/hooks/utils/reduxHooks';
import { cn } from '~/lib/utils';

// Filter and sort options
type FilterType = 'all' | 'unread' | 'read';
type SortType = 'newest' | 'oldest' | 'priority';

const FILTER_OPTIONS: { value: FilterType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'all', label: 'Tất cả', icon: Bell },
    { value: 'unread', label: 'Chưa đọc', icon: Clock },
    { value: 'read', label: 'Đã đọc', icon: Check },
];

const SORT_OPTIONS: { value: SortType; label: string }[] = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'priority', label: 'Ưu tiên' },
];

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const {
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        sendTestNotification,
        notificationSupported,
        permissionStatus,
        permissionError,
        isRequestingPermission,
        canRequestPermission,
        wasPermissionDenied,
        requestPermission
    } = useNotificationContext();

    // Local state
    const [filter, setFilter] = useState<FilterType>('all');
    const [sort, setSort] = useState<SortType>('newest');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Filter and sort notifications
    const filteredAndSortedNotifications = useMemo(() => {
        let filtered = [...notifications];

        // Apply filter
        switch (filter) {
            case 'unread':
                filtered = filtered.filter(n => !n.isRead);
                break;
            case 'read':
                filtered = filtered.filter(n => n.isRead);
                break;
            default:
                break;
        }

        // Apply sort
        filtered.sort((a, b) => {
            switch (sort) {
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
                    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
                    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
                    return bPriority - aPriority;
                case 'newest':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

        return filtered;
    }, [notifications, filter, sort]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshNotifications();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        if (unreadCount > 0) {
            await markAllAsRead();
        }
    };

    // Handle test notification (development only)
    const handleTestNotification = async () => {
        if (process.env.NODE_ENV === 'development') {
            await sendTestNotification();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                                <Bell className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Thông báo</h1>
                                <p className="text-slate-400 mt-1">
                                    {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-3">
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={handleTestNotification}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Test Notification
                                </button>
                            )}
                            
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                title="Làm mới"
                            >
                                <RotateCcw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                            </button>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    <span>Đọc tất cả</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filters and Sort */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 bg-slate-800 rounded-xl p-4">
                        {/* Filters */}
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400 mr-2">Lọc:</span>
                            <div className="flex space-x-1">
                                {FILTER_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => setFilter(option.value)}
                                            className={cn(
                                                "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                                filter === option.value
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                            )}
                                        >
                                            <Icon className="w-3 h-3" />
                                            <span>{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-400">Sắp xếp:</span>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortType)}
                                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <NotificationPermissionBanner
                    notificationSupported={notificationSupported}
                    permissionStatus={permissionStatus}
                    permissionError={permissionError}
                    isRequestingPermission={isRequestingPermission}
                    canRequestPermission={canRequestPermission}
                    wasPermissionDenied={wasPermissionDenied}
                    onRequestPermission={requestPermission}
                />

                {/* Content */}
                {loading ? (
                    <NotificationsSkeleton />
                ) : error ? (
                    <ErrorState error={error} onRetry={handleRefresh} />
                ) : filteredAndSortedNotifications.length === 0 ? (
                    <EmptyState filter={filter} />
                ) : (
                    <NotificationsList
                        notifications={filteredAndSortedNotifications}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                    />
                )}
            </div>
        </div>
    );
}

// Notifications List Component
interface NotificationsListProps {
    notifications: NotificationEvent[];
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
    notifications,
    onMarkAsRead,
    onDelete
}) => (
    <div className="space-y-4">
        {notifications.map((notification) => (
            <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
            />
        ))}
    </div>
);

// Notification Item Component
interface NotificationItemProps {
    notification: NotificationEvent;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onDelete
}) => {
    const getNotificationIcon = (type: NotificationEventType) => {
        switch (type) {
            case 'cart.item.added':
            case 'cart.item.low.stock':
            case 'cart.abandoned':
                return '🛒';
            case 'wishlist.product.price.changed':
                return '💰';
            case 'wishlist.product.restocked':
                return '📦';
            default:
                return '🔔';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'border-red-500 bg-red-50 dark:bg-red-900/20';
            case 'high':
                return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case 'normal':
                return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
            default:
                return 'border-slate-500 bg-slate-50 dark:bg-slate-800';
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

    return (
        <div className={cn(
            "bg-slate-800 rounded-xl border-l-4 p-6 transition-all hover:bg-slate-750",
            getPriorityColor(notification.priority),
            !notification.isRead && "shadow-lg ring-1 ring-blue-500/20"
        )}>
            <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type as NotificationEventType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className={cn(
                            "text-lg font-semibold text-white",
                            !notification.isRead && "text-blue-100"
                        )}>
                            {notification.title}
                        </h3>
                        
                        <div className="flex items-center space-x-2 ml-4">
                            {!notification.isRead && (
                                <button
                                    onClick={() => onMarkAsRead(notification.id)}
                                    className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-700"
                                    title="Đánh dấu đã đọc"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            
                            <button
                                onClick={() => onDelete(notification.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700"
                                title="Xóa thông báo"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <p className="text-slate-300 mb-3 leading-relaxed">
                        {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(notification.createdAt)}</span>
                            </span>
                            
                            <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                notification.priority === 'urgent' && "bg-red-600 text-white",
                                notification.priority === 'high' && "bg-orange-600 text-white",
                                notification.priority === 'normal' && "bg-blue-600 text-white",
                                notification.priority === 'low' && "bg-slate-600 text-white"
                            )}>
                                {notification.priority === 'urgent' && 'Khẩn cấp'}
                                {notification.priority === 'high' && 'Cao'}
                                {notification.priority === 'normal' && 'Bình thường'}
                                {notification.priority === 'low' && 'Thấp'}
                            </span>
                        </div>

                        {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Loading Skeleton
const NotificationsSkeleton: React.FC = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                        <div className="h-5 bg-slate-700 rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-slate-700 rounded mb-3 w-full"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Empty State
interface EmptyStateProps {
    filter: FilterType;
}

const EmptyState: React.FC<EmptyStateProps> = ({ filter }) => {
    const getEmptyMessage = () => {
        switch (filter) {
            case 'unread':
                return {
                    title: 'Không có thông báo chưa đọc',
                    description: 'Tất cả thông báo đã được đọc'
                };
            case 'read':
                return {
                    title: 'Không có thông báo đã đọc',
                    description: 'Chưa có thông báo nào được đọc'
                };
            default:
                return {
                    title: 'Không có thông báo',
                    description: 'Các thông báo mới sẽ xuất hiện ở đây'
                };
        }
    };

    const { title, description } = getEmptyMessage();

    return (
        <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 mb-6">{description}</p>
        </div>
    );
};

// Error State
interface ErrorStateProps {
    error: string;
    onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
    <div className="text-center py-16">
        <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Có lỗi xảy ra</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
            Thử lại
        </button>
    </div>
);