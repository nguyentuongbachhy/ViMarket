import React, { useEffect, useState } from 'react';
import type { ReviewCreate, ReviewInfo } from '~/api/types';
import { cn } from '~/lib/utils';

interface ReviewFormProps {
    onSubmit: (reviewData: Omit<ReviewCreate, 'productId'>) => Promise<void>;
    onUpdate?: (reviewId: string, reviewData: Partial<ReviewCreate>) => Promise<void>;
    loading?: boolean;
    parentId?: string;
    className?: string;
    existingReview?: ReviewInfo | null;
    mode?: 'create' | 'edit';
    onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
    onSubmit,
    onUpdate,
    loading = false,
    parentId,
    className,
    existingReview,
    mode = 'create',
    onCancel
}) => {
    const [rating, setRating] = useState(existingReview?.rating || 5);
    const [title, setTitle] = useState(existingReview?.title || '');
    const [content, setContent] = useState(existingReview?.content || '');
    const [hoveredRating, setHoveredRating] = useState(0);

    useEffect(() => {
        if (existingReview && mode === 'edit') {
            setRating(existingReview.rating);
            setTitle(existingReview.title || '');
            setContent(existingReview.content || '');
        }
    }, [existingReview, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) return;

        const reviewData = {
            rating,
            title: title.trim() || undefined,
            content: content.trim(),
            level: parentId ? 2 : 1,
            parentId: parentId
        };

        if (mode === 'edit' && existingReview && onUpdate) {
            await onUpdate(existingReview.id, reviewData);
        } else {
            await onSubmit(reviewData);
        }

        if (mode === 'create' && !parentId) {
            setRating(5);
            setTitle('');
            setContent('');
        } else if (mode === 'create' && parentId) {
            setContent('');
        }
    };

    const renderStars = () => {
        return [...Array(5)].map((_, i) => {
            const starValue = i + 1;
            const isFilled = starValue <= (hoveredRating || rating);

            return (
                <button
                    key={i}
                    type="button"
                    className={cn(
                        "w-8 h-8 transition-colors",
                        isFilled ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400"
                    )}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(starValue)}
                >
                    <svg className="w-full h-full fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            );
        });
    };

    return (
        <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
            {!parentId && (
                <>
                    {/* Rating */}
                    <div>
                        <label className="block text-white font-medium mb-2">
                            Đánh giá của bạn *
                        </label>
                        <div className="flex items-center space-x-1">
                            {renderStars()}
                            <span className="ml-3 text-slate-400">
                                {rating}/5 sao
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-white font-medium mb-2">
                            Tiêu đề đánh giá
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Tóm tắt đánh giá của bạn..."
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={200}
                        />
                    </div>
                </>
            )}

            {/* Content */}
            <div>
                <label className="block text-white font-medium mb-2">
                    {parentId ? 'Phản hồi *' : mode === 'edit' ? 'Nội dung đánh giá *' : 'Nội dung đánh giá *'}
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={parentId ? "Viết phản hồi của bạn..." : "Chia sẻ trải nghiệm của bạn về sản phẩm..."}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={parentId ? 3 : 4}
                    required
                    maxLength={1000}
                />
                <div className="text-right text-slate-400 text-sm mt-1">
                    {content.length}/1000
                </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
                {mode === 'edit' && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className={cn(
                        "px-6 py-3 font-medium rounded-lg transition-colors",
                        loading || !content.trim()
                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                >
                    {loading ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Đang {mode === 'edit' ? 'cập nhật' : 'gửi'}...</span>
                        </div>
                    ) : (
                        mode === 'edit' ? 'Cập nhật đánh giá' : (parentId ? 'Gửi phản hồi' : 'Gửi đánh giá')
                    )}
                </button>
            </div>
        </form>
    );
};