// ~/hooks/notifications/useNotifications.ts
import { useCallback, useEffect, useState, useRef } from 'react';
import { notificationService } from '~/api/services/notificationService';
import type { 
    NotificationEvent, 
    UserNotificationPreferences, 
    NotificationChannel,
    NotificationListData
} from '~/api/types';
import { 
    generateDeviceId, 
    onMessageListener, 
    requestNotificationPermission,
    initializeFirebaseMessaging,
    getNotificationPermissionStatus,
    isNotificationSupported,
    wasPermissionDenied,
    canRequestPermission,
    wasPermissionRequested,
    markPermissionRequested,
    getPermissionStatusText
} from '~/services/firebaseMessaging';
import type { UseNotificationsReturn } from './useNotifications.types';
import { useAuth } from '~/hooks/utils/reduxHooks';

export const useNotifications = (): UseNotificationsReturn => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permissionRequested, setPermissionRequested] = useState(false);
    const [deviceRegistered, setDeviceRegistered] = useState(false);
    
    // ✅ FIXED: Use correct types for permission state tracking
    const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);
    
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ Update permission status on mount and when it changes
    useEffect(() => {
        const updatePermissionStatus = () => {
            const status = getNotificationPermissionStatus();
            setPermissionStatus(status);
            setPermissionRequested(wasPermissionRequested());
        };

        updatePermissionStatus();

        // Listen for permission changes
        const interval = setInterval(updatePermissionStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const data: NotificationListData = await notificationService.getNotifications(50, 0);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
            setError(errorMessage);
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch preferences
    const fetchPreferences = useCallback(async () => {
        if (!isAuthenticated) {
            setPreferences(null);
            return;
        }

        try {
            const data = await notificationService.getPreferences();
            setPreferences(data);
        } catch (err) {
            console.error('Error fetching preferences:', err);
        }
    }, [isAuthenticated]);

    // Initialize notifications when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            setLoading(true);
            fetchNotifications();
            fetchPreferences();
        } else {
            // Clear state when logged out
            setNotifications([]);
            setUnreadCount(0);
            setPreferences(null);
            setLoading(false);
            setPermissionRequested(false);
            setDeviceRegistered(false);
            setError(null);
            setPermissionError(null);
        }
    }, [isAuthenticated, fetchNotifications, fetchPreferences]);

    // Setup Firebase messaging when authenticated
    useEffect(() => {
        if (!isAuthenticated || !isNotificationSupported()) {
            // Clean up Firebase listener
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            return;
        }

        const setupFirebaseMessaging = async () => {
            try {
                await initializeFirebaseMessaging();
                
                // Setup foreground message listener
                const unsubscribe = onMessageListener((payload) => {
                    console.log('📨 Received foreground message:', payload);
                    
                    // Add to notifications list immediately
                    const newNotification: NotificationEvent = {
                        id: payload.data?.notificationId || `temp_${Date.now()}`,
                        type: payload.data?.type || 'general' as any,
                        userId: payload.data?.userId || '',
                        title: payload.notification?.title || '',
                        message: payload.notification?.body || '',
                        data: payload.data || {},
                        priority: payload.data?.priority || 'normal' as any,
                        channels: ['push' as NotificationChannel],
                        isRead: false,
                        createdAt: new Date(),
                        metadata: {
                            source: 'firebase',
                            timestamp: new Date().toISOString(),
                            ...payload.data
                        }
                    };

                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show browser notification if permission granted
                    if (Notification.permission === 'granted') {
                        const notification = new Notification(payload.notification?.title || 'Thông báo mới', {
                            body: payload.notification?.body,
                            icon: '/favicon.ico',
                            badge: '/favicon.ico',
                            tag: payload.data?.notificationId,
                            requireInteraction: payload.data?.priority === 'urgent'
                        });

                        // Auto close after 5 seconds
                        setTimeout(() => {
                            notification.close();
                        }, 5000);
                    }

                    // Refresh from server after a delay to get the complete notification
                    if (refreshTimeoutRef.current) {
                        clearTimeout(refreshTimeoutRef.current);
                    }
                    refreshTimeoutRef.current = setTimeout(() => {
                        fetchNotifications();
                    }, 2000);
                });

                unsubscribeRef.current = unsubscribe;
            } catch (error) {
                console.error('❌ Error setting up Firebase messaging:', error);
                setError('Failed to setup push notifications');
            }
        };

        setupFirebaseMessaging();

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };
    }, [isAuthenticated, fetchNotifications]);

    // ✅ IMPROVED: Better permission request handling
    const requestPermission = useCallback(async () => {
        if (!isAuthenticated || !isNotificationSupported()) {
            console.log('🚫 Cannot request permission: not authenticated or not supported');
            return;
        }

        // Check if permission was already denied
        if (wasPermissionDenied()) {
            const error = 'Thông báo đã bị tắt. Vui lòng bật trong cài đặt trình duyệt.';
            setPermissionError(error);
            console.log('🚫 Permission was denied:', error);
            return;
        }

        // Check if we can request permission
        if (!canRequestPermission()) {
            console.log('🚫 Cannot request permission: already granted or denied');
            return;
        }

        setIsRequestingPermission(true);
        setPermissionError(null);

        try {
            console.log('🔔 Requesting notification permission...');
            markPermissionRequested();
            setPermissionRequested(true);
            
            const token = await requestNotificationPermission();
            
            if (token) {
                const deviceId = generateDeviceId();
                console.log('📱 Registering device with token...');
                
                await notificationService.registerDevice({
                    token,
                    platform: 'web',
                    deviceId
                });
                
                setDeviceRegistered(true);
                setPermissionStatus('granted');
                console.log('✅ Device registered successfully');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to register for notifications';
            setPermissionError(errorMessage);
            console.error('❌ Error requesting permission:', err);
            
            // Update permission status
            setPermissionStatus(getNotificationPermissionStatus());
        } finally {
            setIsRequestingPermission(false);
        }
    }, [isAuthenticated]);

    // Mark as read
    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            setError('Failed to mark notification as read');
            console.error('Error marking as read:', err);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (err) {
            setError('Failed to mark all notifications as read');
            console.error('Error marking all as read:', err);
        }
    }, []);

    // Delete notification
    const deleteNotification = useCallback(async (id: string) => {
        try {
            await notificationService.deleteNotification(id);
            const notification = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            
            if (notification && !notification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            setError('Failed to delete notification');
            console.error('Error deleting notification:', err);
        }
    }, [notifications]);

    // Update preferences
    const updatePreferences = useCallback(async (updates: Partial<UserNotificationPreferences>) => {
        try {
            const updated = await notificationService.updatePreferences(updates);
            setPreferences(updated);
        } catch (err) {
            setError('Failed to update preferences');
            console.error('Error updating preferences:', err);
        }
    }, []);

    // Send test notification
    const sendTestNotification = useCallback(async () => {
        try {
            await notificationService.sendTestNotification();
            console.log('🧪 Test notification sent');
            // Refresh notifications after test
            setTimeout(fetchNotifications, 3000);
        } catch (err) {
            setError('Failed to send test notification');
            console.error('Error sending test notification:', err);
        }
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        preferences,
        loading,
        error,
        refreshNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        requestPermission,
        updatePreferences,
        sendTestNotification,
        permissionRequested,
        deviceRegistered,
        
        notificationSupported: isNotificationSupported(),
        permissionStatus,
        permissionError,
        isRequestingPermission,
        permissionStatusText: getPermissionStatusText(),
        canRequestPermission: canRequestPermission(),
        wasPermissionDenied: wasPermissionDenied(),
    };
};