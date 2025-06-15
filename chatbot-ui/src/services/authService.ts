import axios from 'axios';

const API_BASE_URL = 'http://localhost:5009/api/v1';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    fullName: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
}

export interface AuthResponse {
    status: string;
    data: {
        accessToken: string;
        tokenType: string;
        expiresAt: number;
        user: User;
    };
    message: string;
}

class AuthService {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    async login(request: LoginRequest): Promise<AuthResponse> {
        const response = await axios.post(`${this.baseURL}/auth/login`, request);
        return response.data;
    }

    async register(request: RegisterRequest): Promise<{ status: string; data: User; message: string }> {
        const response = await axios.post(`${this.baseURL}/auth/register`, request);
        return response.data;
    }

    async getCurrentUser(token: string): Promise<{ status: string; data: User; message: string }> {
        const response = await axios.get(`${this.baseURL}/user/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }

    async refreshToken(token: string): Promise<AuthResponse> {
        const response = await axios.post(`${this.baseURL}/auth/refresh`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }

    async logout(token: string): Promise<void> {
        await axios.post(`${this.baseURL}/auth/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    // Local storage helpers
    saveToken(token: string): void {
        localStorage.setItem('auth_token', token);
    }

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    saveUser(user: User): void {
        localStorage.setItem('user', JSON.stringify(user));
    }

    getUser(): User | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    clearAuth(): void {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    }

    isTokenExpired(expiresAt: number): boolean {
        return Date.now() / 1000 > expiresAt;
    }
}

export const authService = new AuthService();