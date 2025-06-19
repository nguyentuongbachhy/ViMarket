export { default as apiClient, handleApiError, handleApiResponse } from '~/api/axios';

export * from './types';

export { authService, AuthService } from '~/api/services/authService';
export { brandService, BrandService } from '~/api/services/brandService';
export { cartService, CartService } from '~/api/services/cartService';
export { categoryService, CategoryService } from '~/api/services/categoryService';
export { orderService, OrderService } from '~/api/services/orderService';
export { productService, ProductService } from '~/api/services/productService';
export { reviewService, ReviewService } from '~/api/services/reviewService';
export { wishlistService, WishlistService } from '~/api/services/wishlistService';
export { notificationService, NotificationService } from '~/api/services/notificationService';

import { authService } from '~/api/services/authService';
import { brandService } from '~/api/services/brandService';
import { cartService } from '~/api/services/cartService';
import { categoryService } from '~/api/services/categoryService';
import { chatService } from '~/api/services/chatService';
import { orderService } from '~/api/services/orderService';
import { productService } from '~/api/services/productService';
import { reviewService } from '~/api/services/reviewService';
import { wishlistService } from '~/api/services/wishlistService';
import { notificationService } from '~/api/services/notificationService';
import instance, { handleApiError } from './axios';

export class ApiClient {
    constructor() { }

    get auth() {
        return authService;
    }

    get products() {
        return productService;
    }

    get categories() {
        return categoryService;
    }

    get chat() {
        return chatService;
    }

    get brands() {
        return brandService;
    }

    get cart() {
        return cartService;
    }

    get wishlist() {
        return wishlistService
    }

    get orders() {
        return orderService
    }

    get reviews() {
        return reviewService;
    }

    get notifications() {
        return notificationService;
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await instance.get('/health');
            return response.status === 200;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

export const api = new ApiClient();

export default api;

export const ApiUtils = {
    formatErrorMessage: (error: any): string => {
        return handleApiError(error);
    },

    isNetworkError: (error: any): boolean => {
        return !error.response && error.code === 'NETWORK_ERROR';
    },

    isAuthError: (error: any): boolean => {
        return error.response?.status === 401 || error.response?.status === 403;
    },

    isClientError: (error: any): boolean => {
        const status = error.response?.status;
        return status >= 400 && status < 500;
    },

    isServerError: (error: any): boolean => {
        const status = error.response?.status;
        return status >= 500 && status < 600;
    },

    retryRequest: async <T>(
        requestFn: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 1000
    ): Promise<T> => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;

                if (!ApiUtils.isNetworkError(error) && !ApiUtils.isServerError(error)) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
        throw new Error('Max retries exceeded');
    },

    buildQueryString: (params: Record<string, any>): string => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, String(item)));
                } else {
                    searchParams.append(key, String(value));
                }
            }
        });

        return searchParams.toString();
    },

    parsePaginationHeaders: (headers: any) => {
        return {
            total: parseInt(headers['x-total-count'] || '0'),
            page: parseInt(headers['x-current-page'] || '0'),
            size: parseInt(headers['x-page-size'] || '20'),
            totalPages: parseInt(headers['x-total-pages'] || '0'),
        };
    },
};