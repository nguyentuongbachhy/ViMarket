import { Clock, MapPin, Star, Truck } from 'lucide-react';
import React from 'react';
import type { ProductDetail } from '~/api';
import { cn } from '~/lib/utils';

interface ProductInfoProps {
    product: ProductDetail;
    className?: string;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
    product,
    className
}) => {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount
        ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
        : 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatRating = (rating?: number) => {
        return rating ? rating.toFixed(1) : '0.0';
    };

    const getInventoryStatus = () => {
        const status = product.inventoryStatus?.toLowerCase();
        if (status === 'available' || status === 'in_stock') return {
            text: 'Còn hàng',
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            borderColor: 'border-green-500/30'
        };
        if (status === 'out_of_stock') return {
            text: 'Hết hàng',
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            borderColor: 'border-red-500/30'
        };
        if (status === 'upcoming') return {
            text: 'Sắp có hàng',
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20',
            borderColor: 'border-yellow-500/30'
        };
        return {
            text: 'Không rõ',
            color: 'text-slate-400',
            bgColor: 'bg-slate-500/20',
            borderColor: 'border-slate-500/30'
        };
    };

    const inventoryStatus = getInventoryStatus();

    return (
        <div className={cn("space-y-6", className)}>
            {/* Breadcrumb Tags */}
            <div className="flex flex-wrap gap-2">
                {product.brand?.name && (
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/30">
                        {product.brand.name}
                    </span>
                )}
                {product.categories && product.categories.length > 0 && (
                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium border border-purple-500/30">
                        {product.categories[0].name}
                    </span>
                )}
                <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border",
                    inventoryStatus.bgColor,
                    inventoryStatus.color,
                    inventoryStatus.borderColor
                )}>
                    {inventoryStatus.text}
                </span>
            </div>

            {/* Product Name */}
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                    {product.name}
                </h1>
                {product.shortDescription && (
                    <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                        {product.shortDescription}
                    </p>
                )}
            </div>

            {/* Rating and Sales */}
            <div className="flex flex-wrap items-center gap-6">
                {product.ratingAverage && product.ratingAverage > 0 && (
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-white">
                                {formatRating(product.ratingAverage)}
                            </span>
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={18}
                                        className={cn(
                                            "transition-colors",
                                            i < Math.floor(product.ratingAverage!)
                                                ? "text-yellow-400 fill-current"
                                                : "text-slate-600"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        {product.reviewCount > 0 && (
                            <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm underline">
                                ({product.reviewCount} đánh giá)
                            </button>
                        )}
                    </div>
                )}

                {product.quantitySold > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-sm">Đã bán:</span>
                        <span className="bg-slate-700 text-white px-2 py-1 rounded text-sm font-medium">
                            {product.quantitySold.toLocaleString()}
                        </span>
                    </div>
                )}

                {product.allTimeQuantitySold > 0 && (
                    <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-sm">Tổng bán:</span>
                        <span className="bg-slate-700 text-white px-2 py-1 rounded text-sm font-medium">
                            {product.allTimeQuantitySold.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {/* Price Display */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-bold text-red-400">
                            {formatPrice(product.price)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-xl text-slate-500 line-through">
                                    {formatPrice(product.originalPrice!)}
                                </span>
                                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                                    -{discountPercentage}%
                                </span>
                            </>
                        )}
                    </div>
                    {hasDiscount && (
                        <p className="text-green-400 font-medium">
                            🎉 Tiết kiệm {formatPrice(product.originalPrice! - product.price)}
                        </p>
                    )}
                </div>
            </div>

            {/* Shipping and Policies */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-blue-400" />
                    Chính sách & Dịch vụ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-slate-300">Freeship đơn từ 299k</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-slate-300">Giao hàng nhanh 2-4h</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-slate-300">100% hàng chính hãng</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <span className="text-slate-300">Đổi trả trong 30 ngày</span>
                    </div>
                </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300 text-sm">Giao đến</span>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        Thay đổi
                    </button>
                </div>
                <p className="text-white font-medium">Q. 1, P. Bến Nghé, TP.HCM</p>
                <p className="text-slate-400 text-sm mt-1">Dự kiến: Thứ 7, 25/05 - Miễn phí vận chuyển</p>
            </div>
        </div>
    );
};