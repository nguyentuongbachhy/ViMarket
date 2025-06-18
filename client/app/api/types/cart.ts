import type { ApiResponse } from './common';
import type { ProductSummary } from './product';

// Cart Types
export interface CartItem {
    productId: string;
    quantity: number;
    addedAt: Date;
    updatedAt: Date;
}

export interface CartItemWithProduct extends CartItem {
    product: ProductSummary;
    totalPrice: number;
}

export interface Pricing {
    subtotal: number,
    tax: number,
    shipping: number,
    discount: number,
    total: number,
    currency: string,
    taxRate: number,
    freeShippingThreshold: number,
    itemCount: number
}

export interface Cart {
    userId: string;
    items: CartItemWithProduct[];
    pricing: Pricing;
    totalItems: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
}

export interface UpdateCartItemRequest {
    quantity: number;
}

export interface CartItemCount {
    count: number;
}

export interface CartItemValidation {
    isValid: boolean;
    error?: string;
    product?: ProductSummary;
}

// Cart API Responses
export interface CartResponse extends ApiResponse<Cart> { }
export interface CartItemCountResponse extends ApiResponse<CartItemCount> { }
export interface EmptyCartResponse extends ApiResponse<null> { }