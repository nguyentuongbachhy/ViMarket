import { type AxiosResponse } from 'axios';
import instance, { handleApiError, handleApiResponse } from '~/api/axios';
import type { ApiResponse, BrandInfo } from '~/api/types';

export class BrandService {
    private readonly brandUrl = '/brands';

    async getAllBrands(): Promise<BrandInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<BrandInfo[]>> = await instance.get(
                this.brandUrl
            );
            return handleApiResponse<BrandInfo[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getBrandById(id: string): Promise<BrandInfo> {
        try {
            const response: AxiosResponse<ApiResponse<BrandInfo>> = await instance.get(
                `${this.brandUrl}/${id}`
            );
            return handleApiResponse<BrandInfo>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getBrandBySlug(slug: string): Promise<BrandInfo> {
        try {
            const response: AxiosResponse<ApiResponse<BrandInfo>> = await instance.get(
                `${this.brandUrl}/slug/${slug}`
            );
            return handleApiResponse<BrandInfo>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}

// Export singleton instance
export const brandService = new BrandService();
export default brandService;