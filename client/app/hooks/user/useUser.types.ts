import type { UserInfo } from '~/api/types';

export interface UserHookState {
    user: UserInfo | null;
    loading: boolean;
    error: string | null;
}

export interface UserHookActions {
    getCurrentUser: () => Promise<UserInfo | null>;
    getUserById: (id: string) => Promise<UserInfo | null>;
    updateUser: (userData: Partial<UserInfo>) => Promise<void>;
    refreshUser: () => Promise<void>;
}

export interface UseUserOptions {
    autoFetch?: boolean;
    refreshOnMount?: boolean;
}