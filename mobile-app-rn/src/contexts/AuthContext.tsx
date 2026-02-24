import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';
import { api } from '../services/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Auto-logout on 401
    useEffect(() => {
        api.setOnUnauthorized(() => {
            setUser(null);
        });
    }, []);

    // Restore session on mount
    useEffect(() => {
        const restore = async () => {
            try {
                const restoredUser = await authService.restoreSession();
                setUser(restoredUser);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        restore();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const { user: loggedInUser } = await authService.login(credentials);
        setUser(loggedInUser);
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const { user: registeredUser } = await authService.register(data);
        setUser(registeredUser);
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const freshUser = await authService.getCurrentUser();
            setUser(freshUser);
        } catch {
            // ignore
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: !!user,
            isAdmin: user?.type === 'admin',
            login,
            register,
            logout,
            refreshUser,
        }),
        [user, loading, login, register, logout, refreshUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
