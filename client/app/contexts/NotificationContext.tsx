// ~/contexts/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useNotifications } from '~/hooks/notifications/useNotifications';
import type { UseNotificationsReturn } from '~/hooks/notifications/useNotifications.types';
import { useAuth } from '~/hooks/utils/reduxHooks';

interface NotificationContextType extends UseNotificationsReturn {}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const notifications = useNotifications();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const permissionRequestedRef = useRef(false);

    // Auto-refresh notifications every 30 seconds for logged users
    useEffect(() => {
        if (!isAuthenticated) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            permissionRequestedRef.current = false;
            return;
        }

        // Request permission once when user logs in
        if (!permissionRequestedRef.current && notifications.notificationSupported) {
            permissionRequestedRef.current = true;
            
            // Delay permission request to avoid blocking login process
            setTimeout(() => {
                notifications.requestPermission();
            }, 2000);
        }

        // Setup polling for new notifications
        intervalRef.current = setInterval(() => {
            notifications.refreshNotifications();
        }, 30000); // 30 seconds

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isAuthenticated, notifications.requestPermission, notifications.refreshNotifications, notifications.notificationSupported]);

    return (
        <NotificationContext.Provider value={notifications}>
            {children}
        </NotificationContext.Provider>
    );
};