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

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed'
}

// Chỉ 2 request types cần thiết
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

export interface JwtPayload {
    sub: string;
    nameid: string;
    unique_name: string;
    email: string;
    role?: string | string[];
    iss: string;
    aud: string;
    exp: number;
    iat: number;
}

export interface CheckoutRequest {
    useCart?: boolean;
    items?: Array<{
        productId: string;
        quantity: number;
    }>;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod: string;
    notes?: string;
}

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    code: number;
    message: string;
    data?: T;
    timestamp: string;
    meta?: any;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
        email: string;
        roles: string[];
    };
}