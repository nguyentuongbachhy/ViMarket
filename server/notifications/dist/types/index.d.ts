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
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
        email?: string;
        roles: string[];
    };
}
export interface NotificationEvent {
    id: string;
    type: NotificationEventType;
    userId: string;
    title: string;
    message: string;
    data: Record<string, any>;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    metadata: {
        source: string;
        productId?: string;
        orderId?: string;
        cartId?: string;
        eventId?: string;
        timestamp: string;
    };
}
export declare enum NotificationEventType {
    WISHLIST_PRODUCT_PRICE_CHANGED = "wishlist.product.price.changed",
    WISHLIST_PRODUCT_RESTOCKED = "wishlist.product.restocked",
    CART_ITEM_LOW_STOCK = "cart.item.low.stock",
    CART_ABANDONED = "cart.abandoned",
    INVENTORY_LOW_STOCK = "inventory.low.stock",
    PRODUCT_BACK_IN_STOCK = "product.back.in.stock"
}
export declare enum NotificationPriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum NotificationChannel {
    PUSH = "push",
    EMAIL = "email",
    SMS = "sms",
    IN_APP = "in_app"
}
export interface UserNotificationPreferences {
    userId: string;
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    channels: {
        [key in NotificationEventType]?: NotificationChannel[];
    };
    quietHours: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone: string;
    };
    frequency: {
        maxPerDay: number;
        batchDelay: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface DeviceToken {
    userId: string;
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId: string;
    isActive: boolean;
    lastUsed: Date;
    createdAt: Date;
}
export interface NotificationHistory {
    id: string;
    userId: string;
    type: NotificationEventType;
    title: string;
    message: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    channels: NotificationChannel[];
    sentAt: Date;
    readAt?: Date;
    metadata: Record<string, any>;
}
export interface WishlistUpdatedEvent {
    eventId: string;
    userId: string;
    productId: string;
    action: 'added' | 'removed';
    productInfo: {
        name: string;
        price: number;
        imageUrl?: string;
        inventoryStatus: string;
    };
    timestamp: string;
}
export interface InventoryUpdatedEvent {
    eventId: string;
    productId: string;
    productName: string;
    oldQuantity: number;
    newQuantity: number;
    quantityChange: number;
    oldStatus: string;
    newStatus: string;
    operationType: string;
    referenceId: string;
    reason: string;
    timestamp: string;
    lowStockThreshold?: number;
}
export interface CartUpdatedEvent {
    eventId: string;
    userId: string;
    cartId?: string;
    action: 'item_added' | 'item_updated' | 'item_removed' | 'abandoned';
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
        availableQuantity: number;
    }>;
    timestamp: string;
    abandonedAt?: string;
}
export interface ProductPriceChangedEvent {
    eventId: string;
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    changePercentage: number;
    effectiveDate: string;
    timestamp: string;
}
export interface RegisterDeviceRequest {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId: string;
}
export interface UpdatePreferencesRequest {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    channels?: Partial<UserNotificationPreferences['channels']>;
    quietHours?: UserNotificationPreferences['quietHours'];
    frequency?: UserNotificationPreferences['frequency'];
}
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    code: number;
    message: string;
    data?: T;
    timestamp: string;
    meta?: any;
}
export { Request } from 'express';
//# sourceMappingURL=index.d.ts.map