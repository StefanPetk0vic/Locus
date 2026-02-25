import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { X } from 'lucide-react-native';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../config/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'center';
  /** Set false when children contain a FlatList / VirtualizedList */
  scrollable?: boolean;
  /** Set false to hide the close button and prevent backdrop press (default: true) */
  closable?: boolean;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  position = 'bottom',
  scrollable = true,
  closable = true,
}: ModalProps) {
  const translateY = useSharedValue(0);

  const dismiss = useCallback(() => {
    if (closable) onClose();
  }, [closable, onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100) {
        translateY.value = withTiming(500, { duration: 200 });
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset translateY when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [visible]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
      >
        {}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closable ? onClose : undefined}
          />
        </Animated.View>

        {}
        <Animated.View
          entering={
            position === 'bottom'
              ? SlideInDown.duration(350)
              : FadeIn.duration(250)
          }
          exiting={
            position === 'bottom'
              ? SlideOutDown.duration(200)
              : FadeOut.duration(200)
          }
          style={[
            styles.content,
            position === 'bottom' ? styles.bottom : styles.center,
            position === 'bottom' ? animatedStyle : undefined,
          ]}
        >
          {/* Swipe handle for bottom modals */}
          {position === 'bottom' && (
            <GestureDetector gesture={panGesture}>
              <Animated.View style={styles.handleZone}>
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>
          )}

          {}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {closable && (
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <X size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {scrollable ? (
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </Animated.View>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  content: {
    backgroundColor: Colors.surface,
    ...Shadows.modal,
  },
  bottom: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
    maxHeight: '85%',
  },
  center: {
    marginHorizontal: Spacing.lg,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  handleZone: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
  },
});
