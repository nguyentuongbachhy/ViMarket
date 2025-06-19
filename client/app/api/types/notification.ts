// app/api/types/notification.ts
import type { ApiResponse } from './common';

export interface DeviceToken {
    userId: string;
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId: string;
    isActive: boolean;
    lastUsed: Date;
    createdAt: Date;
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
    isRead: boolean; // ✅ Đảm bảo có field này
    createdAt: Date;
    metadata: {
        source: string;
        productId?: string;
        orderId?: string;
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
    CART_ITEM_ADDED = 'cart.item.added'
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

// ✅ THÊM CÁC INTERFACE MỚI
export interface NotificationPagination {
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface NotificationListData {
    notifications: NotificationEvent[];
    unreadCount: number;
    pagination: NotificationPagination;
}

export interface NotificationListResponse extends ApiResponse<NotificationListData> {}
export interface NotificationPreferencesResponse extends ApiResponse<UserNotificationPreferences> {}
export interface DeviceListResponse extends ApiResponse<Omit<DeviceToken, 'token'>[]> {}

// ✅ THÊM RESPONSE TYPE CHO MARK AS READ, DELETE
export interface NotificationActionResponse extends ApiResponse<null> {}