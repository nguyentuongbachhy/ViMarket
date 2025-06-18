import React from 'react';
import type { ReviewStats as ReviewStatsType } from '~/api/types';
import { cn } from '~/lib/utils';

interface ReviewStatsProps {
    stats: ReviewStatsType;
    className?: string;
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({ stats, className }) => {
    const { averageRating, totalReviews, ratingBreakdown } = stats;

    const formatRating = (rating: number) => rating.toFixed(1);

    const ratingPercentage = (count: number) => {
        return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    };

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <svg
                key={i}
                className={cn(
                    "w-5 h-5",
                    i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-slate-600"
                )}
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    return (
        <div className={cn("bg-slate-800 rounded-lg p-6 border border-slate-700", className)}>
            <h3 className="text-xl font-bold text-white mb-4">Đánh giá sản phẩm</h3>

            <div className="flex items-center justify-between mb-6">
                <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {formatRating(averageRating)}
                    </div>
                    <div className="flex justify-center mb-2">
                        {renderStars(averageRating)}
                    </div>
                    <div className="text-slate-400 text-sm">
                        {totalReviews} đánh giá
                    </div>
                </div>

                <div className="flex-1 ml-8">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingBreakdown[`${star === 1 ? 'one' : star === 2 ? 'two' : star === 3 ? 'three' : star === 4 ? 'four' : 'five'}Star`];
                        const percentage = ratingPercentage(count);

                        return (
                            <div key={star} className="flex items-center mb-2">
                                <span className="text-slate-300 text-sm w-8">
                                    {star}★
                                </span>
                                <div className="flex-1 mx-3 bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-slate-400 text-sm w-12 text-right">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};