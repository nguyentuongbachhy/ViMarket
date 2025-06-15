import React, { useEffect, useState } from 'react';
import { authService, type User } from '../services/authService';
import { AuthContext, type AuthContextType } from './AuthContextCreate';

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for existing auth on startup
        const checkAuth = async () => {
            try {
                const savedToken = authService.getToken();
                const savedUser = authService.getUser();

                if (savedToken && savedUser) {
                    // Verify token is still valid
                    try {
                        await authService.getCurrentUser(savedToken);
                        setToken(savedToken);
                        setUser(savedUser);
                    } catch (error) {
                        // Token is invalid, clear auth
                        console.error('Token validation failed:', error);
                        authService.clearAuth();
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                authService.clearAuth();
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authService.login({ username, password });
            const { accessToken, user: userData } = response.data;

            authService.saveToken(accessToken);
            authService.saveUser(userData);

            setToken(accessToken);
            setUser(userData);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'response' in error
                    ? ((error as { response: { data?: { message?: string } } }).response?.data?.message) || 'Login failed'
                    : 'Login failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string, fullName: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Add the actual registration logic here
            await authService.register({ username, email, password, fullName });

        } catch (error: unknown) {
            const errorMessage = error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'response' in error
                    ? ((error as { response: { data?: { message?: string } } }).response?.data?.message) || 'Registration failed'
                    : 'Registration failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await authService.logout(token);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            authService.clearAuth();
            setToken(null);
            setUser(null);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        error,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};