export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    fullName?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface AuthResponse {
    accessToken: string;
    userId: string;
    user?: UserInfo;
}

export interface UserInfo {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    role: string;
    createdAt: string;
}