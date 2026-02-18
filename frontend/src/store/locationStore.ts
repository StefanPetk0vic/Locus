import { create } from 'zustand';
import * as Location from 'expo-location';
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
  setNearbyDrivers: (drivers: NearbyDriver[]) => void;
}
let watcher: Location.LocationSubscription | null = null;
function generateMockDrivers(center: Coords): NearbyDriver[] {
  const offsets = [
    { dlat: 0.003, dlng: 0.002, heading: 45 },
    { dlat: -0.002, dlng: 0.004, heading: 120 },
    { dlat: 0.001, dlng: -0.003, heading: 270 },
    { dlat: -0.004, dlng: -0.001, heading: 180 },
  ];
  return offsets.map((o, i) => ({
    id: `mock-driver-${i}`,
    latitude: center.latitude + o.dlat,
    longitude: center.longitude + o.dlng,
    heading: o.heading,
  }));
}
export const useLocationStore = create<LocationState>((set, get) => ({
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
    const granted = await get().requestPermission();
    if (!granted) return;    
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    set({
      location: coords,
      nearbyDrivers: generateMockDrivers(coords),
    });    
    if (watcher) watcher.remove();
    watcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10,
        timeInterval: 5000,
      },
      (loc) => {
        const c = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        set({
          location: c,
          nearbyDrivers: generateMockDrivers(c),
        });
      },
    );
  },
  setNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),
}));
