// ~/api/types/order.ts
import type { ApiResponse } from './common';

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

export const mappingOrderStatus: Record<string, OrderStatus> = {
    "pending": OrderStatus.PENDING,
    "confirmed": OrderStatus.CONFIRMED,
    "shipped": OrderStatus.SHIPPED,
    "delivered": OrderStatus.DELIVERED,
    "cancelled": OrderStatus.CANCELLED
};

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed'
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    imageUrl: string;
    price: number;
    quantity: number;
    totalPrice: number;
}

export interface Order {
    id: string;
    userId: string;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    shippingAddress: Address;
    items: OrderItem[];
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CheckoutRequest {
    useCart?: boolean;
    items?: Array<{
        productId: string;
        quantity: number;
    }>;
    shippingAddress: Address;
    paymentMethod: string;
    notes?: string;
}

export interface CreateOrderRequest {
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    shippingAddress: Address;
    paymentMethod: string;
    notes?: string;
}

export interface CreateOrderFromCartRequest {
    shippingAddress: Address;
    paymentMethod: string;
    notes?: string;
}

export interface GetOrdersParams {
    limit?: number;
}

export interface PurchaseCheckResponse {
    hasPurchased: boolean;
    productId: string;
    userId: string;
}

export interface OrderResponse extends ApiResponse<Order> { }
export interface OrderListResponse extends ApiResponse<Order[]> { }