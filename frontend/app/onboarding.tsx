import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Shield, Navigation } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import OnboardingSlide from '../src/components/OnboardingSlide';
import Button from '../src/components/Button';
import { useAuthStore } from '../src/store/authStore';
import { Colors, Spacing, Typography, BorderRadius } from '../src/config/theme';
const { width } = Dimensions.get('window');
const slides = [
  {
    key: '1',
    icon: <MapPin size={48} color={Colors.primary} strokeWidth={1.8} />,
    title: 'Get there faster',
    subtitle: 'Request a ride in seconds. We connect you with the nearest available driver.',
  },
  {
    key: '2',
    icon: <Navigation size={48} color={Colors.primary} strokeWidth={1.8} />,
    title: 'Live tracking',
    subtitle: 'See your driver on the map in real time. Know exactly when they arrive.',
  },
  {
    key: '3',
    icon: <Shield size={48} color={Colors.primary} strokeWidth={1.8} />,
    title: 'Safe and reliable',
    subtitle: 'All drivers are verified. Your safety is our top priority on every trip.',
  },
];
export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };
  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };
  const isLast = currentIndex === slides.length - 1;
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <OnboardingSlide
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
          />
        )}
      />
      {}
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
      {}
      <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.bottom}>
        {isLast ? (
          <Button title="Get Started" onPress={handleGetStarted} />
        ) : (
          <View style={styles.bottomRow}>
            <Button title="Skip" variant="ghost" onPress={handleGetStarted} />
            <Button title="Next" onPress={handleNext} style={{ flex: 1 }} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  listContent: {
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },
  bottom: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
