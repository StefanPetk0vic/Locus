import { Platform } from 'react-native';

const DEV_HOST = Platform.select({
  
  android: 'https://fdc7-109-245-144-246.ngrok-free.app',
  ios: 'https://fdc7-109-245-144-246.ngrok-free.app',
  default: 'https://fdc7-109-245-144-246.ngrok-free.app',
});

export const API_BASE_URL = DEV_HOST;
export const WS_URL = API_BASE_URL;
