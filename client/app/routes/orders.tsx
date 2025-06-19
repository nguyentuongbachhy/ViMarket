// ~/routes/orders/+page.tsx
import { Calendar, ChevronRight, Clock, Package, RefreshCw, Search, Truck } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Order, OrderStatus } from '~/api';
import { useOrders } from '~/hooks/orders';
import { cn } from '~/lib/utils';
import type { Route } from './+types/orders';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Đơn hàng của tôi | ViMarket' },
        { name: 'description', content: 'Quản lý và theo dõi đơn hàng của bạn' },
    ];
}

const orderStatusConfig = {
    pending: {
        label: 'Chờ xác nhận',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        icon: Clock,
        description: 'Đơn hàng đang được xử lý'
    },
    confirmed: {
        label: 'Đã xác nhận',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        icon: Package,
        description: 'Đơn hàng đã được xác nhận'
    },
    shipped: {
        label: 'Đang giao',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        icon: Truck,
        description: 'Đơn hàng đang được giao'
    },
    delivered: {
        label: 'Đã giao',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: Package,
        description: 'Đơn hàng đã được giao thành công'
    },
    cancelled: {
        label: 'Đã hủy',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: Package,
        description: 'Đơn hàng đã bị hủy'
    }
};

// Loading Skeleton Component
const OrdersPageSkeleton = () => (
    <div className="min-h-screen bg-slate-900">
        <div className="bg-slate-800 border-b border-slate-700">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="h-8 bg-slate-700 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-slate-700 rounded w-96 animate-pulse"></div>
            </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-4 bg-slate-800 rounded-lg animate-pulse">
                        <div className="h-8 bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded"></div>
                    </div>
                ))}
            </div>
            {/* Orders Skeleton */}
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse">
                        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Empty State Component
const EmptyOrdersState: React.FC<{
    hasOrders: boolean;
    selectedStatus: OrderStatus | 'all';
    searchQuery: string;
    onNavigateHome: () => void;
}> = ({ hasOrders, selectedStatus, searchQuery, onNavigateHome }) => {
    if (!hasOrders) {
        return (
            <div className="text-center py-16">
                <Package className="w-20 h-20 text-slate-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">Chưa có đơn hàng nào</h2>
                <p className="text-slate-400 mb-8">Bắt đầu mua sắm để tạo đơn hàng đầu tiên của bạn</p>
                <button
                    onClick={onNavigateHome}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Bắt đầu mua sắm
                </button>
            </div>
        );
    }

    return (
        <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-slate-400">
                {searchQuery
                    ? `Không có đơn hàng nào khớp với "${searchQuery}"`
                    : `Không có đơn hàng nào ở trạng thái "${orderStatusConfig[selectedStatus as OrderStatus]?.label || 'đã chọn'}"`
                }
            </p>
        </div>
    );
};

// Order Card Component
const OrderCard: React.FC<{
    order: Order;
    onViewDetail: () => void;
    formatPrice: (price: number) => string;
    formatDate: (date: string | Date) => string;
}> = ({ order, onViewDetail, formatPrice, formatDate }) => {
    const statusConfig = orderStatusConfig[order.status];
    const StatusIcon = statusConfig?.icon || Package;

    return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:bg-slate-750 transition-colors">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                                Đơn hàng #{order.id.slice(-8).toUpperCase()}
                            </h3>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-sm font-medium border",
                                statusConfig?.color || 'text-gray-400',
                                statusConfig?.bgColor || 'bg-gray-500/20',
                                statusConfig?.borderColor || 'border-gray-500/30'
                            )}>
                                <StatusIcon className="w-4 h-4 inline mr-1" />
                                {statusConfig?.label || order.status}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(order.createdAt)}
                            </span>
                            <span>{order.items?.length || 0} sản phẩm</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-red-400">
                            {formatPrice(order.totalAmount)}
                        </div>
                        <div className="text-sm text-slate-400">
                            {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </div>
                    </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-slate-400">Sản phẩm:</span>
                        </div>
                        <div className="flex space-x-2 overflow-x-auto">
                            {order.items.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex-shrink-0 flex items-center space-x-2 bg-slate-700 rounded p-2">
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.productName}
                                            className="w-8 h-8 rounded object-cover"
                                        />
                                    )}
                                    <div>
                                        <p className="text-xs text-white truncate max-w-20">{item.productName}</p>
                                        <p className="text-xs text-slate-400">x{item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                            {order.items.length > 3 && (
                                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-slate-700 rounded text-slate-400 text-xs">
                                    +{order.items.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        Trạng thái thanh toán:
                        <span className={cn(
                            "ml-1 font-medium",
                            order.paymentStatus === 'paid' ? 'text-green-400' :
                                order.paymentStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'
                        )}>
                            {order.paymentStatus === 'paid' ? 'Đã thanh toán' :
                                order.paymentStatus === 'failed' ? 'Thanh toán thất bại' : 'Chờ thanh toán'}
                        </span>
                    </div>

                    <button
                        onClick={onViewDetail}
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <span>Xem chi tiết</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function OrdersPage() {
    const navigate = useNavigate();
    const { orders, loading, error, refetch, clearError } = useOrders();
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString: string | Date) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter orders based on status and search query
    const filteredOrders = orders.filter(order => {
        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        const matchesSearch = !searchQuery ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Group orders by status for summary
    const orderCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        acc.all = (acc.all || 0) + 1;
        return acc;
    }, {} as Record<OrderStatus | 'all', number>);

    const handleRefetch = async () => {
        if (error) clearError();
        await refetch();
    };

    if (loading && orders.length === 0) {
        return <OrdersPageSkeleton />;
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Đơn hàng của tôi</h1>
                            <p className="text-slate-400 mt-2">Theo dõi và quản lý các đơn hàng của bạn</p>
                        </div>
                        <button
                            onClick={handleRefetch}
                            disabled={loading}
                            className={cn(
                                "flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
                                loading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Order Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <button
                        onClick={() => setSelectedStatus('all')}
                        className={cn(
                            "p-4 rounded-lg text-center transition-all",
                            selectedStatus === 'all'
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        )}
                    >
                        <div className="text-2xl font-bold">{orderCounts.all || 0}</div>
                        <div className="text-sm">Tất cả</div>
                    </button>

                    {Object.entries(orderStatusConfig).map(([status, config]) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status as OrderStatus)}
                            className={cn(
                                "p-4 rounded-lg text-center transition-all",
                                selectedStatus === status
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            )}
                        >
                            <div className="text-2xl font-bold">{orderCounts[status as OrderStatus] || 0}</div>
                            <div className="text-sm">{config.label}</div>
                        </button>
                    ))}
                </div>

                {/* Search and Filters */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm theo mã đơn hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">
                        <div className="flex items-center justify-between">
                            <p>{error}</p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleRefetch}
                                    className="text-red-300 underline hover:text-red-200"
                                >
                                    Thử lại
                                </button>
                                <button
                                    onClick={clearError}
                                    className="text-red-300 hover:text-red-200"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <EmptyOrdersState
                        hasOrders={orders.length > 0}
                        selectedStatus={selectedStatus}
                        searchQuery={searchQuery}
                        onNavigateHome={() => navigate('/')}
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onViewDetail={() => navigate(`/order/${order.id}`)}
                                formatPrice={formatPrice}
                                formatDate={formatDate}
                            />
                        ))}

                        {/* Load More Button (if needed) */}
                        {filteredOrders.length > 0 && filteredOrders.length % 20 === 0 && (
                            <div className="text-center pt-8">
                                <button
                                    onClick={() => {/* TODO: Load more logic */ }}
                                    className="bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Xem thêm đơn hàng
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}