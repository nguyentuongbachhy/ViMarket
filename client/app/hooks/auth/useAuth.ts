// app/hooks/auth/useAuth.ts
import { useCallback } from 'react';
import type {
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UserInfo
} from '~/api/types';
import { useAppDispatch, useAppSelector } from '~/hooks/utils/reduxHooks';
import {
    selectAuthError,
    selectAuthLoading,
    selectCanMakeRequest,
    selectIsAuthenticated,
    selectIsLogged,
    selectToken,
    selectUser,
    selectUserDisplayName,
    selectUserId
} from '~/store/selectors/authSelectors';
import {
    changePasswordAsync,
    checkAuthAsync,
    clearError,
    loginAsync,
    logoutAsync,
    refreshTokenAsync,
    registerAsync,
    setLoading
} from '~/store/slices/authSlice';

export interface UseAuthReturn {
    // State
    isAuthenticated: boolean;
    isLogged: boolean;
    token: string | null;
    userId: string | undefined;
    user: UserInfo | null;
    userDisplayName: string;
    loading: boolean;
    error: string | null;
    canMakeRequest: boolean;

    // Actions
    login: (credentials: LoginRequest) => Promise<void>;
    register: (userData: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    checkAuth: () => Promise<void>;
    changePassword: (passwordData: ChangePasswordRequest) => Promise<void>;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuth = (): UseAuthReturn => {
    const dispatch = useAppDispatch();

    // Selectors - Lấy từ Redux state (đã được restore từ localStorage)
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isLogged = useAppSelector(selectIsLogged);
    const token = useAppSelector(selectToken);
    const userId = useAppSelector(selectUserId);
    const user = useAppSelector(selectUser);
    const userDisplayName = useAppSelector(selectUserDisplayName);
    const loading = useAppSelector(selectAuthLoading);
    const error = useAppSelector(selectAuthError);
    const canMakeRequest = useAppSelector(selectCanMakeRequest);

    // Actions
    const login = useCallback(async (credentials: LoginRequest) => {
        await dispatch(loginAsync(credentials)).unwrap();
    }, [dispatch]);

    const register = useCallback(async (userData: RegisterRequest) => {
        await dispatch(registerAsync(userData)).unwrap();
    }, [dispatch]);

    const logout = useCallback(async () => {
        await dispatch(logoutAsync());
    }, [dispatch]);

    const refreshTokenAction = useCallback(async () => {
        await dispatch(refreshTokenAsync()).unwrap();
    }, [dispatch]);

    const checkAuth = useCallback(async () => {
        await dispatch(checkAuthAsync()).unwrap();
    }, [dispatch]);

    const changePasswordAction = useCallback(async (passwordData: ChangePasswordRequest) => {
        await dispatch(changePasswordAsync(passwordData)).unwrap();
    }, [dispatch]);

    const clearErrorAction = useCallback(() => {
        dispatch(clearError());
    }, [dispatch]);

    const setLoadingAction = useCallback((loading: boolean) => {
        dispatch(setLoading(loading));
    }, [dispatch]);

    return {
        // State - Tất cả đều từ Redux state (đã được restore từ localStorage)
        isAuthenticated,
        isLogged,
        token,
        userId,
        user,
        userDisplayName,
        loading,
        error,
        canMakeRequest,

        // Actions
        login,
        register,
        logout,
        refreshToken: refreshTokenAction,
        checkAuth,
        changePassword: changePasswordAction,
        clearError: clearErrorAction,
        setLoading: setLoadingAction,
    };
};