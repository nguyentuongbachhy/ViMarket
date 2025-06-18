import React, { useState } from 'react';
import type { ReviewInfo } from '~/api/types';
import { useReviewActions, useReviewReplies } from '~/hooks/review';
import { cn } from '~/lib/utils';
import { ReviewForm } from './ReviewForm';

interface ReviewItemProps {
    review: ReviewInfo;
    productId: string;
    onReviewUpdate?: () => void;
    className?: string;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
    review,
    productId,
    onReviewUpdate,
    className
}) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [helpfulCount, setHelpfulCount] = useState(review.helpfulVotes);

    const { createReview, markHelpful, loading } = useReviewActions(productId);
    const {
        replies,
        loading: repliesLoading,
        hasMore: hasMoreReplies,
        fetchReplies,
        loadMore: loadMoreReplies
    } = useReviewReplies({
        reviewId: review.id,
        autoFetch: false
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <svg
                key={i}
                className={cn(
                    "w-4 h-4",
                    i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-slate-600"
                )}
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    const handleReplySubmit = async (replyData: any) => {
        const result = await createReview(replyData);
        if (result) {
            setShowReplyForm(false);
            if (showReplies) {
                await fetchReplies();
            }
            onReviewUpdate?.();
        }
    };

    const handleMarkHelpful = async () => {
        const success = await markHelpful(review.id);
        if (success) {
            setHelpfulCount(prev => prev + 1);
        }
    };

    const handleShowReplies = async () => {
        if (!showReplies && replies.length === 0) {
            await fetchReplies();
        }
        setShowReplies(!showReplies);
    };

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case 'LIKE': return 'text-green-400';
            case 'DISLIKE': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const getSentimentIcon = (sentiment?: string) => {
        switch (sentiment) {
            case 'LIKE': return '👍';
            case 'DISLIKE': return '👎';
            default: return '😐';
        }
    };

    return (
        <div className={cn("bg-slate-800 rounded-lg p-6 border border-slate-700", className)}>
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                            {review.user?.fullName?.charAt(0).toUpperCase() || review.user?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h4 className="text-white font-medium">
                                {review.user?.fullName || review.user?.username || 'Người dùng ẩn danh'}
                            </h4>
                            {review.verifiedPurchase && (
                                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-medium border border-green-500/30">
                                    Đã mua hàng
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                            <div className="flex">
                                {renderStars(review.rating)}
                            </div>
                            <span className="text-slate-400 text-sm">
                                {formatDate(review.reviewDate)}
                            </span>
                            {review.sentiment && (
                                <div className={cn("flex items-center space-x-1", getSentimentColor(review.sentiment))}>
                                    <span>{getSentimentIcon(review.sentiment)}</span>
                                    <span className="text-xs capitalize">{review.sentiment.toLowerCase()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Content */}
            <div className="mb-4">
                {review.title && (
                    <h5 className="text-white font-medium mb-2">{review.title}</h5>
                )}
                {review.content && (
                    <p className="text-slate-300 leading-relaxed">{review.content}</p>
                )}
            </div>

            {/* Review Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleMarkHelpful}
                        disabled={loading}
                        className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span className="text-sm">Hữu ích ({helpfulCount})</span>
                    </button>

                    {review.level === 1 && (
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span className="text-sm">Phản hồi</span>
                        </button>
                    )}

                    {review.replyCount > 0 && (
                        <button
                            onClick={handleShowReplies}
                            disabled={repliesLoading}
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm">
                                {showReplies ? 'Ẩn phản hồi' : `Xem ${review.replyCount} phản hồi`}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Reply Form */}
            {showReplyForm && (
                <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                    <h6 className="text-white font-medium mb-4">Phản hồi đánh giá</h6>
                    <ReviewForm
                        onSubmit={handleReplySubmit}
                        loading={loading}
                        parentId={review.id}
                    />
                </div>
            )}

            {/* Replies */}
            {showReplies && (
                <div className="mt-6 space-y-4">
                    <div className="border-l-2 border-slate-600 pl-6">
                        {replies.map((reply) => (
                            <div key={reply.id} className="bg-slate-700 rounded-lg p-4 mb-4">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xs">
                                            {reply.user?.fullName?.charAt(0).toUpperCase() || reply.user?.username?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <h6 className="text-white font-medium text-sm">
                                            {reply.user?.fullName || reply.user?.username || 'Người dùng ẩn danh'}
                                        </h6>
                                        <span className="text-slate-400 text-xs">
                                            {formatDate(reply.reviewDate)}
                                        </span>
                                    </div>
                                </div>
                                {reply.content && (
                                    <p className="text-slate-300 text-sm leading-relaxed">{reply.content}</p>
                                )}
                            </div>
                        ))}

                        {hasMoreReplies && (
                            <button
                                onClick={loadMoreReplies}
                                disabled={repliesLoading}
                                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                            >
                                {repliesLoading ? 'Đang tải...' : 'Xem thêm phản hồi'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};