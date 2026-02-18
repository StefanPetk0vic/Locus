import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config/api';
import { storage } from '../utils/storage';
let socket: Socket | null = null;
export const connectSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket;
  const token = await storage.getToken();
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id);
  });
  socket.on('connect_error', (err) => {
    console.warn('[WS] Connection error:', err.message);
  });
  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason);
  });
  return socket;
};
export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
export const getSocket = (): Socket | null => socket;
