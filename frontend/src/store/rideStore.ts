import { create } from 'zustand';
import { rideApi, RideResponse } from '../services/api';
import { getSocket } from '../services/socket';
import * as Location from 'expo-location';

export interface RideRequestData {
  rideId: string;
  riderId: string;
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  timestamp: string;
}

export interface DriverLocation {
  rideId: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

let locationInterval: ReturnType<typeof setInterval> | null = null;

interface RideState {
  
  currentRide: RideResponse | null;
  
  incomingRequest: RideRequestData | null;
  
  driverLocation: DriverLocation | null;
  
  isRequesting: boolean;

  requestRide: (
    pickupLat: number,
    pickupLng: number,
    destLat: number,
    destLng: number,
    price?: number,
  ) => Promise<void>;

  acceptRide: (rideId: string) => Promise<void>;

  cancelRide: (rideId: string) => Promise<void>;
  startRide: (rideId: string) => Promise<void>;
  completeRide: (rideId: string) => Promise<void>;
  
  startSendingLocation: (rideId: string) => void;
  
  stopSendingLocation: () => void;
  
  listen: () => void;
  
  unlisten: () => void;

  clearRide: () => void;
  setIncomingRequest: (req: RideRequestData | null) => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  currentRide: null,
  incomingRequest: null,
  driverLocation: null,
  isRequesting: false,

  requestRide: async (pickupLat, pickupLng, destLat, destLng, price) => {
    set({ isRequesting: true });
    try {
      const { data } = await rideApi.requestRide({
        pickupLat,
        pickupLng,
        destLat,
        destLng,
        price,
      });
      set({ currentRide: data });
    } finally {
      set({ isRequesting: false });
    }
  },

  acceptRide: async (rideId) => {
    const { data } = await rideApi.acceptRide(rideId);
    set({ currentRide: data, incomingRequest: null });
    
    get().startSendingLocation(rideId);
  },

  cancelRide: async (rideId) => {
    const { data } = await rideApi.cancelRide(rideId);
    set({ currentRide: null, incomingRequest: null, driverLocation: null });
    get().stopSendingLocation();
  },

  startRide: async (rideId) => {
    const { data } = await rideApi.startRide(rideId);
    set({ currentRide: data });
  },

  completeRide: async (rideId) => {
    const { data } = await rideApi.completeRide(rideId);
    set({ currentRide: data });
    get().stopSendingLocation();
  },

  startSendingLocation: (rideId: string) => {
    
    if (locationInterval) clearInterval(locationInterval);

    const sendLocation = async () => {
      try {
        const socket = getSocket();
        if (!socket?.connected) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        socket.emit('driver.location.update', {
          rideId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        console.log('[WS] Sent driver location:', pos.coords.latitude.toFixed(4), pos.coords.longitude.toFixed(4));
      } catch (err) {
        console.warn('[WS] Failed to send location:', err);
      }
    };
    
    sendLocation();
    locationInterval = setInterval(sendLocation, 3000);
    console.log('[WS] Started sending driver location for ride', rideId);
  },

  stopSendingLocation: () => {
    if (locationInterval) {
      clearInterval(locationInterval);
      locationInterval = null;
      console.log('[WS] Stopped sending driver location');
    }
  },

  listen: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('ride.requested', (data: RideRequestData) => {
      console.log('[WS] Received ride.requested:', data.rideId);
      set({ incomingRequest: data });
    });

    socket.on('ride.accepted', (data: any) => {
      console.log('[WS] Received ride.accepted:', JSON.stringify(data));
      
      const current = get().currentRide;
      if (current) {
        set({
          currentRide: {
            ...current,
            driverId: data.driverId,
            status: 'ACCEPTED',
          },
        });
      }
    });

    socket.on('ride.started', (data: any) => {
      console.log('[WS] Received ride.started:', JSON.stringify(data));
      const current = get().currentRide;
      if (current && current.id === data.rideId) {
        set({
          currentRide: {
            ...current,
            status: 'IN_PROGRESS',
          },
        });
      }
    });

    socket.on('ride.completed', (data: any) => {
      console.log('[WS] Received ride.completed:', JSON.stringify(data));
      const current = get().currentRide;
      if (current && current.id === data.rideId) {
        set({
          currentRide: {
            ...current,
            status: 'COMPLETED',
          },
        });
      }
    });

    socket.on('driver.location.update', (data: DriverLocation) => {
      console.log('[WS] Received driver location:', data.lat?.toFixed(4), data.lng?.toFixed(4));
      set({ driverLocation: data });
    });
  },

  unlisten: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off('ride.requested');
    socket.off('ride.accepted');
    socket.off('ride.started');
    socket.off('ride.completed');
    socket.off('driver.location.update');
    get().stopSendingLocation();
  },

  clearRide: () => {
    get().stopSendingLocation();
    set({ currentRide: null, incomingRequest: null, driverLocation: null });
  },

  setIncomingRequest: (req) => set({ incomingRequest: req }),
}));
