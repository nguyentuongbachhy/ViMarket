// Import existing API types instead of redefining
import type {
    AuthResponse,
    UserInfo,
} from '~/api/types';

// Import store types
import type { AppDispatch, RootState } from '~/store';

// Async thunk types
export interface AsyncThunkConfig {
    state: RootState;
    dispatch: AppDispatch;
    rejectValue: string;
}

// Use existing API types for auth
export type {
    AuthResponse, ChangePasswordRequest, LoginRequest,
    RegisterRequest, UserInfo
} from '~/api/types';

// Additional response types for store actions
export interface LoginResponse extends AuthResponse { }

export interface RegisterResponse {
    user: UserInfo;
    message?: string;
}

export interface RefreshTokenResponse extends AuthResponse { }

// Store action types
export interface StoreAction<T = any> {
    type: string;
    payload?: T;
}

// Loading states
export interface LoadingState {
    login: boolean;
    register: boolean;
    logout: boolean;
    refreshToken: boolean;
    checkAuth: boolean;
    changePassword: boolean;
    updateProfile: boolean;
}

// Error states
export interface ErrorState {
    login: string | null;
    register: string | null;
    logout: string | null;
    refreshToken: string | null;
    checkAuth: string | null;
    changePassword: string | null;
    updateProfile: string | null;
    general: string | null;
}

// User profile types (extending existing UserInfo)
export interface UserProfile extends UserInfo {
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    emailVerified: boolean;
    phoneVerified: boolean;
}

export interface UpdateProfileRequest {
    fullName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
}

// Validation types
export interface ValidationResult {
    isValid: boolean;
    errors: { [key: string]: string };
}

export interface FormValidationRules {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: any) => string | undefined;
}

// OAuth types
export interface OAuthProvider {
    name: string;
    clientId: string;
    redirectUri: string;
    scope: string[];
}

export interface OAuthResponse extends AuthResponse {
    provider: string;
}

// Security types
export interface SecuritySettings {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number;
    allowedDevices: string[];
}

export interface LoginSession {
    id: string;
    deviceInfo: string;
    ipAddress: string;
    location?: string;
    loginTime: string;
    lastActivity: string;
    isCurrentSession: boolean;
}

// App-specific types
export interface AppSettings {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    timezone: string;
}