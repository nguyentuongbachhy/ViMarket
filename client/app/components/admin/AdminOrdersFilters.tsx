import type { OrderFilters } from '~/routes/admin/adminOrders';

interface AdminOrdersFiltersProps {
    filters: OrderFilters;
    onFilterChange: (filters: Partial<OrderFilters>) => void;
    loading: boolean;
}

export function AdminOrdersFilters({ filters, onFilterChange, loading }: AdminOrdersFiltersProps) {
    const handleQuickFilter = (status: string) => {
        onFilterChange({ status: status as any, page: 1 });
    };

    const clearFilters = () => {
        onFilterChange({
            status: '',
            search: '',
            dateFrom: '',
            dateTo: '',
            page: 1
        });
    };

    const hasActiveFilters = filters.status || filters.search || filters.dateFrom || filters.dateTo;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            {/* Quick Status Filters */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lọc nhanh theo trạng thái
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleQuickFilter('')}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${!filters.status
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => handleQuickFilter('pending')}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${filters.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                    >
                        ⏳ Chờ xử lý
                    </button>
                    <button
                        onClick={() => handleQuickFilter('confirmed')}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${filters.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                    >
                        ✅ Đã xác nhận
                    </button>
                    <button
                        onClick={() => handleQuickFilter('shipped')}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${filters.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                    >
                        🚚 Đang giao
                    </button>
                    <button
                        onClick={() => handleQuickFilter('delivered')}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${filters.status === 'delivered'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                    >
                        🎉 Đã giao
                    </button>
                    <button
                        onClick={() => handleQuickFilter('cancelled')}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${filters.status === 'cancelled'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            }`}
                    >
                        ❌ Đã hủy
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tìm kiếm
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
                            placeholder="Mã đơn hàng, khách hàng, sản phẩm..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Date From */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Từ ngày
                    </label>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => onFilterChange({ dateFrom: e.target.value, page: 1 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đến ngày
                    </label>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => onFilterChange({ dateTo: e.target.value, page: 1 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Items per page */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hiển thị
                    </label>
                    <select
                        value={filters.limit}
                        onChange={(e) => onFilterChange({ limit: parseInt(e.target.value), page: 1 })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                    </select>
                </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <div className="flex justify-end">
                    <button
                        onClick={clearFilters}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Xóa bộ lọc
                    </button>
                </div>
            )}
        </div>
    );
}