import { create } from 'zustand';
import { authApi, userApi, RegisterPayload, LoginPayload, UserProfile } from '../services/api';
import { storage } from '../utils/storage';
import { connectSocket, disconnectSocket } from '../services/socket';
interface AuthState {
  token: string | null;
  user: UserProfile | null;
  hasOnboarded: boolean;
  isLoading: boolean;  
  hydrate: () => Promise<void>;  
  completeOnboarding: () => Promise<void>;  
  register: (payload: RegisterPayload) => Promise<void>;  
  login: (payload: LoginPayload) => Promise<void>;  
  fetchProfile: () => Promise<void>;  
  logout: () => Promise<void>;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hasOnboarded: false,
  isLoading: true,
  hydrate: async () => {
    try {
      const [token, onboarded] = await Promise.all([
        storage.getToken(),
        storage.getOnboarded(),
      ]);
      set({ token, hasOnboarded: onboarded, isLoading: false });
      if (token) {
        await get().fetchProfile();
        await connectSocket();
      }
    } catch {
      set({ isLoading: false });
    }
  },
  completeOnboarding: async () => {
    await storage.setOnboarded();
    set({ hasOnboarded: true });
  },
  register: async (payload) => {
    await authApi.register(payload);
  },
  login: async (payload) => {
    const { data } = await authApi.login(payload);
    await storage.setToken(data.accessToken);
    set({ token: data.accessToken });
    await get().fetchProfile();
    await connectSocket();
  },
  fetchProfile: async () => {
    try {
      const { data } = await userApi.getProfile();
      set({ user: data });
    } catch {      
      await get().logout();
    }
  },
  logout: async () => {
    disconnectSocket();
    await storage.removeToken();
    set({ token: null, user: null });
  },
}));
