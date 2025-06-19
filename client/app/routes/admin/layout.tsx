// app/routes/admin/layout.tsx
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '~/hooks/auth';

export default function AdminLayout() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user?.role?.includes('admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có quyền truy cập</h3>
                        <p className="mt-1 text-sm text-gray-500">Bạn cần quyền admin để truy cập trang này.</p>
                        <div className="mt-6">
                            <Link
                                to="/"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: '🏠' },
        { name: 'Đơn hàng', href: '/admin/orders', icon: '📦' },
        { name: 'Thống kê', href: '/admin/analytics', icon: '📊' },
        { name: 'Người dùng', href: '/admin/users', icon: '👥' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-white shadow-lg">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">Xin chào, {user.username}</p>
                    </div>

                    <nav className="mt-6">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center px-6 py-3 text-sm font-medium ${isActive
                                        ? 'bg-indigo-50 border-r-2 border-indigo-500 text-indigo-700'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-6 left-6">
                        <Link
                            to="/logout"
                            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Đăng xuất
                        </Link>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}