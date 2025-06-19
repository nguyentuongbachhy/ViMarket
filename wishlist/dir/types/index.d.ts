export interface User {
    id: string;
    email?: string;
    name?: string;
}
export interface WishlistItem {
    id: string;
    userId: string;
    productId: string;
    productName?: string;
    productPrice?: number;
    productImage?: string;
    categoryId?: string;
    brandId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProductInfo {
    id: string;
    name: string;
    price: number;
    image?: string;
    categoryId?: string;
    brandId?: string;
    inventoryStatus: string;
}
export interface WishlistPriceRequest {
    requestId: string;
    userId: string;
    productIds: string[];
    timestamp: string;
    source: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}
export interface JwtPayload {
    sub: string;
    email?: string;
    name?: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
//# sourceMappingURL=index.d.ts.map