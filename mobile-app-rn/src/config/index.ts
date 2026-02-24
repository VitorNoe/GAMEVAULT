import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  // For Android emulator, localhost maps to 10.0.2.2
  // For iOS simulator, localhost works directly
  // For physical devices or Codespaces, set REACT_NATIVE_API_URL env
  if (__DEV__) {
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:3001/api`;
  }
  return 'https://your-production-url.com/api';
};

export const config = {
  apiBaseUrl: getApiBaseUrl(),
  requestTimeout: 30000,
  storage: {
    tokenKey: 'gamevault_auth_token',
    userKey: 'gamevault_user_data',
    notificationsKey: 'gamevault_notifications',
  },
  pagination: {
    defaultLimit: 20,
  },
} as const;
