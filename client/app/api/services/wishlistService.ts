import { type AxiosResponse } from 'axios';
import instance, { handleApiError, handleApiResponse } from '~/api/axios';
import type { ApiResponse } from '~/api/types';
import type {
    AddToWishlistRequest,
    MostWishlistedProduct,
    Wishlist,
    WishlistItemCount,
    WishlistStats,
    WishlistStatus,
    WishlistWithPrices
} from '~/api/types/wishlist';

export class WishlistService {
    private readonly baseUrl = '/wishlist'

    async getWishlist(page: number = 1, limit: number = 20): Promise<Wishlist> {
        try {
            const response: AxiosResponse<ApiResponse<Wishlist>> = await instance.get(
                `${this.baseUrl}?page=${page}&limit=${limit}`
            )
            const data = handleApiResponse<Wishlist>(response)

            // Ensure we have a valid structure
            if (!data || !Array.isArray(data.items)) {
                console.warn('Invalid wishlist data structure:', data)
                return {
                    items: [],
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 0
                }
            }

            return data
        } catch (error) {
            console.error('Error fetching wishlist:', error)
            throw new Error(handleApiError(error))
        }
    }

    async addToWishlist(request: AddToWishlistRequest): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<any>> = await instance.post(
                this.baseUrl,
                request
            )
            handleApiResponse(response)
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async removeFromWishlist(productId: string): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.delete(
                `${this.baseUrl}/${productId}`
            )
            handleApiResponse(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async clearWishlist(): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.delete(
                this.baseUrl
            )
            handleApiResponse(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getWishlistCount(): Promise<number> {
        try {
            const response: AxiosResponse<ApiResponse<WishlistItemCount>> = await instance.get(
                `${this.baseUrl}/count`
            )
            const result = handleApiResponse<WishlistItemCount>(response)
            return result?.count || 0
        } catch (error) {
            console.warn('Failed to get wishlist item count:', handleApiError(error))
            return 0
        }
    }

    async checkWishlistStatus(productId: string): Promise<boolean> {
        try {
            const response: AxiosResponse<ApiResponse<WishlistStatus>> = await instance.get(
                `${this.baseUrl}/check/${productId}`
            )
            const result = handleApiResponse<WishlistStatus>(response)
            return result?.isInWishlist || false
        } catch (error) {
            console.warn('Failed to check wishlist status:', handleApiError(error))
            return false
        }
    }

    async getWishlistWithPrices(): Promise<WishlistWithPrices> {
        try {
            const response: AxiosResponse<ApiResponse<WishlistWithPrices>> = await instance.get(
                `${this.baseUrl}/with-prices`
            )
            const data = handleApiResponse<WishlistWithPrices>(response)

            // Ensure we have valid structure
            if (!data || !Array.isArray(data.items)) {
                return { items: [] }
            }

            return data
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getWishlistStats(): Promise<WishlistStats> {
        try {
            const response: AxiosResponse<ApiResponse<WishlistStats>> = await instance.get(
                `${this.baseUrl}/analytics/stats`
            )
            const data = handleApiResponse<WishlistStats>(response)
            return data || { total: 0, recent: 0 }
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getMostWishlistedProducts(limit: number = 10): Promise<MostWishlistedProduct[]> {
        try {
            const response: AxiosResponse<ApiResponse<MostWishlistedProduct[]>> = await instance.get(
                `${this.baseUrl}/analytics/most-wishlisted?limit=${limit}`
            );
            const data = handleApiResponse<MostWishlistedProduct[]>(response);
            return Array.isArray(data) ? data : []
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async isProductInWishlist(productId: string): Promise<boolean> {
        return this.checkWishlistStatus(productId);
    }

    async toggleWishlist(productId: string): Promise<boolean> {
        try {
            const isInWishlist = await this.isProductInWishlist(productId);

            if (isInWishlist) {
                await this.removeFromWishlist(productId);
                return false;
            } else {
                await this.addToWishlist({ productId });
                return true;
            }
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}

export const wishlistService = new WishlistService();
export default wishlistService;