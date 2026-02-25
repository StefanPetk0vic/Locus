import { Platform } from 'react-native';

const DEV_HOST = Platform.select({
  
  android: 'https://6e1d-109-245-144-246.ngrok-free.app',
  ios: 'https://6e1d-109-245-144-246.ngrok-free.app',
  default: 'https://6e1d-109-245-144-246.ngrok-free.app',
});

export const API_BASE_URL = DEV_HOST;
export const WS_URL = API_BASE_URL;

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RZc7AHDvIqWgCJmMec0YHhVYqoKR9nXciqdtejQ4I467f61LUu3ndWYUOTTfyxI13aV8G0IQDTsOpBIkTpAICva00iyPZkgE6';
