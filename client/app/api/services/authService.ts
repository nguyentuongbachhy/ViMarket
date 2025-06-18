import { type AxiosResponse } from "axios";
import instance, { handleApiError, handleApiResponse } from "~/api/axios";
import type {
    ApiResponse,
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UserInfo
} from '~/api/types';

export class AuthService {
    private readonly authUrl = 'auth'
    private readonly userUrl = 'user'

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        try {
            const response: AxiosResponse<ApiResponse<AuthResponse>> = await instance.post(
                `${this.authUrl}/login`,
                credentials
            )
            return handleApiResponse<AuthResponse>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async register(userData: RegisterRequest): Promise<UserInfo> {
        try {
            const response: AxiosResponse<ApiResponse<UserInfo>> = await instance.post(
                `${this.authUrl}/register`,
                userData
            )
            return handleApiResponse<UserInfo>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<void>> = await instance.post(
                `${this.authUrl}/change-password`,
                passwordData
            )
            handleApiResponse<void>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async logout(): Promise<void> {
        try {
            const response: AxiosResponse<ApiResponse<void>> = await instance.post(
                `${this.authUrl}/logout`
            )
            handleApiResponse<void>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async refreshToken(): Promise<AuthResponse> {
        try {
            const response: AxiosResponse<ApiResponse<AuthResponse>> = await instance.post(
                `${this.authUrl}/refresh`
            )
            return handleApiResponse<AuthResponse>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getCurrentUser(): Promise<UserInfo> {
        try {
            const response: AxiosResponse<ApiResponse<UserInfo>> = await instance.get(
                `${this.userUrl}/me`
            )
            return handleApiResponse<UserInfo>(response)
        } catch (error) {
            throw new Error(handleApiError(error))
        }
    }

    async getUserById(id: string): Promise<UserInfo> {
        try {
            const response: AxiosResponse<ApiResponse<UserInfo>> = await instance.get(
                `${this.userUrl}/${id}`
            );
            return handleApiResponse<UserInfo>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async getAllUsers(): Promise<UserInfo[]> {
        try {
            const response: AxiosResponse<ApiResponse<UserInfo[]>> = await instance.get(
                `${this.userUrl}`
            );
            return handleApiResponse<UserInfo[]>(response);
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }

    async validateToken(): Promise<boolean> {
        try {
            await this.getCurrentUser();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;