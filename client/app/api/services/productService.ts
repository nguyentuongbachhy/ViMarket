import { type AxiosResponse } from 'axios';
import instance, { handleApiError, handleApiResponse } from '~/api/axios';
import type {
    ApiResponse,
    PagedResponse,
    ProductDetail,
    ProductFilterParams,
    ProductSearchParams,
    ProductSummary,
    SpecialProductFilterParams
} from '~/api/types';

export class ProductService {
    private readonly productUrl = '/products';

    async getProductById(id: string): Promise<ProductDetail> {
        try {
            const response: AxiosResponse<ApiResponse<ProductDetail>> = await instance.get(
                `${this.productUrl}/${id}`
            );
            return handleApiResponse<ProductDetail>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getAllProducts(params: ProductFilterParams = {}): Promise<PagedResponse<ProductSummary>> {
        try {
            const queryParams = this.buildQueryParams(params);
            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getProductsByIds(ids: string[]): Promise<ProductSummary[]> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('ids', ids.join(','));

            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/bulk?${queryParams}`
            );
            return handleApiResponse<ProductSummary[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getProductsByCategory(
        categoryId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PagedResponse<ProductSummary>> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            queryParams.append('size', size.toString());

            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/category/${categoryId}?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getProductsByBrand(
        brandId: string,
        page: number = 0,
        size: number = 20
    ): Promise<PagedResponse<ProductSummary>> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            queryParams.append('size', size.toString());

            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/brand/${brandId}?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getProductsByPriceRange(
        minPrice: number,
        maxPrice: number,
        page: number = 0,
        size: number = 20
    ): Promise<PagedResponse<ProductSummary>> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('minPrice', minPrice.toString());
            queryParams.append('maxPrice', maxPrice.toString());
            queryParams.append('page', page.toString());
            queryParams.append('size', size.toString());

            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/price-range?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async searchProducts(params: ProductSearchParams): Promise<PagedResponse<ProductSummary>> {
        try {
            const queryParams = this.buildQueryParams(params);
            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/search?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getTopSellingProducts(
        page: number = 0,
        size: number = 20,
        filters: SpecialProductFilterParams = {}
    ): Promise<PagedResponse<ProductSummary>> {
        try {
            const params = {
                ...filters,
                page,
                size,
                sortBy: 'allTimeQuantitySold',
                direction: 'desc' as const
            };
            const queryParams = this.buildQueryParams(params);

            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/top-selling?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getTopRatedProducts(
        page: number = 0,
        size: number = 20,
        filters: SpecialProductFilterParams = {}
    ): Promise<PagedResponse<ProductSummary>> {
        try {
            const params = {
                ...filters,
                page,
                size,
                sortBy: 'ratingAverage',
                direction: 'desc' as const
            };
            const queryParams = this.buildQueryParams(params);

            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/top-rated?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getNewArrivals(
        page: number = 0,
        size: number = 20,
        filters: SpecialProductFilterParams = {}
    ): Promise<PagedResponse<ProductSummary>> {
        try {
            const params = {
                ...filters,
                page,
                size,
                sortBy: 'createdAt',
                direction: 'desc' as const
            };
            const queryParams = this.buildQueryParams(params);

            const response: AxiosResponse<ApiResponse<ProductSummary[]>> = await instance.get(
                `${this.productUrl}/new-arrivals?${queryParams}`
            );

            return {
                content: handleApiResponse<ProductSummary[]>(response),
                meta: response.data.meta!
            };
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

// Export singleton instance
export const productService = new ProductService();
export default productService;