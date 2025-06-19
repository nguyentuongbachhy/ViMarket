import { ExternalLink, X } from 'lucide-react';
import React from 'react';

interface SuggestedUrlBannerProps {
    url: string;
    onNavigate: () => void;
    onDismiss: () => void;
}

export const SuggestedUrlBanner: React.FC<SuggestedUrlBannerProps> = ({
    url,
    onNavigate,
    onDismiss
}) => {
    const getUrlDescription = (url: string) => {
        if (url.startsWith('/search')) return '🔍 Kết quả tìm kiếm';
        if (url.startsWith('/product/')) return '📱 Chi tiết sản phẩm';
        if (url.startsWith('/cart')) return '🛒 Giỏ hàng';
        if (url.startsWith('/wishlist')) return '❤️ Danh sách yêu thích';
        if (url.startsWith('/orders')) return '📦 Đơn hàng của bạn';
        if (url.startsWith('/category/')) return '📂 Danh mục sản phẩm';
        return '🔗 Trang gợi ý';
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 border-b border-blue-500/30 animate-slide-down">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                        <ExternalLink className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {getUrlDescription(url)}
                        </p>
                        <p className="text-xs text-blue-100 truncate">
                            Nhấn để xem hoặc đợi 3 giây tự động chuyển
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={onNavigate}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                    >
                        Xem ngay
                    </button>
                    <button
                        onClick={onDismiss}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};