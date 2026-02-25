import React from 'react';
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
} from 'react-native-reanimated';
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
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  position = 'bottom',
  scrollable = true,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
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
            onPress={onClose}
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
          ]}
        >
          {}
          {position === 'bottom' && <View style={styles.handle} />}

          {}
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
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
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
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
