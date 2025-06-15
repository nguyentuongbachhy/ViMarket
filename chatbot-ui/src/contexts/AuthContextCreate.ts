import { createContext } from 'react';
import { type User } from '../services/authService';

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string, fullName: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);