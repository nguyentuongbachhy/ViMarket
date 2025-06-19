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

// Notification types
export interface NotificationEvent {
    id: string;
    type: NotificationEventType;
    userId: string;
    title: string;
    message: string;
    data: Record<string, any>;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    isRead: boolean;
    createdAt: Date;
    metadata: {
        source: string;
        productId?: string;
        orderId?: string;
        oldStatus?: string;
        newStatus?: string;
        cartId?: string;
        eventId?: string;
        timestamp: string;
    };
}
export enum NotificationEventType {
    WISHLIST_PRODUCT_PRICE_CHANGED = 'wishlist.product.price.changed',
    WISHLIST_PRODUCT_RESTOCKED = 'wishlist.product.restocked',
    CART_ITEM_LOW_STOCK = 'cart.item.low.stock',
    CART_ABANDONED = 'cart.abandoned',
    INVENTORY_LOW_STOCK = 'inventory.low.stock',
    PRODUCT_BACK_IN_STOCK = 'product.back.in.stock',
    CART_EXPIRATION_REMINDER = 'cart.expiration.reminder',
    CART_ITEM_ADDED = 'cart.item.added',
    ORDER_CREATED = 'order.created',
    ORDER_CONFIRMED = 'order.confirmed',
    ORDER_SHIPPED = 'order.shipped',
    ORDER_DELIVERED = 'order.delivered',
    ORDER_CANCELLED = 'order.cancelled',
}

export enum NotificationPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum NotificationChannel {
    PUSH = 'push',
    EMAIL = 'email',
    SMS = 'sms',
    IN_APP = 'in_app',
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
        startTime: string; // HH:mm format
        endTime: string;   // HH:mm format
        timezone: string;
    };
    frequency: {
        maxPerDay: number;
        batchDelay: number; // minutes
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

// Kafka Event Types
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

// API Request Types
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

export interface OrderCreatedEvent {
    eventId: string;
    orderId: string;
    userId: string;
    userEmail: string;
    orderStatus: string;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    items: Array<{
        productId: string;
        productName: string;
        imageUrl?: string;
        quantity: number;
        price: number;
        totalPrice: number;
    }>;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    timestamp: string;
}

export interface OrderStatusUpdatedEvent {
    eventId: string;
    orderId: string;
    userId: string;
    userEmail: string;
    oldStatus: string;
    newStatus: string;
    totalAmount: number;
    items: Array<{
        productId: string;
        productName: string;
        imageUrl?: string;
        quantity: number;
        price: number;
    }>;
    updatedBy?: string; // Admin user ID if updated by admin
    timestamp: string;
}

export interface OrderCancelledEvent {
    eventId: string;
    orderId: string;
    userId: string;
    userEmail: string;
    reason: string;
    totalAmount: number;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    cancelledBy?: string; // User ID or Admin ID
    timestamp: string;
}

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    code: number;
    message: string;
    data?: T;
    timestamp: string;
    meta?: any;
}

// Export Request from express for proper type extension
export { Request } from 'express';
