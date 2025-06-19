// ~/api/services/orderService.ts
import { type AxiosResponse } from 'axios';
import instance, { handleApiError, handleApiResponse } from '~/api/axios';
import type {
    ApiResponse,
    CheckoutRequest,
    CreateOrderFromCartRequest,
    CreateOrderRequest,
    GetOrdersParams,
    Order,
    PurchaseCheckResponse
} from '~/api/types';

export class OrderService {
    private readonly baseUrl = '/orders';

    // ✅ Checkout - Main endpoint
    async checkout(request: CheckoutRequest): Promise<Order> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.post(
                `${this.baseUrl}/checkout`,
                request
            );
            return handleApiResponse<Order>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ Create order from items
    async createOrder(request: CreateOrderRequest): Promise<Order> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.post(
                `${this.baseUrl}/create`,
                request
            );
            return handleApiResponse<Order>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ Create order from cart
    async createOrderFromCart(request: CreateOrderFromCartRequest): Promise<Order> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.post(
                `${this.baseUrl}/from-cart`,
                request
            );
            return handleApiResponse<Order>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ Get user orders
    async getUserOrders(params?: GetOrdersParams): Promise<Order[]> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) queryParams.append('limit', params.limit.toString());

            const url = `${this.baseUrl}/my-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response: AxiosResponse<ApiResponse<Order[]>> = await instance.get(url);
            return handleApiResponse<Order[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ Get users orders
    async getOrders(): Promise<Order[]> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.get(
                `${this.baseUrl}/my-orders`
            );
            return handleApiResponse<Order[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ Get order by ID
    async getOrderById(orderId: string): Promise<Order> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.get(
                `${this.baseUrl}/${orderId}`
            );
            return handleApiResponse<Order>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    // ✅ Cancel order
    async cancelOrder(orderId: string): Promise<Order> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.post(
                `${this.baseUrl}/${orderId}/cancel`
            );
            return handleApiResponse<Order>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async checkUserPurchase(productId: string): Promise<PurchaseCheckResponse> {
        try {
            const response: AxiosResponse<ApiResponse<PurchaseCheckResponse>> =
                await instance.get(`${this.baseUrl}/check-purchase/${productId}`);
            return handleApiResponse<PurchaseCheckResponse>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getAllOrders(params: { page?: number; limit?: number; status?: string } = {}): Promise<{
        orders: Order[];
        total: number;
        totalPages: number;
        currentPage: number;
    }> {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.status) queryParams.append('status', params.status);

            const url = `/orders-admin/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response: AxiosResponse<ApiResponse<{
                orders: Order[];
                total: number;
                totalPages: number;
                currentPage: number;
            }>> = await instance.get(url);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async updateOrderStatus(orderId: string, status: string): Promise<Order> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.patch(
                `/orders-admin/orders/${orderId}/status`,
                { status }
            );
            return handleApiResponse<Order>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getOrderByIdAdmin(orderId: string): Promise<Order> {
        try {
            const response: AxiosResponse<ApiResponse<Order>> = await instance.get(
                `/orders-admin/orders/${orderId}`
            );
            return handleApiResponse<Order>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getOrderStats(): Promise<{
        total: number;
        pending: number;
        confirmed: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        totalRevenue: number;
        averageOrderValue: number;
    }> {
        try {
            const response: AxiosResponse<ApiResponse<{
                total: number;
                pending: number;
                confirmed: number;
                shipped: number;
                delivered: number;
                cancelled: number;
                totalRevenue: number;
                averageOrderValue: number;
            }>> = await instance.get(`/orders-admin/orders/stats`);
            return handleApiResponse(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async printOrder(orderId: string): Promise<Blob> {
        try {
            const response = await instance.get(`/orders-admin/orders/${orderId}/print`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async exportOrders(params: {
        status?: string;
        dateFrom?: string;
        dateTo?: string;
        format?: 'excel' | 'pdf';
    }): Promise<Blob> {
        try {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
            if (params.dateTo) queryParams.append('dateTo', params.dateTo);
            if (params.format) queryParams.append('format', params.format);

            const response = await instance.get(`/orders-admin/orders/export?${queryParams.toString()}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async sendOrderEmail(orderId: string, type: 'confirmation' | 'status_update'): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<void>> = await instance.post(
                `/orders-admin/orders/${orderId}/send-email`,
                { type }
            );
            return handleApiResponse<void>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
}

export const orderService = new OrderService();
export default orderService;