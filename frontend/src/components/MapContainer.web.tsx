import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../config/theme';
const MapContainer = forwardRef<View, any>((_props, ref) => {
  return (
    <View ref={ref} style={styles.container}>
      <MapPin size={48} color={Colors.primary} />
      <Text style={styles.title}>Map View</Text>
      <Text style={styles.subtitle}>
        The interactive map is available on mobile devices.{'\n'}
        Please open this app in Expo Go on your phone.
      </Text>
    </View>
  );
});
MapContainer.displayName = 'MapContainer';
export default MapContainer;
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    ...Typography.title2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
