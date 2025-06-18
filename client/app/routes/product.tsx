// ~/routes/product.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ProductImageGallery } from '~/components/features/product/detail/ProductImageGallery';
import { ProductInfo } from '~/components/features/product/detail/ProductInfo';
import { ProductSpecifications } from '~/components/features/product/detail/ProductSpecifications';
import { ProductReviews } from '~/components/features/review';
import { useCartContext, useWishlistContext } from '~/contexts';
import { useQuickAddToCart } from '~/hooks/cart';
import { useProduct } from '~/hooks/product/useProducts';
import { useQuickWishlistToggle } from '~/hooks/wishlist';
import { cn } from '~/lib/utils';
import type { Route } from './+types/product';

export function meta({ params }: Route.MetaArgs) {
    return [
        { title: `Sản phẩm | E-Commerce` },
        { name: "description", content: "Xem chi tiết sản phẩm, giá cả và thông tin" },
        { property: "og:title", content: `Sản phẩm | E-Commerce` },
        { property: "og:description", content: "Xem chi tiết sản phẩm, giá cả và thông tin" },
    ];
}

// Toast component (keep the same)
const Toast: React.FC<{
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}> = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    }[type];

    const icon = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    }[type];

    return (
        <div className={cn(
            "fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white shadow-lg transform transition-all",
            bgColor
        )}>
            <div className="flex items-center space-x-3">
                <span>{icon}</span>
                <span>{message}</span>
                <button onClick={onClose} className="text-white hover:text-gray-200 ml-2">
                    ×
                </button>
            </div>
        </div>
    );
};

// Loading component (keep the same)
const ProductDetailSkeleton = () => (
    <div className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                {/* Image Gallery Skeleton */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="aspect-square bg-slate-800 rounded-lg"></div>
                    <div className="flex space-x-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-16 h-16 bg-slate-800 rounded-lg"></div>
                        ))}
                    </div>
                </div>

                {/* Product Info Skeleton */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                        <div className="h-8 bg-slate-800 rounded w-3/4"></div>
                        <div className="h-6 bg-slate-800 rounded w-full"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="h-6 bg-slate-800 rounded w-24"></div>
                        <div className="h-6 bg-slate-800 rounded w-32"></div>
                    </div>
                    <div className="h-10 bg-slate-800 rounded w-1/3"></div>
                </div>

                {/* Purchase Panel Skeleton */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                        <div className="h-6 bg-slate-700 rounded"></div>
                        <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                        <div className="h-12 bg-slate-700 rounded"></div>
                        <div className="h-12 bg-slate-700 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Error component (keep the same)
const ProductDetailError: React.FC<{
    error: string;
    onRetry: () => void;
    loading: boolean;
}> = ({ error, onRetry, loading }) => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="space-y-4">
                <div className="text-6xl">😞</div>
                <h2 className="text-2xl font-bold text-white">Không thể tải thông tin sản phẩm</h2>
                <p className="text-slate-400">{error}</p>
                <div className="space-x-4">
                    <button
                        onClick={onRetry}
                        disabled={loading}
                        className={cn(
                            "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors",
                            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                        )}
                    >
                        {loading ? "Đang thử lại..." : "Thử lại"}
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // State for quantity and toast
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // Hooks
    const { product, loading, error, refetch } = useProduct(id!);
    const { quickAdd, loading: addingToCart, error: cartError } = useQuickAddToCart();
    const { toggle: toggleWishlist, loading: wishlistLoading, error: wishlistError } = useQuickWishlistToggle();

    // Contexts
    const { refresh: refreshCart } = useCartContext();
    const { refresh: refreshWishlist } = useWishlistContext();

    // Helper functions
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    };

    const isOutOfStock = product?.inventoryStatus?.toLowerCase() === 'out_of_stock';
    const isUpcoming = product?.inventoryStatus?.toLowerCase() === 'upcoming';
    const canAddToCart = product && !isOutOfStock && !isUpcoming;

    // Handle quantity changes (keep the same)
    const incrementQuantity = () => {
        setQuantity(prev => Math.min(prev + 1, 10));
    };

    const decrementQuantity = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0 && value <= 10) {
            setQuantity(value);
        }
    };

    // Handle product actions (keep the same)
    const handleAddToCart = async () => {
        if (!product || !canAddToCart) return;

        try {
            const success = await quickAdd(product.id, quantity);
            if (success) {
                await refreshCart();
                showToast(`✅ Đã thêm ${quantity} sản phẩm vào giỏ hàng`, 'success');
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            showToast('❌ Không thể thêm vào giỏ hàng. Vui lòng thử lại!', 'error');
        }
    };

    const handleAddToWishlist = async () => {
        if (!product) return;

        try {
            const newStatus = await toggleWishlist(product.id);
            if (newStatus !== null) {
                await refreshWishlist();
                showToast(
                    newStatus ? '💖 Đã thêm vào danh sách yêu thích' : '💔 Đã xóa khỏi danh sách yêu thích',
                    'success'
                );
            }
        } catch (error) {
            console.error('Failed to toggle wishlist:', error);
            showToast('❌ Không thể cập nhật danh sách yêu thích', 'error');
        }
    };

    const handleShare = async () => {
        if (!product) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: product.name,
                    text: product.shortDescription,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                showToast('📋 Đã sao chép link sản phẩm', 'success');
            }
        } catch (error) {
            console.error('Failed to share:', error);
            showToast('❌ Không thể chia sẻ sản phẩm', 'error');
        }
    };

    // Handle Buy Now (keep the same)
    const handleBuyNow = async () => {
        if (!product || !canAddToCart) return;

        try {
            const success = await quickAdd(product.id, quantity);
            if (success) {
                await refreshCart();
                showToast('🚀 Đang chuyển đến trang thanh toán...', 'info');

                setTimeout(() => {
                    navigate('/checkout');
                }, 1500);
            }
        } catch (error) {
            console.error('Failed to buy now:', error);
            showToast('❌ Không thể thực hiện. Vui lòng thử lại!', 'error');
        }
    };

    // Loading state
    if (loading && !product) {
        return <ProductDetailSkeleton />;
    }

    // Error state
    if (error && !product) {
        return (
            <ProductDetailError
                error={error}
                onRetry={refetch}
                loading={loading}
            />
        );
    }

    // Product not found
    if (!product) {
        return (
            <div className="w-full min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <div className="space-y-4">
                        <div className="text-6xl">🔍</div>
                        <h2 className="text-2xl font-bold text-white">Không tìm thấy sản phẩm</h2>
                        <p className="text-slate-400">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                        <a
                            href="/"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Về trang chủ
                        </a>
                    </div>
                </div>
            </div >
        );
    }

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;

    return (
        <div className="w-full min-h-screen bg-slate-900">
            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Breadcrumb */}
            <div className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <nav className="flex items-center space-x-2 text-sm">
                        <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">Trang chủ</a>
                        <span className="text-slate-500">›</span>
                        {product.categories && product.categories.length > 0 && (
                            <>
                                <span className="text-slate-400">{product.categories[0].name}</span>
                                <span className="text-slate-500">›</span>
                            </>
                        )}
                        <span className="text-white font-medium truncate">
                            {product.name}
                        </span>
                    </nav>
                </div>
            </div>

            {/* Error Messages */}
            {(cartError || wishlistError) && (
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded backdrop-blur-sm">
                        {cartError || wishlistError}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="w-full px-4 md:px-8 mx-auto py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Images - Left Column */}
                    <div className="lg:col-span-1">
                        <ProductImageGallery
                            images={product.images || []}
                            productName={product.name}
                        />
                    </div>

                    {/* Product Information - Center Column */}
                    <div className="lg:col-span-1">
                        <ProductInfo
                            product={product}
                        />
                    </div>

                    {/* Purchase Panel - Right Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 sticky top-4">
                            {/* Seller Info */}
                            {product.seller && (
                                <div className="mb-6 pb-4 border-b border-slate-700">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">
                                                {product.seller.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">{product.seller.name}</h3>
                                            <div className="flex items-center space-x-2 text-sm">
                                                <span className="text-slate-400">4.8 ⭐</span>
                                                <span className="text-slate-500">(4.6k+ đánh giá)</span>
                                            </div>
                                        </div>
                                    </div>
                                    {product.seller.isOfficial && (
                                        <div className="mt-2">
                                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-500/30">
                                                Chính hãng
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price Display */}
                            <div className="mb-6">
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl font-bold text-red-400">
                                        {formatPrice(product.price)}
                                    </span>
                                    {hasDiscount && (
                                        <span className="text-lg text-slate-500 line-through">
                                            {product.originalPrice && formatPrice(product.originalPrice)}
                                        </span>
                                    )}
                                </div>
                                {hasDiscount && (
                                    <div className="mt-1">
                                        <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs font-medium border border-red-500/30">
                                            Giảm {product.originalPrice && Math.round((1 - product.price / product.originalPrice) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Inventory Status */}
                            <div className="mb-6">
                                <div className="flex items-center space-x-2">
                                    <span className="text-slate-400">Tình trạng:</span>
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-medium",
                                        isOutOfStock
                                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                            : isUpcoming
                                                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                                : "bg-green-500/20 text-green-300 border border-green-500/30"
                                    )}>
                                        {isOutOfStock ? "Hết hàng" : isUpcoming ? "Sắp có hàng" : "Còn hàng"}
                                    </span>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            {canAddToCart && (
                                <div className="mb-6">
                                    <label className="block text-white font-medium mb-3">Số Lượng</label>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center border border-slate-600 rounded bg-slate-700">
                                            <button
                                                onClick={decrementQuantity}
                                                disabled={quantity <= 1}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-l"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            </button>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={handleQuantityChange}
                                                min="1"
                                                max="10"
                                                className="w-16 text-center bg-transparent text-white border-none outline-none py-2"
                                            />
                                            <button
                                                onClick={incrementQuantity}
                                                disabled={quantity >= 10}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>
                                        <span className="text-slate-400 text-sm">Tối đa 10 sản phẩm</span>
                                    </div>
                                </div>
                            )}

                            {/* Total Price */}
                            <div className="mb-6 pb-4 border-b border-slate-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Tạm tính ({quantity} sản phẩm)</span>
                                    <span className="text-2xl font-bold text-red-400">
                                        {formatPrice(product.price * quantity)}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleBuyNow}
                                    disabled={!canAddToCart || addingToCart}
                                    className={cn(
                                        "w-full py-3 px-6 font-semibold rounded-lg transition-all duration-200",
                                        canAddToCart && !addingToCart
                                            ? "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/25"
                                            : "bg-slate-600 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    {addingToCart ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Đang xử lý...</span>
                                        </div>
                                    ) : (
                                        isOutOfStock ? "Hết hàng" :
                                            isUpcoming ? "Sắp có hàng" : "Mua ngay"
                                    )}
                                </button>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={!canAddToCart || addingToCart}
                                    className={cn(
                                        "w-full py-3 px-6 border font-semibold rounded-lg transition-all duration-200",
                                        canAddToCart && !addingToCart
                                            ? "border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white shadow-lg hover:shadow-blue-500/25"
                                            : "border-slate-600 text-slate-500 cursor-not-allowed"
                                    )}
                                >
                                    {addingToCart ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span>Đang thêm...</span>
                                        </div>
                                    ) : "Thêm vào giỏ"}
                                </button>
                            </div>

                            {/* Wishlist and Share Buttons */}
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleAddToWishlist}
                                    disabled={wishlistLoading}
                                    className="py-2 px-4 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {wishlistLoading ? (
                                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    )}
                                    <span className="hidden sm:inline">Yêu thích</span>
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="py-2 px-4 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                    </svg>
                                    <span className="hidden sm:inline">Chia sẻ</span>
                                </button>
                            </div>

                            {/* Shipping Info */}
                            <div className="mt-6 pt-4 border-t border-slate-700">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300">Freeship đơn từ 299k</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300">Giao hàng nhanh 2-4h</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300">100% hàng chính hãng</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300">Đổi trả trong 30 ngày</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Description and Specifications */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Product Description */}
                    {product.description && (
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <h2 className="text-2xl font-bold text-white mb-4">Mô tả sản phẩm</h2>
                            <div className="prose prose-invert max-w-none">
                                <div
                                    className="text-slate-300 leading-relaxed whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Product Specifications */}
                    {product.specifications && product.specifications.length > 0 && (
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <ProductSpecifications specifications={product.specifications} />
                        </div>
                    )}
                </div>

                {/* Features Section */}
                <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h2 className="text-2xl font-bold text-white mb-6">Đặc điểm nổi bật</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-300">Sản phẩm chính hãng với chất lượng đảm bảo</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-300">Giao hàng nhanh chóng trong 2-4h</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-300">Đổi trả miễn phí trong 30 ngày</p>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-slate-300">Hỗ trợ khách hàng 24/7</p>
                        </div>
                    </div>
                </div>

                {/* Reviews Section - REPLACE the old reviews section with this */}
                <ProductReviews productId={product.id} className="mt-8" />
            </div>
        </div>
    );
}