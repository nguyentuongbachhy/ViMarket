import { useCallback, useEffect, useState } from 'react';
import type { ReviewInfo } from '~/api/types';
import { useAuth } from '~/hooks/auth';
import { useHydrated } from '~/hooks/utils/useHydrated';

export const useUserReview = (reviews: ReviewInfo[], productId: string) => {
    const [userReview, setUserReview] = useState<ReviewInfo | null>(null);
    const { user } = useAuth();
    const hydrated = useHydrated();

    const findUserReview = useCallback(() => {
        if (!hydrated || !user || !reviews || reviews.length === 0) {
            setUserReview(null);
            return;
        }

        // Tìm review của user hiện tại trong danh sách reviews
        const foundReview = reviews.find(review =>
            review.userId === user.id && review.productId === productId && review.level === 1
        );

        setUserReview(foundReview || null);
    }, [hydrated, user, reviews, productId]);

    useEffect(() => {
        findUserReview();
    }, [findUserReview]);

    return {
        userReview,
        hasUserReview: !!userReview,
        refreshUserReview: findUserReview
    };
};