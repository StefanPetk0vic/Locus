import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import SplashAnimation from './splash';
export default function Index() {
  const token = useAuthStore((s) => s.token);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);
  if (showSplash) return <SplashAnimation />;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (!token) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)/home" />;
}
