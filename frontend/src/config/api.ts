import { Platform } from 'react-native';

const DEV_HOST = Platform.select({
  
  android: 'https://untinselled-faintingly-riva.ngrok-free.dev',
  ios: 'https://untinselled-faintingly-riva.ngrok-free.dev',
  default: 'https://untinselled-faintingly-riva.ngrok-free.dev',
});

export const API_BASE_URL = DEV_HOST;
export const WS_URL = API_BASE_URL;

// Replace with your Stripe publishable key from the Stripe dashboard
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RZc7AHDvIqWgCJmMec0YHhVYqoKR9nXciqdtejQ4I467f61LUu3ndWYUOTTfyxI13aV8G0IQDTsOpBIkTpAICva00iyPZkgE6';
