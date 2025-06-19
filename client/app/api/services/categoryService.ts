import { type AxiosResponse } from "axios";
import instance, { handleApiError, handleApiResponse } from "~/api/axios";
import type { ApiResponse, CategoryInfo } from '~/api/types';

export class CategoryService {
    private readonly categoryUrl = '/categories'

    async getAllRootCategories(): Promise<CategoryInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<CategoryInfo[]>> = await instance.get(
                `${this.categoryUrl}/roots`
            )
            return handleApiResponse<CategoryInfo[]>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getAllCategories(): Promise<CategoryInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<CategoryInfo[]>> = await instance.get(
                `${this.categoryUrl}`
            )
            return handleApiResponse<CategoryInfo[]>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getCategoryById(id: string): Promise<CategoryInfo> {
        try {
            const response: AxiosResponse<ApiResponse<CategoryInfo>> = await instance.get(
                `${this.categoryUrl}/${id}`
            )
            return handleApiResponse<CategoryInfo>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getCategoriesByProductId(id: string): Promise<CategoryInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<CategoryInfo[]>> = await instance.get(
                `${this.categoryUrl}/product/${id}`
            )
            return handleApiResponse<CategoryInfo[]>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getSubcategories(parentId: string): Promise<CategoryInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<CategoryInfo[]>> = await instance.get(
                `${this.categoryUrl}/${parentId}/subcategories`
            );
            return handleApiResponse<CategoryInfo[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getCategoryPath(categoryId: string): Promise<CategoryInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<CategoryInfo[]>> = await instance.get(
                `${this.categoryUrl}/${categoryId}/path`
            );
            return handleApiResponse<CategoryInfo[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getCategoryHierarchy(categoryId: string): Promise<CategoryInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<CategoryInfo[]>> = await instance.get(
                `${this.categoryUrl}/${categoryId}/hierarchy`
            );
            return handleApiResponse<CategoryInfo[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async hasSubcategories(categoryId: string): Promise<boolean> {
        try {
            const response: AxiosResponse<ApiResponse<boolean>> = await instance.get(
                `${this.categoryUrl}/${categoryId}/has-subcategories`
            );
            return handleApiResponse<boolean>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;