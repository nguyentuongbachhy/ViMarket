import type { OrderStats } from '~/hooks/admin/';

interface AdminOrdersStatsProps {
    stats: OrderStats;
}

export function AdminOrdersStats({ stats }: AdminOrdersStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const statsCards = [
        {
            name: 'Tổng đơn hàng',
            value: formatNumber(stats.total),
            icon: '📦',
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            name: 'Chờ xử lý',
            value: formatNumber(stats.pending),
            icon: '⏳',
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
        },
        {
            name: 'Đang giao',
            value: formatNumber(stats.shipped),
            icon: '🚚',
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            name: 'Đã giao',
            value: formatNumber(stats.delivered),
            icon: '🎉',
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            name: 'Doanh thu',
            value: formatCurrency(stats.totalRevenue),
            icon: '💰',
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
        },
        {
            name: 'Giá trị TB',
            value: formatCurrency(stats.averageOrderValue),
            icon: '📊',
            color: 'bg-pink-500',
            textColor: 'text-pink-600',
            bgColor: 'bg-pink-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statsCards.map((card) => (
                <div key={card.name} className={`${card.bgColor} overflow-hidden rounded-lg p-5 border border-gray-200`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className={`w-8 h-8 ${card.color} rounded-md flex items-center justify-center text-white text-lg`}>
                                {card.icon}
                            </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    {card.name}
                                </dt>
                                <dd className={`text-lg font-semibold ${card.textColor}`}>
                                    {card.value}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}