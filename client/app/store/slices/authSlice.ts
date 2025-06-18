import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { authService } from "~/api";
import { type AuthState } from "~/store/types";
import type {
    AsyncThunkConfig,
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
    UserInfo
} from "~/store/types/store";
import SecureStorage, { createSecureStorage, generateSecretKey } from "~/store/utils/secureStorage";

let secureStorage: SecureStorage;

const initSecureStorage = (userId: string): SecureStorage => {
    const APP_SECRET = import.meta.env.VITE_APP_SECRET;
    const secretKey = generateSecretKey(userId, APP_SECRET);
    return createSecureStorage(secretKey, 'v2');
};

// Utility function để clear tất cả auth data
const clearAllAuthData = (): void => {
    if (typeof window !== 'undefined') {
        try {
            // Clear localStorage
            const keysToRemove = Object.keys(localStorage).filter(key =>
                key.startsWith('auth_') ||
                key.includes('token') ||
                key.includes('user') ||
                key.includes('machine_id')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear sessionStorage
            const sessionKeys = Object.keys(sessionStorage).filter(key =>
                key.startsWith('auth_') ||
                key.includes('token') ||
                key.includes('user')
            );
            sessionKeys.forEach(key => sessionStorage.removeItem(key));

            // Clear secure storage
            if (secureStorage) {
                secureStorage.clear();
            }

            console.log('All auth data cleared');
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }
};

const getInitialState: () => AuthState = () => {
    try {
        if (typeof window !== 'undefined') {
            const basicAuthInfo = localStorage.getItem('auth_basic');

            if (basicAuthInfo) {
                const { userId } = JSON.parse(basicAuthInfo);

                if (userId) {
                    secureStorage = initSecureStorage(userId);
                    const authData = secureStorage.getItem<AuthState>('auth_data');

                    if (authData && authData.token) {
                        return {
                            ...authData,
                            loading: false,
                            error: null
                        };
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error initializing data from localStorage:', error);
        clearAllAuthData();
    }
    return {
        isLogged: false,
        token: '',
        userId: undefined,
        loading: false,
        error: null
    };
};

export const loginAsync = createAsyncThunk<
    LoginResponse,
    LoginRequest,
    AsyncThunkConfig
>(
    'auth/loginAsync',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await authService.login(credentials);
            if (!response.user) {
                throw new Error('User information is missing in the response');
            }
            const user: UserInfo = response.user;
            console.log(user);
            return {
                accessToken: response.accessToken,
                userId: user.id,
                user: response.user
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Đăng nhập thất bại');
        }
    }
);

export const registerAsync = createAsyncThunk<
    RegisterResponse,
    RegisterRequest,
    AsyncThunkConfig
>(
    'auth/registerAsync',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await authService.register(userData);
            return {
                user: response,
                message: 'Đăng ký thành công! Vui lòng đăng nhập.'
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Đăng ký thất bại');
        }
    }
);

export const refreshTokenAsync = createAsyncThunk<
    RefreshTokenResponse,
    void,
    AsyncThunkConfig
>(
    'auth/refreshToken',
    async (_, { getState, rejectWithValue }) => {
        try {
            const response = await authService.refreshToken();
            return {
                accessToken: response.accessToken,
                userId: response.userId || getState().auth.userId!
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Làm mới token thất bại');
        }
    }
);

export const logoutAsync = createAsyncThunk<
    void,
    void,
    AsyncThunkConfig
>(
    'auth/logoutAsync',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
        } catch (error: any) {
            console.warn('Logout API call failed:', error);
            // Không throw error vì chúng ta vẫn muốn logout local
        }
    }
);

export const checkAuthAsync = createAsyncThunk<
    { userId: string; token: string; user?: any },
    void,
    AsyncThunkConfig
>(
    'auth/checkAuth',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();

            if (!auth.token || !auth.isLogged) {
                return rejectWithValue('Không tìm thấy token hoặc chưa đăng nhập');
            }

            const userInfo = await authService.getCurrentUser();

            return {
                userId: userInfo.id,
                token: auth.token,
                user: userInfo
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Xác thực thất bại');
        }
    }
);

export const changePasswordAsync = createAsyncThunk<
    void,
    ChangePasswordRequest,
    AsyncThunkConfig
>(
    'auth/changePassword',
    async (passwordData, { rejectWithValue }) => {
        try {
            await authService.changePassword(passwordData);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Đổi mật khẩu thất bại');
        }
    }
);

const initialState = getInitialState();

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<{ token: string, userId: string, user?: any }>) => {
            const { token, userId, user } = action.payload;

            state.isLogged = true;
            state.token = token;
            state.userId = userId;
            state.user = user;
            state.loading = false;
            state.error = null;

            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('auth_basic', JSON.stringify({ userId }));
                    secureStorage = initSecureStorage(userId);
                    secureStorage.setItem('auth_data', {
                        isLogged: true,
                        token,
                        userId,
                        user
                    });
                } catch (error) {
                    console.error('Error saving auth data:', error);
                }
            }
        },

        logout: (state) => {
            state.isLogged = false;
            state.token = '';
            state.userId = undefined;
            state.user = undefined;
            state.loading = false;
            state.error = null;

            // Clear tất cả auth data
            clearAllAuthData();
        },

        updateToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
            state.error = null;

            if (typeof window !== 'undefined' && secureStorage && state.userId) {
                try {
                    secureStorage.setItem('auth_data', {
                        isLogged: state.isLogged,
                        token: action.payload,
                        userId: state.userId,
                        user: state.user
                    });
                } catch (error) {
                    console.error('Error updating token:', error);
                }
            }
        },

        updateUser: (state, action: PayloadAction<any>) => {
            state.user = { ...state.user, ...action.payload };
            state.error = null;

            if (typeof window !== 'undefined' && secureStorage && state.userId) {
                try {
                    secureStorage.setItem('auth_data', {
                        isLogged: state.isLogged,
                        token: state.token,
                        userId: state.userId,
                        user: state.user
                    });
                } catch (error) {
                    console.error('Error updating user:', error);
                }
            }
        },

        clearError: (state) => {
            state.error = null;
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },

        resetAuthState: (state) => {
            state.isLogged = false;
            state.token = '';
            state.userId = undefined;
            state.user = undefined;
            state.loading = false;
            state.error = null;
            clearAllAuthData();
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginAsync.fulfilled, (state, action) => {
                const { accessToken, userId, user } = action.payload;
                authSlice.caseReducers.login(state, {
                    type: 'auth/login',
                    payload: { token: accessToken, userId, user }
                });
            })
            .addCase(loginAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Đăng nhập thất bại';
                state.isLogged = false;
                state.token = '';
                state.userId = undefined;
                state.user = undefined;
            })

            .addCase(registerAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerAsync.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(registerAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Đăng ký thất bại';
            })

            .addCase(refreshTokenAsync.pending, (state) => {
                // Không set loading = true để tránh UI flickering
                state.error = null;
            })
            .addCase(refreshTokenAsync.fulfilled, (state, action) => {
                state.token = action.payload.accessToken;
                state.loading = false;
                state.error = null;

                if (typeof window !== 'undefined' && secureStorage && state.userId) {
                    try {
                        secureStorage.setItem('auth_data', {
                            isLogged: state.isLogged,
                            token: action.payload.accessToken,
                            userId: state.userId,
                            user: state.user
                        });
                    } catch (error) {
                        console.error('Error saving refreshed token:', error);
                    }
                }
            })
            .addCase(refreshTokenAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Làm mới token thất bại';
                // Force logout khi refresh token thất bại
                authSlice.caseReducers.logout(state);
            })

            .addCase(logoutAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(logoutAsync.fulfilled, (state) => {
                authSlice.caseReducers.logout(state);
            })
            .addCase(logoutAsync.rejected, (state) => {
                // Vẫn logout dù API call thất bại
                authSlice.caseReducers.logout(state);
            })

            .addCase(checkAuthAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuthAsync.fulfilled, (state, action) => {
                state.isLogged = true;
                state.userId = action.payload.userId;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.loading = false;
                state.error = null;
            })
            .addCase(checkAuthAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Xác thực thất bại';
                authSlice.caseReducers.logout(state);
            })

            .addCase(changePasswordAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(changePasswordAsync.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(changePasswordAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Đổi mật khẩu thất bại';
            });
    }
});

export const {
    login,
    logout,
    updateToken,
    updateUser,
    clearError,
    setLoading,
    resetAuthState,
} = authSlice.actions;

export default authSlice.reducer;