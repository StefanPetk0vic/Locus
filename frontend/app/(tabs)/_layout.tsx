import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Clock, UserCircle, Car } from 'lucide-react-native';
import { Colors, Typography } from '../../src/config/theme';
import { useAuthStore } from '../../src/store/authStore';
export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const isDriver = user?.role === 'DRIVER';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 0.1,
        },
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => <Clock size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="vehicle"
        options={{
          title: 'Vehicle',
          href: isDriver ? '/(tabs)/vehicle' : null,
          tabBarIcon: ({ color, size }) => <Car size={size - 2} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size - 2} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
