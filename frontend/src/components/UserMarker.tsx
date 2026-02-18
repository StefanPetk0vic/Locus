import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
const USER_BLUE = '#007AFF';
export default function UserMarker() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);
  const animatedRing = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value, 
  }));
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, animatedRing]} />
      <View style={styles.dot} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: USER_BLUE,
    opacity: 0.25,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: USER_BLUE,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
});
