import { api } from './api';
import { tokenStorage } from '../utils/tokenStorage';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      credentials,
    );
    const { user, token } = response.data;
    await tokenStorage.saveToken(token);
    await tokenStorage.saveUser(user);
    return { user, token };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      data,
    );
    const { user, token } = response.data;
    await tokenStorage.saveToken(token);
    await tokenStorage.saveUser(user);
    return { user, token };
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; data: { user: User } }>(
      '/auth/me',
    );
    return response.data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      await tokenStorage.clearAll();
    }
  },

  async restoreSession(): Promise<User | null> {
    const token = await tokenStorage.getToken();
    if (!token) return null;
    try {
      const user = await authService.getCurrentUser();
      await tokenStorage.saveUser(user);
      return user;
    } catch {
      await tokenStorage.clearAll();
      return null;
    }
  },
};
