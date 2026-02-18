import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { storage } from '../utils/storage';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});
console.log('[API] Base URL:', API_BASE_URL);
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(
    '[API]',
    config.method?.toUpperCase(),
    config.baseURL + (config.url || ''),
    token ? `(token: ...${token.slice(-8)})` : '(NO TOKEN)',
  );
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    console.log('[API] Error:', error.response?.status, error.message, url);
    // Only auto-logout on 401 for profile fetch, not for ride requests
    if (error.response?.status === 401 && url.includes('/users/profile')) {
      storage.removeToken();
    }
    return Promise.reject(error);
  },
);
export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'RIDER' | 'DRIVER';
  licensePlate?: string;
}
export interface LoginPayload {
  email: string;
  password: string;
}
export const authApi = {
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  login: (data: LoginPayload) =>
    api.post<{ accessToken: string }>('/auth/login', data),
};
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'RIDER' | 'DRIVER';
  isAdmin: boolean;
  licensePlate?: string;
  isVerified?: boolean;
  rides?: number;
}
export const userApi = {
  getProfile: () => api.get<UserProfile>('/users/profile'),
  updateLicensePlate: (driverId: string, licensePlate: string) =>
    api.patch(`/users/drivers/${driverId}/license-plate`, { licensePlate }),
};
export interface RideRequest {
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
}
export interface RideResponse {
  id: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  status: string;
  price: number | null;
  riderId: string;
  driverId: string | null;
  createdAt: string;
}
export const rideApi = {
  requestRide: (data: RideRequest) =>
    api.post<RideResponse>('/rides/request', data),
  acceptRide: (rideId: string) =>
    api.patch<RideResponse>(`/rides/${rideId}/accept`),
  cancelRide: (rideId: string) =>
    api.patch<RideResponse>(`/rides/${rideId}/cancel`),
  startRide: (rideId: string) =>
    api.patch<RideResponse>(`/rides/${rideId}/start`),
  completeRide: (rideId: string) =>
    api.patch<RideResponse>(`/rides/${rideId}/complete`),
  updateDriverLocation: (rideId: string, lat: number, lng: number) =>
    api.post(`/rides/${rideId}/location`, { lat, lng }),
};
export default api;
