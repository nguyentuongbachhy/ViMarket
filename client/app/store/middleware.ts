import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { type AppDispatch, type RootState } from '~/store';
import { loginAsync, logoutAsync, refreshTokenAsync } from './slices/authSlice';

// Create listener middleware for side effects
export const listenerMiddleware = createListenerMiddleware();

// Biến để track timeout
let refreshTimeoutId: NodeJS.Timeout | null = null;

// Auto token refresh middleware - CHỈ SET MỘT LẦN
listenerMiddleware.startListening({
    matcher: isAnyOf(loginAsync.fulfilled),
    effect: async (action, listenerApi) => {
        // Clear timeout cũ nếu có
        if (refreshTimeoutId) {
            clearTimeout(refreshTimeoutId);
            refreshTimeoutId = null;
        }

        // Set timeout mới - 50 phút
        const refreshTimeout = 50 * 60 * 1000; // 50 minutes

        refreshTimeoutId = setTimeout(() => {
            const state = listenerApi.getState() as RootState;
            if (state.auth.isLogged && state.auth.token) {
                console.log('Auto refreshing token...');
                (listenerApi.dispatch as AppDispatch)(refreshTokenAsync());
            }
            refreshTimeoutId = null;
        }, refreshTimeout);

        console.log('Token refresh scheduled for 50 minutes');
    }
});

// Clear timeout khi logout
listenerMiddleware.startListening({
    matcher: isAnyOf(logoutAsync.fulfilled, logoutAsync.rejected),
    effect: async () => {
        if (refreshTimeoutId) {
            clearTimeout(refreshTimeoutId);
            refreshTimeoutId = null;
            console.log('Token refresh timeout cleared');
        }
    }
});

// Handle API errors middleware
export const apiErrorMiddleware = (store: any) => (next: any) => (action: any) => {
    // Handle 401 errors globally - NHƯNG TRÁNH LOOP
    if (action.type.endsWith('/rejected') &&
        action.payload?.includes('401') &&
        !action.type.includes('refreshToken') &&
        !action.type.includes('logout')) {
        console.log('401 error detected, logging out...');
        store.dispatch(logoutAsync());
    }

    return next(action);
};

// Logger middleware for development
export const loggerMiddleware = (store: any) => (next: any) => (action: any) => {
    if (import.meta.env.NODE_ENV === 'development') {
        console.group(`Action: ${action.type}`);
        console.log('Previous State:', store.getState());
        console.log('Action:', action);
        const result = next(action);
        console.log('Next State:', store.getState());
        console.groupEnd();
        return result;
    }
    return next(action);
};

// Local storage sync middleware
export const localStorageSyncMiddleware = (store: any) => (next: any) => (action: any) => {
    const result = next(action);

    // Sync certain actions with localStorage
    if (action.type === 'auth/login' || action.type === 'auth/updateToken') {
        console.log('Syncing auth state to localStorage');
    }

    return result;
};

// Network status middleware
export const networkMiddleware = (store: any) => (next: any) => (action: any) => {
    // Handle network-related actions
    if (action.type.includes('async') && action.type.endsWith('/rejected')) {
        if (action.payload?.includes('Network error') || action.payload?.includes('Failed to fetch')) {
            console.warn('Network error detected:', action.payload);
        }
    }

    return next(action);
};