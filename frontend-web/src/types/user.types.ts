export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  type: 'regular' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
}
