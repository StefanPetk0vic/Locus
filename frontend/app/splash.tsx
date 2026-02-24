import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { MapPin } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../src/config/theme';

export default function SplashAnimation() {
  const progress = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
    textOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
    );
  }, [progress, textOpacity]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.5, 1]) },
      { translateY: interpolate(progress.value, [0, 1], [20, 0]) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      { translateY: interpolate(textOpacity.value, [0, 1], [10, 0]) },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <View style={styles.iconCircle}>
          <MapPin size={36} color={Colors.surface} strokeWidth={2.5} />
        </View>
      </Animated.View>

      <Animated.View style={textStyle}>
        <Text style={styles.appName}>Locus</Text>
        <Text style={styles.tagline}>Travel anywhere, anytime.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...Typography.largeTitle,
    color: Colors.text,
    textAlign: 'center',
  },
  tagline: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
