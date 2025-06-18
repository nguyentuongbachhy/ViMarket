import type { UserInfo } from './auth';
import type { PagedResponse } from './common';

export interface ReviewCreate {
    productId: string;
    rating: number;
    title?: string;
    content?: string;
    verifiedPurchase?: boolean;
    level?: number;
    parentId?: string;
}

export interface ReviewInfo {
    id: string;
    productId: string;
    userId: string;
    user?: UserInfo;
    rating: number;
    title?: string;
    content?: string;
    helpfulVotes: number;
    verifiedPurchase: boolean;
    sentiment?: string;
    level: number;
    parentId?: string;
    replyCount: number;
    reviewDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: {
        oneStar: number;
        twoStar: number;
        threeStar: number;
        fourStar: number;
        fiveStar: number;
    };
}

// Sử dụng PagedResponse có sẵn từ common.ts
export type ReviewsResponse = PagedResponse<ReviewInfo>;
export type ReviewRepliesResponse = PagedResponse<ReviewInfo>;

export interface ReviewFilterParams {
    page?: number;
    size?: number;
    level?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
}