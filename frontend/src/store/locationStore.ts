import { create } from 'zustand';
import * as Location from 'expo-location';
import { userApi } from '../services/api';

interface Coords {
  latitude: number;
  longitude: number;
}
export interface NearbyDriver {
  id: string;
  latitude: number;
  longitude: number;
  heading: number;
}
interface LocationState {
  location: Coords | null;
  errorMsg: string | null;
  nearbyDrivers: NearbyDriver[];
  requestPermission: () => Promise<boolean>;
  startWatching: () => Promise<void>;
  fetchNearbyDrivers: (lat: number, lng: number) => Promise<void>;
  setNearbyDrivers: (drivers: NearbyDriver[]) => void;
}
let watcher: Location.LocationSubscription | null = null;

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  errorMsg: null,
  nearbyDrivers: [],
  requestPermission: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      set({ errorMsg: 'Location permission denied' });
      return false;
    }
    return true;
  },
  startWatching: async () => {
    const granted = await useLocationStore.getState().requestPermission();
    if (!granted) return;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    set({
      location: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      },
    });
    if (watcher) watcher.remove();
    watcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        timeInterval: 5000,
      },
      (loc) => {
        set({
          location: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        });
      },
    );
  },
  fetchNearbyDrivers: async (lat: number, lng: number) => {
    try {
      const res = await userApi.getNearbyDrivers(lat, lng);
      const drivers: NearbyDriver[] = res.data.map((d) => ({
        id: d.id,
        latitude: d.latitude,
        longitude: d.longitude,
        heading: 0,
      }));
      set({ nearbyDrivers: drivers });
    } catch {
      // silently fail — nearby drivers are best-effort
    }
  },
  setNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),
}));
