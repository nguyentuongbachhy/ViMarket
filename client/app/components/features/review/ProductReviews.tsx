import React, { useState } from 'react';
import { useCheckPurchase } from '~/hooks/orders';
import { useReviewActions, useReviews, useUserReview } from '~/hooks/review';
import { cn } from '~/lib/utils';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { ReviewStats } from './ReviewStats';

interface ProductReviewsProps {
    productId: string;
    className?: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, className }) => {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Lấy reviews và stats
    const {
        reviews,
        stats,
        loading,
        error,
        hasMore,
        loadMore,
        refresh
    } = useReviews({ productId });

    // Tìm review của user hiện tại
    const { userReview, hasUserReview } = useUserReview(reviews, productId);

    // Actions cho review
    const {
        createReview,
        updateReview,
        deleteReview,
        loading: submitting,
        error: submitError
    } = useReviewActions(productId);

    // Kiểm tra đã mua hàng chưa
    const {
        hasPurchased,
        loading: checkingPurchase,
        error: purchaseError
    } = useCheckPurchase(productId);

    const handleSubmitReview = async (reviewData: any) => {
        const result = await createReview(reviewData);
        if (result) {
            setShowReviewForm(false);
            await refresh();
        }
    };

    const handleUpdateReview = async (reviewId: string, reviewData: any) => {
        const result = await updateReview(reviewId, reviewData);
        if (result) {
            setEditMode(false);
            await refresh();
        }
    };

    const handleDeleteReview = async () => {
        if (!userReview) return;

        const success = await deleteReview(userReview.id);
        if (success) {
            setShowDeleteConfirm(false);
            await refresh();
        }
    };

    // Logic điều kiện
    const canWriteReview = hasPurchased && !hasUserReview;
    const canEditReview = hasPurchased && hasUserReview;

    if (error) {
        return (
            <div className={cn("bg-slate-800 rounded-lg p-6 border border-slate-700", className)}>
                <div className="text-center py-8">
                    <div className="text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Không thể tải đánh giá</h3>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-8", className)}>
            {/* Review Stats */}
            {stats && <ReviewStats stats={stats} />}

            {/* Write/Edit Review Section */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                        {hasUserReview ? 'Đánh giá của bạn' : 'Viết đánh giá'}
                    </h3>

                    {checkingPurchase ? (
                        <div className="flex items-center space-x-2 text-slate-400">
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            <span>Đang kiểm tra...</span>
                        </div>
                    ) : hasPurchased === false ? (
                        <div className="text-slate-500 text-sm bg-slate-700 px-3 py-2 rounded">
                            💡 Bạn cần mua sản phẩm để có thể đánh giá
                        </div>
                    ) : hasUserReview && !editMode ? (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setEditMode(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                ✏️ Chỉnh sửa
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                🗑️ Xóa
                            </button>
                        </div>
                    ) : canWriteReview ? (
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium transition-colors",
                                showReviewForm
                                    ? "bg-slate-600 text-slate-300 hover:bg-slate-700"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            )}
                        >
                            {showReviewForm ? '❌ Hủy' : '✍️ Viết đánh giá'}
                        </button>
                    ) : null}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md mx-4">
                            <h3 className="text-lg font-bold text-white mb-3">Xác nhận xóa đánh giá</h3>
                            <p className="text-slate-300 mb-6">
                                Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex space-x-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-slate-600 text-slate-300 rounded hover:bg-slate-700 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeleteReview}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Đang xóa...' : 'Xóa'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Purchase Error */}
                {purchaseError && (
                    <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-500/50 text-yellow-200 rounded-lg">
                        ⚠️ Không thể kiểm tra trạng thái mua hàng: {purchaseError}
                    </div>
                )}

                {/* Existing Review Display */}
                {userReview && !editMode && (
                    <div className="bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <svg
                                        key={i}
                                        className={cn(
                                            "w-5 h-5",
                                            i < userReview.rating ? "text-yellow-400 fill-current" : "text-slate-600"
                                        )}
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-slate-300 text-sm">
                                📅 {new Date(userReview.reviewDate).toLocaleDateString('vi-VN')}
                            </span>
                            {userReview.verifiedPurchase && (
                                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs border border-green-500/30">
                                    ✅ Đã mua hàng
                                </span>
                            )}
                        </div>
                        {userReview.title && (
                            <h4 className="text-white font-medium mb-2">{userReview.title}</h4>
                        )}
                        <p className="text-slate-300 leading-relaxed">{userReview.content}</p>

                        {userReview.helpfulVotes > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-600">
                                <span className="text-slate-400 text-sm">
                                    👍 {userReview.helpfulVotes} người thấy hữu ích
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Review Form */}
                {((canWriteReview && showReviewForm) || (canEditReview && editMode)) && (
                    <div className="mt-6">
                        {submitError && (
                            <div className="mb-4 p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg">
                                ❌ {submitError}
                            </div>
                        )}
                        <ReviewForm
                            onSubmit={handleSubmitReview}
                            onUpdate={handleUpdateReview}
                            loading={submitting}
                            mode={editMode ? 'edit' : 'create'}
                            existingReview={userReview}
                            onCancel={() => setEditMode(false)}
                        />
                    </div>
                )}

                {/* Purchase Info */}
                {hasPurchased === false && (
                    <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <div className="text-blue-400 mt-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-blue-300 font-medium mb-1">Tại sao tôi không thể đánh giá?</h4>
                                <p className="text-blue-200 text-sm">
                                    Để đảm bảo tính chính xác và độ tin cậy, chỉ những khách hàng đã mua sản phẩm mới có thể viết đánh giá.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reviews List */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-6">
                    💬 Đánh giá từ khách hàng {stats && `(${stats.totalReviews})`}
                </h3>

                <ReviewList
                    reviews={reviews}
                    productId={productId}
                    loading={loading}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    onReviewUpdate={refresh}
                />
            </div>
        </div>
    );
};