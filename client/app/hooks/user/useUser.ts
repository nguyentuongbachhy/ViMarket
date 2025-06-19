// app/hooks/user/useUser.ts
import { useCallback, useEffect } from 'react';
import { authService } from '~/api';
import type { UserInfo } from '~/api/types';
import { useAuth } from '~/hooks/auth';
import { useAppDispatch } from '~/hooks/utils/reduxHooks';
import { updateUser as updateUserAction } from '~/store/slices/authSlice';

export interface UseUserReturn {
    // State - Sử dụng từ Redux state
    user: UserInfo | null;
    loading: boolean;
    error: string | null;

    // Actions
    refreshUser: () => Promise<void>;
    updateUserProfile: (userData: Partial<UserInfo>) => Promise<void>;
    getUserById: (id: string) => Promise<UserInfo | null>;
}

export const useUser = (): UseUserReturn => {
    const dispatch = useAppDispatch();
    const {
        user,
        loading,
        error,
        isAuthenticated,
        userId,
        setLoading
    } = useAuth();

    // Refresh user data từ API (chỉ khi cần)
    const refreshUser = useCallback(async (): Promise<void> => {
        if (!isAuthenticated || !userId) {
            console.warn('Cannot refresh user: not authenticated');
            return;
        }

        try {
            setLoading(true);
            const userData = await authService.getCurrentUser();

            // Cập nhật user data trong Redux state
            dispatch(updateUserAction(userData));
        } catch (err: any) {
            console.error('Failed to refresh user:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userId, dispatch, setLoading]);

    // Update user profile
    const updateUserProfile = useCallback(async (userData: Partial<UserInfo>): Promise<void> => {
        if (!isAuthenticated || !userId) {
            throw new Error('User not authenticated');
        }

        try {
            setLoading(true);

            // TODO: Implement updateUser API call when backend is ready
            // const updatedUser = await authService.updateUser(userData);

            // For now, just update local state
            dispatch(updateUserAction(userData));

            console.log('User profile updated locally:', userData);
        } catch (err: any) {
            console.error('Failed to update user profile:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userId, dispatch, setLoading]);

    // Get user by ID (for viewing other users)
    const getUserById = useCallback(async (id: string): Promise<UserInfo | null> => {
        if (!isAuthenticated) {
            throw new Error('User not authenticated');
        }

        try {
            const userData = await authService.getUserById(id);
            return userData;
        } catch (err: any) {
            console.error('Failed to get user by ID:', err);
            throw err;
        }
    }, [isAuthenticated]);

    // Auto-refresh user data nếu chưa có hoặc dữ liệu cũ
    useEffect(() => {
        if (isAuthenticated && userId && !user) {
            console.log('User data not found in state, refreshing...');
            refreshUser().catch(console.error);
        }
    }, [isAuthenticated, userId, user, refreshUser]);

    return {
        // State từ Redux (đã có sẵn từ localStorage)
        user,
        loading,
        error,

        // Actions
        refreshUser,
        updateUserProfile,
        getUserById,
    };
};