// app/routes/admin/index.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '~/api';
import type { OrderStats } from '~/hooks/admin';
import type { Route } from "./+types/adminIndex";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Admin Home | ViMarket" },
        { name: "description", content: "Trang quản lý chung cho admin" },
    ];
}

export default function AdminIndex() {
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const orderStats = await api.orders.getOrderStats();
                setStats(orderStats);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const quickActions = [
        {
            name: 'Quản lý đơn hàng',
            description: 'Xem và cập nhật trạng thái đơn hàng',
            href: '/admin/orders',
            icon: '📦',
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            name: 'Thống kê doanh thu',
            description: 'Xem báo cáo doanh thu và phân tích',
            href: '/admin/analytics',
            icon: '📊',
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            name: 'Quản lý người dùng',
            description: 'Quản lý tài khoản và quyền hạn',
            href: '/admin/users',
            icon: '👥',
            color: 'bg-purple-500 hover:bg-purple-600'
        },
        {
            name: 'Cài đặt hệ thống',
            description: 'Cấu hình và tùy chỉnh hệ thống',
            href: '/admin/settings',
            icon: '⚙️',
            color: 'bg-gray-500 hover:bg-gray-600'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-sm text-gray-700">
                    Tổng quan về hoạt động hệ thống
                </p>
            </div>

            {/* Stats Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white overflow-hidden rounded-lg border border-gray-200 animate-pulse">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                                    <div className="ml-4 w-0 flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white">
                                        📦
                                    </div>
                                </div>
                                <div className="ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Tổng đơn hàng</dt>
                                        <dd className="text-lg font-semibold text-blue-600">{stats.total}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center text-white">
                                        ⏳
                                    </div>
                                </div>
                                <div className="ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Chờ xử lý</dt>
                                        <dd className="text-lg font-semibold text-yellow-600">{stats.pending}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white">
                                        🎉
                                    </div>
                                </div>
                                <div className="ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Đã giao</dt>
                                        <dd className="text-lg font-semibold text-green-600">{stats.delivered}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center text-white">
                                        💰
                                    </div>
                                </div>
                                <div className="ml-4 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Doanh thu</dt>
                                        <dd className="text-lg font-semibold text-indigo-600">
                                            {formatCurrency(stats.totalRevenue)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.name}
                            to={action.href}
                            className="block bg-white overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                                        {action.icon}
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-sm font-medium text-gray-900">{action.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Hoạt động gần đây</h3>
                </div>
                <div className="p-6">
                    <div className="text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có hoạt động</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Hoạt động gần đây sẽ hiển thị ở đây
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}