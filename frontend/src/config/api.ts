import { Platform } from 'react-native';
const DEV_HOST = Platform.select({  
  android: 'https://untinselled-faintingly-riva.ngrok-free.dev',
  ios: 'https://untinselled-faintingly-riva.ngrok-free.dev',
  default: 'https://untinselled-faintingly-riva.ngrok-free.dev',
});
export const API_BASE_URL = DEV_HOST;
export const WS_URL = API_BASE_URL;
