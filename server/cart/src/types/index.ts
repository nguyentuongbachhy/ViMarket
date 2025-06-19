// types/index.ts
export interface CartItem {
    productId: string;
    quantity: number;
    addedAt: Date;
    updatedAt: Date;
}

export interface CartPricing {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;
    taxRate: number;
    freeShippingThreshold: number;
    itemCount: number;
}

export interface Cart {
    userId: string;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

export interface BrandInfo {
    id: string;
    name: string;
    slug?: string;
    countryOfOrigin?: string;
}

export interface ImageInfo {
    id: string;
    url: string;
    position: number;
}

export interface CartExpirationEvent {
    eventId: string;
    userId: string;
    cartId: string;
    expiresAt: string;
    daysUntilExpiration: number;
    itemCount: number;
    totalValue: number;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    timestamp: string;
}
export interface CartExpirationItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

export interface CartItemAddedEvent {
    eventId: string;
    userId: string;
    cartId: string;
    productId: string;
    productName: string;
    productPrice: number;
    productImage?: string;
    quantity: number;
    totalCartItems: number;
    totalCartValue: number;
    timestamp: string;
}
export interface CategoryInfo {
    id: string;
    name: string;
    url?: string;
    parentId?: string;
    level?: number;
}

export interface ProductSummary {
    id: string;
    name: string;
    shortDescription: string;
    price: number;
    originalPrice?: number;
    ratingAverage?: number;
    reviewCount?: number;
    inventoryStatus: string;
    quantitySold?: number;
    brand?: BrandInfo;
    images?: ImageInfo[];
    categories?: CategoryInfo[];
}

export interface CartItemWithProduct extends CartItem {
    product: ProductSummary;
    totalPrice: number;
    isAvailable: boolean;
    availableQuantity: number;
}

export interface CartWithProducts {
    userId: string;
    items: CartItemWithProduct[];
    totalItems: number;
    pricing: CartPricing;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

export interface JwtPayload {
    sub: string;
    nameid: string;
    unique_name: string;
    role?: string | string[];
    iss: string;
    aud: string;
    exp: number;
    iat: number;
}

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    code: number;
    message: string;
    data?: T;
    timestamp: string;
    meta?: any;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
}

export interface UpdateCartItemRequest {
    quantity: number;
}

export interface CartItemValidation {
    isValid: boolean;
    error?: string;
    product?: ProductSummary;
    availableQuantity?: number;
}

export interface CartValidationResult {
    isValid: boolean;
    errors: string[];
    invalidItems: string[];
}

export interface GuestCartItem {
    productId: string;
    quantity: number;
}