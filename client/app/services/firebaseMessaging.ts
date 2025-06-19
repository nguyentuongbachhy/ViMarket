import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { initializeApp, type FirebaseApp } from 'firebase/app';

// Firebase config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let isInitialized = false;

// ✅ FIXED: Create custom permission status type
export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';
export type NotificationSupportStatus = 'supported' | 'unsupported';

export const isNotificationSupported = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermissionStatus = (): NotificationPermissionStatus => {
    if (!isNotificationSupported()) return 'default'; // Return default instead of unsupported
    return Notification.permission as NotificationPermissionStatus;
};

export const getNotificationSupportStatus = (): NotificationSupportStatus => {
    return isNotificationSupported() ? 'supported' : 'unsupported';
};

// ✅ FIXED: Check if permission was previously denied
export const wasPermissionDenied = (): boolean => {
    if (!isNotificationSupported()) return false;
    return getNotificationPermissionStatus() === 'denied';
};

// ✅ FIXED: Check if we can request permission
export const canRequestPermission = (): boolean => {
    if (!isNotificationSupported()) return false;
    const status = getNotificationPermissionStatus();
    return status === 'default'; // Only allow request if it's default (not denied or granted)
};

export const initializeFirebaseMessaging = async (): Promise<void> => {
    if (isInitialized || !isNotificationSupported()) {
        return;
    }

    try {
        console.log('🔥 Initializing Firebase Messaging...');
        
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        
        isInitialized = true;
        console.log('✅ Firebase Messaging initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Messaging:', error);
        throw error;
    }
};

// ✅ IMPROVED: Better permission request with detailed feedback
export const requestNotificationPermission = async (): Promise<string | null> => {
    if (!isNotificationSupported()) {
        console.warn('⚠️ Notifications not supported in this browser');
        throw new Error('Notifications not supported in this browser');
    }

    if (!messaging) {
        await initializeFirebaseMessaging();
    }

    if (!messaging) {
        throw new Error('Failed to initialize Firebase Messaging');
    }

    const currentPermission = getNotificationPermissionStatus();
    console.log('📋 Current permission status:', currentPermission);

    // ✅ Handle different permission states
    switch (currentPermission) {
        case 'denied':
            console.warn('🚫 Notification permission was denied');
            throw new Error('Notification permission was denied. Please enable notifications in your browser settings.');
            
        case 'granted':
            console.log('✅ Notification permission already granted');
            break;
            
        case 'default':
            console.log('❓ Requesting notification permission...');
            try {
                const permission = await Notification.requestPermission();
                console.log('📋 Permission request result:', permission);
                
                if (permission !== 'granted') {
                    throw new Error('Notification permission was not granted');
                }
            } catch (error) {
                console.error('❌ Failed to request permission:', error);
                throw new Error('Failed to request notification permission');
            }
            break;
    }

    // ✅ Get FCM token with better error handling
    try {
        console.log('🔑 Getting FCM token...');
        const token = await getToken(messaging, { vapidKey });
        
        if (!token) {
            throw new Error('Failed to get FCM token');
        }
        
        console.log('✅ FCM token obtained successfully:', token.substring(0, 20) + '...');
        return token;
    } catch (error) {
        console.error('❌ Failed to get FCM token:', error);
        
        // ✅ Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('messaging/permission-blocked')) {
                throw new Error('Notifications are blocked. Please enable them in your browser settings.');
            } else if (error.message.includes('messaging/vapid-key-required')) {
                throw new Error('VAPID key configuration error');
            } else if (error.message.includes('messaging/token-unsubscribe-failed')) {
                throw new Error('Failed to unsubscribe from previous token');
            }
        }
        
        throw new Error('Failed to get notification token. Please try again.');
    }
};

// ✅ IMPROVED: Better message listener
export const onMessageListener = (callback: (payload: any) => void): (() => void) => {
    if (!messaging) {
        console.warn('⚠️ Messaging not initialized for message listener');
        return () => {};
    }

    console.log('👂 Setting up foreground message listener...');
    
    const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📨 Foreground message received:', payload);
        callback(payload);
    });

    return unsubscribe;
};

// ✅ NEW: Generate consistent device ID
export const generateDeviceId = (): string => {
    const stored = localStorage.getItem('fcm_device_id');
    if (stored) return stored;
    
    const deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('fcm_device_id', deviceId);
    return deviceId;
};

// ✅ NEW: Reset notification permissions (for testing)
export const resetNotificationState = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('fcm_device_id');
        localStorage.removeItem('notification_permission_requested');
        console.log('🔄 Notification state reset');
    }
};

// ✅ NEW: Check if permission was requested before
export const wasPermissionRequested = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('notification_permission_requested') === 'true';
};

// ✅ NEW: Mark permission as requested
export const markPermissionRequested = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('notification_permission_requested', 'true');
    }
};

// ✅ FIXED: Get user-friendly permission status
export const getPermissionStatusText = (): string => {
    if (!isNotificationSupported()) {
        return 'Không hỗ trợ';
    }
    
    const status = getNotificationPermissionStatus();
    switch (status) {
        case 'granted':
            return 'Đã bật thông báo';
        case 'denied':
            return 'Đã tắt thông báo';
        case 'default':
            return 'Chưa được yêu cầu';
        default:
            return 'Không xác định';
    }
};