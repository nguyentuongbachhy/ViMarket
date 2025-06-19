// ~/hooks/notifications/useNotifications.types.ts
import type { NotificationEvent, UserNotificationPreferences } from '~/api/types';

export interface UseNotificationsState {
    notifications: NotificationEvent[];
    unreadCount: number;
    preferences: UserNotificationPreferences | null;
    loading: boolean;
    error: string | null;
    permissionRequested: boolean;
    deviceRegistered: boolean;
    notificationSupported: boolean;
    permissionStatus: NotificationPermission;
    
    // ✅ NEW: Additional permission state
    permissionError: string | null;
    isRequestingPermission: boolean;
    permissionStatusText: string;
    canRequestPermission: boolean;
    wasPermissionDenied: boolean;
}

export interface UseNotificationsActions {
    refreshNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    requestPermission: () => Promise<void>;
    updatePreferences: (updates: Partial<UserNotificationPreferences>) => Promise<void>;
    sendTestNotification: () => Promise<void>;
}

export interface UseNotificationsReturn extends UseNotificationsState, UseNotificationsActions {}