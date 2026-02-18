import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CarTaxiFront } from 'lucide-react-native';
import { Colors } from '../config/theme';
export default function PulsingDriverMarker() {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <CarTaxiFront size={22} color={Colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.arrow} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary, 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -1,
  },
});
