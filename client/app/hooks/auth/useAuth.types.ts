// app/hooks/auth/useAuth.types.ts
import type { UserInfo } from '~/api/types';

export interface AuthHookState {
    isAuthenticated: boolean;
    isLogged: boolean;
    token: string | null;
    userId: string | undefined;
    user?: UserInfo;
    loading: boolean;
    error: string | null;
}

export interface AuthHookActions {
    login: (credentials: any) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    checkAuth: () => Promise<void>;
    changePassword: (passwordData: any) => Promise<void>;
    clearError: () => void;
    setLoading: (loading: boolean) => void;
}

export interface UseAuthOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}