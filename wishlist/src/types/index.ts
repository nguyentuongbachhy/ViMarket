export interface WishlistItem {
    id: string;
    userId: string;
    productId: string;
    productName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductInfo {
    id: string;
    name: string;
    inventoryStatus: string;
}

export interface WishlistResponse {
    items: WishlistItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface WishlistItemValidation {
    isValid: boolean;
    error?: string;
    product?: ProductInfo;
}

export interface AddToWishlistRequest {
    productId: string;
}

export interface User {
    id: string;
    email?: string;
    name?: string;
}

export interface JwtPayload {
    sub?: string;
    nameid?: string;
    unique_name?: string;
    email?: string;
    role?: string | string[];
    iss?: string;
    aud?: string;
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