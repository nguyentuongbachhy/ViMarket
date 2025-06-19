import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { store } from '~/store';
import { logout, refreshTokenAsync } from '~/store/slices/authSlice';

const instance: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Flag để tránh multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token!);
        }
    });

    failedQueue = [];
};

instance.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state.auth.token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (import.meta.env.NODE_ENV === 'development') {
            console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`, {
                data: config.data,
                params: config.params,
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ [API Request Error]', error);
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response: AxiosResponse) => {
        if (import.meta.env.NODE_ENV === 'development') {
            console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data,
            });
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (import.meta.env.NODE_ENV === 'development') {
            console.error(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                status: error.response?.status,
                message: error.message,
                data: error.response?.data,
            });
        }

        // Kiểm tra nếu là lỗi 401 và không phải refresh request
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            const state = store.getState();

            // Nếu không có token hoặc user không logged in, logout ngay
            if (!state.auth.token || !state.auth.isLogged) {
                store.dispatch(logout());
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Nếu đang refresh, đợi kết quả
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return instance(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshResult = await store.dispatch(refreshTokenAsync()).unwrap();
                const newToken = refreshResult.accessToken;

                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                // Clear tất cả auth data
                store.dispatch(logout());

                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (!error.response) {
            error.message = 'Network error - please check your connection';
        }

        return Promise.reject(error);
    }
);

export const handleApiResponse = <T>(response: AxiosResponse): T => {
    if (response.data.status === 'success') {
        return response.data.data;
    }
    throw new Error(response.data.message || 'API request failed');
};

export const handleApiError = (error: any): string => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

export default instance;