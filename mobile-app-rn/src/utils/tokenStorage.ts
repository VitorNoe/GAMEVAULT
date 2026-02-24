/**
 * Secure Token Storage
 *
 * Uses AsyncStorage with a clear migration path to react-native-keychain
 * or expo-secure-store for production. In a real build, swap the import
 * below for a native keychain wrapper to keep JWTs out of plain-text storage.
 *
 * Best practices implemented:
 * - Token isolated from other app data via prefixed keys
 * - clearAll wipes both token and cached user
 * - getToken returns null (not throws) when absent
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';
import { User } from '../types';

const TOKEN_KEY = config.storage.tokenKey;
const USER_KEY = config.storage.userKey;

export const tokenStorage = {
  // ---- Token ----
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (err) {
      console.error('Failed to save token:', err);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      console.error('Failed to remove token:', err);
    }
  },

  // ---- User cache ----
  async getUser(): Promise<User | null> {
    try {
      const json = await AsyncStorage.getItem(USER_KEY);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error('Failed to remove user:', err);
    }
  },

  // ---- Wipe all ----
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  },
};
