import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { Colors } from '../config/theme';
export default function DriverMarker() {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Navigation
          size={14}
          color={Colors.surface}
          fill={Colors.surface}
          strokeWidth={0}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  outer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  inner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
