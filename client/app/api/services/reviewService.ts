import { type AxiosResponse } from 'axios';
import instance, { handleApiError, handleApiResponse } from '~/api/axios';
import type {
    ApiResponse,
    PagedResponse,
    ReviewCreate,
    ReviewFilterParams,
    ReviewInfo,
    ReviewStats
} from '~/api/types';

export class ReviewService {
    private readonly baseUrl = '/reviews';

    async createReview(reviewData: ReviewCreate): Promise<ReviewInfo> {
        try {
            const response: AxiosResponse<ApiResponse<ReviewInfo>> = await instance.post(
                this.baseUrl,
                reviewData
            );
            return handleApiResponse<ReviewInfo>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getProductReviews(
        productId: string,
        params: ReviewFilterParams = {}
    ): Promise<PagedResponse<ReviewInfo>> {
        try {
            const queryParams = this.buildQueryParams(params);
            const response: AxiosResponse = await instance.get(
                `${this.baseUrl}/product/${productId}?${queryParams}`
            );

            console.log('🔍 Raw response:', response.data);

            // ✅ Handle the nested content structure
            const responseData = response.data;

            if (!responseData) {
                throw new Error('No response data');
            }

            // Check if we have the nested structure
            if (responseData.content &&
                typeof responseData.content === 'object' &&
                Array.isArray(responseData.content.content)) {

                // ✅ Handle nested structure: { content: { content: [], page: 0, ... } }
                const nestedData = responseData.content;

                return {
                    content: nestedData.content,
                    meta: {
                        page: nestedData.page,
                        size: nestedData.size,
                        totalElements: nestedData.totalElements,
                        totalPages: nestedData.totalPages,
                        last: nestedData.last
                    }
                };
            }

            // Handle standard structure: { status: "success", data: [], meta: {} }
            if (responseData.status === 'success') {
                const content = responseData.data || [];
                const meta = responseData.meta;

                if (!meta) {
                    throw new Error('Meta information missing from response');
                }

                return {
                    content: Array.isArray(content) ? content : [],
                    meta: meta
                };
            }

            throw new Error('Unexpected response format');

        } catch (error) {
            console.error('❌ Review Service Error:', error);
            throw new Error(handleApiError(error));
        }
    }

    async getProductReviewStats(productId: string): Promise<ReviewStats> {
        try {
            const response: AxiosResponse<ApiResponse<ReviewStats>> = await instance.get(
                `${this.baseUrl}/product/${productId}/stats`
            );
            return handleApiResponse<ReviewStats>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getReviewReplies(
        reviewId: string,
        params: ReviewFilterParams = {}
    ): Promise<PagedResponse<ReviewInfo>> {
        try {
            const queryParams = this.buildQueryParams(params);
            const response: AxiosResponse = await instance.get(
                `${this.baseUrl}/${reviewId}/replies?${queryParams}`
            );

            const responseData = response.data;

            // ✅ Handle the nested structure for replies too
            if (responseData.content &&
                typeof responseData.content === 'object' &&
                Array.isArray(responseData.content.content)) {

                const nestedData = responseData.content;

                return {
                    content: nestedData.content,
                    meta: {
                        page: nestedData.page,
                        size: nestedData.size,
                        totalElements: nestedData.totalElements,
                        totalPages: nestedData.totalPages,
                        last: nestedData.last
                    }
                };
            }

            // Handle standard structure
            if (responseData.status === 'success') {
                const content = responseData.data || [];
                const meta = responseData.meta;

                if (!meta) {
                    throw new Error('Meta information missing from response');
                }

                return {
                    content: Array.isArray(content) ? content : [],
                    meta: meta
                };
            }

            throw new Error('Unexpected response format');

        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async markReviewHelpful(reviewId: string): Promise<{ helpfulVotes: number }> {
        try {
            const response: AxiosResponse<ApiResponse<{ helpfulVotes: number }>> = await instance.patch(
                `${this.baseUrl}/${reviewId}/helpful`
            );
            return handleApiResponse<{ helpfulVotes: number }>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async updateReview(reviewId: string, reviewData: Partial<ReviewCreate>): Promise<ReviewInfo> {
        try {
            const response: AxiosResponse<ApiResponse<ReviewInfo>> = await instance.put(
                `${this.baseUrl}/${reviewId}`,
                reviewData
            );
            return handleApiResponse<ReviewInfo>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async deleteReview(reviewId: string): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<void>> = await instance.delete(
                `${this.baseUrl}/${reviewId}`
            );
            return handleApiResponse<void>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    private buildQueryParams(params: Record<string, any>): string {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(item => queryParams.append(key, String(item)));
                } else {
                    queryParams.append(key, String(value));
                }
            }
        });

        return queryParams.toString();
    }
}

export const reviewService = new ReviewService();
export default reviewService;