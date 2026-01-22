import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/user.types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.type === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
