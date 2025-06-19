import { type AxiosResponse } from 'axios';
import instance, { handleApiError, handleApiResponse } from '~/api/axios';
import type {
    AddToCartRequest,
    ApiResponse,
    Cart,
    CartItemCount,
    UpdateCartItemRequest
} from '~/api/types';

export class CartService {
    private readonly cartUrl = '/cart';

    async getCart(): Promise<Cart | null> {
        try {
            const response: AxiosResponse<ApiResponse<Cart>> = await instance.get(this.cartUrl);
            return handleApiResponse<Cart | null>(response);
        } catch (error) {
            if (typeof error === 'object' && error !== null && 'response' in error && (error as any).response?.status === 404) {
                return null;
            }
            throw new Error(handleApiError(error));
        }
    }

    async addToCart(request: AddToCartRequest): Promise<Cart> {
        try {
            const response: AxiosResponse<ApiResponse<Cart>> = await instance.post(
                `${this.cartUrl}/items`,
                request
            );
            return handleApiResponse<Cart>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async updateCartItem(productId: string, request: UpdateCartItemRequest): Promise<Cart | null> {
        try {
            const response: AxiosResponse<ApiResponse<Cart>> = await instance.put(
                `${this.cartUrl}/items/${productId}`,
                request
            );
            return handleApiResponse<Cart | null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async removeFromCart(productId: string): Promise<Cart | null> {
        try {
            const response: AxiosResponse<ApiResponse<Cart>> = await instance.delete(
                `${this.cartUrl}/items/${productId}`
            );
            return handleApiResponse<Cart | null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async clearCart(): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<null>> = await instance.delete(this.cartUrl);
            handleApiResponse<null>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getCartItemCount(): Promise<number> {
        try {
            const response: AxiosResponse<ApiResponse<CartItemCount>> = await instance.get(
                `${this.cartUrl}/count`
            );
            const result = handleApiResponse<CartItemCount>(response);
            return result.count;
        } catch (error) {
            console.warn('Failed to get cart item count:', handleApiError(error));
            return 0;
        }
    }

    async addMultipleItems(items: AddToCartRequest[]): Promise<Cart> {
        let cart: Cart | null = null;

        for (const item of items) {
            cart = await this.addToCart(item);
        }

        if (!cart) {
            throw new Error('Failed to add items to cart');
        }

        return cart;
    }

    async isProductInCart(productId: string): Promise<boolean> {
        try {
            const cart = await this.getCart();
            return cart?.items.some(item => item.productId === productId) || false;
        } catch (error) {
            return false;
        }
    }

    async getProductQuantityInCart(productId: string): Promise<number> {
        try {
            const cart = await this.getCart();
            const item = cart?.items.find(item => item.productId === productId);
            return item?.quantity || 0;
        } catch (error) {
            return 0;
        }
    }
}

export const cartService = new CartService();
export default cartService;