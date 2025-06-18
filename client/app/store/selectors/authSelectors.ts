// app/store/selectors/authSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { type RootState } from '~/store';

// Base selectors
const selectAuthState = (state: RootState) => state.auth;

// Basic selectors
export const selectIsLogged = createSelector(
    [selectAuthState],
    (auth) => auth.isLogged
);

export const selectToken = createSelector(
    [selectAuthState],
    (auth) => auth.token
);

export const selectUserId = createSelector(
    [selectAuthState],
    (auth) => auth.userId
);

export const selectUser = createSelector(
    [selectAuthState],
    (auth) => auth.user || null
);

export const selectAuthLoading = createSelector(
    [selectAuthState],
    (auth) => auth.loading || false
);

export const selectAuthError = createSelector(
    [selectAuthState],
    (auth) => auth.error || null
);

// Computed selectors
export const selectIsAuthenticated = createSelector(
    [selectIsLogged, selectToken],
    (isLogged, token) => isLogged && !!token
);

export const selectAuthHeaders = createSelector(
    [selectToken],
    (token) => token ? { 'Authorization': `Bearer ${token}` } : {}
);

export const selectUserInfo = createSelector(
    [selectUser, selectUserId, selectToken],
    (user, userId, token) => ({
        user,
        userId,
        token,
        isValid: !!userId && !!token
    })
);

// User profile selectors
export const selectUserProfile = createSelector(
    [selectUser],
    (user) => user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
    } : null
);

export const selectUserDisplayName = createSelector(
    [selectUser],
    (user) => user?.fullName || user?.username || 'Unknown User'
);

// Utility selectors
export const selectCanMakeRequest = createSelector(
    [selectIsAuthenticated, selectAuthLoading],
    (isAuthenticated, isLoading) => isAuthenticated && !isLoading
);

export const selectShouldRedirectToLogin = createSelector(
    [selectIsAuthenticated, selectAuthError],
    (isAuthenticated, error) => !isAuthenticated && !error
);