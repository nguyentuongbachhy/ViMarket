import React from 'react';
import type { ReviewInfo } from '~/api/types';
import { cn } from '~/lib/utils';
import { ReviewItem } from './ReviewItem';

interface ReviewListProps {
    reviews: ReviewInfo[];
    productId: string;
    loading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onReviewUpdate?: () => void;
    className?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
    reviews,
    productId,
    loading = false,
    hasMore = false,
    onLoadMore,
    onReviewUpdate,
    className
}) => {
    if (reviews.length === 0 && !loading) {
        return (
            <div className={cn("text-center py-12", className)}>
                <div className="text-slate-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-lg font-medium">Chưa có đánh giá nào</p>
                    <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                    productId={productId}
                    onReviewUpdate={onReviewUpdate}
                />
            ))}

            {loading && (
                <div className="flex justify-center py-8">
                    <div className="flex items-center space-x-2 text-slate-400">
                        <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải đánh giá...</span>
                    </div>
                </div>
            )}

            {hasMore && !loading && (
                <div className="text-center py-6">
                    <button
                        onClick={onLoadMore}
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
                    >
                        Xem thêm đánh giá
                    </button>
                </div>
            )}
        </div>
    );
};