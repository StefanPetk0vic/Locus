import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const TOKEN_KEY = 'locus_access_token';
const ONBOARDED_KEY = 'locus_onboarded';
const memoryStore: Record<string, string> = {};
export const storage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') return memoryStore[TOKEN_KEY] ?? null;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryStore[TOKEN_KEY] = token;
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    if (Platform.OS === 'web') {
      delete memoryStore[TOKEN_KEY];
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  async getOnboarded(): Promise<boolean> {
    if (Platform.OS === 'web') return memoryStore[ONBOARDED_KEY] === 'true';
    const val = await SecureStore.getItemAsync(ONBOARDED_KEY);
    return val === 'true';
  },
  async setOnboarded(): Promise<void> {
    if (Platform.OS === 'web') {
      memoryStore[ONBOARDED_KEY] = 'true';
      return;
    }
    await SecureStore.setItemAsync(ONBOARDED_KEY, 'true');
  },
};
