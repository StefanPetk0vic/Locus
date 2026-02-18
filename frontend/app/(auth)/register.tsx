import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Car, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/config/theme';
type Role = 'RIDER' | 'DRIVER';
export default function Register() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [role, setRole] = useState<Role | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (password && password.length < 8) errs.password = 'At least 8 characters';
    if (role === 'DRIVER' && !licensePlate.trim()) errs.licensePlate = 'License plate is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role!,
        licensePlate: role === 'DRIVER' ? licensePlate.trim() : undefined,
      });
      Alert.alert('Success', 'Account created! Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setLoading(false);
    }
  };  
  if (!role) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.roleHeader}>
          <Text style={styles.title}>Join Locus</Text>
          <Text style={styles.subtitle}>How would you like to use the app?</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.roleCards}>
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.7}
            onPress={() => setRole('RIDER')}
          >
            <View style={[styles.roleIcon, { backgroundColor: Colors.primaryLight }]}>
              <User size={28} color={Colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.roleTitle}>Rider</Text>
            <Text style={styles.roleDesc}>Request rides and get where you need to go</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.7}
            onPress={() => setRole('DRIVER')}
          >
            <View style={[styles.roleIcon, { backgroundColor: Colors.secondaryLight }]}>
              <Car size={28} color={Colors.secondary} strokeWidth={1.8} />
            </View>
            <Text style={styles.roleTitle}>Driver</Text>
            <Text style={styles.roleDesc}>Earn money by driving passengers around</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }  
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {}
        <TouchableOpacity
          onPress={() => setRole(null)}
          style={styles.backButton}
          hitSlop={12}
        >
          <ChevronLeft size={20} color={Colors.primary} />
          <Text style={styles.backText}>Change role</Text>
        </TouchableOpacity>
        {}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={styles.title}>
            Sign up as {role === 'RIDER' ? 'Rider' : 'Driver'}
          </Text>
          <Text style={styles.subtitle}>Create your account to get started</Text>
        </Animated.View>
        {}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.form}>
          <View style={styles.nameRow}>
            <Input
              label="First name"
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              containerStyle={styles.nameInput}
              icon={<User size={18} color={Colors.textSecondary} />}
            />
            <Input
              label="Last name"
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              containerStyle={styles.nameInput}
            />
          </View>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            icon={<Mail size={18} color={Colors.textSecondary} />}
          />
          <Input
            label="Password"
            placeholder="Min 8 characters, 1 uppercase, 1 number, 1 symbol"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            icon={<Lock size={18} color={Colors.textSecondary} />}
          />
          {role === 'DRIVER' && (
            <Input
              label="License plate"
              placeholder="e.g. ABC-1234"
              value={licensePlate}
              onChangeText={setLicensePlate}
              autoCapitalize="characters"
              error={errors.licensePlate}
              icon={<Car size={18} color={Colors.textSecondary} />}
            />
          )}
          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />
        </Animated.View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  backText: {
    ...Typography.subhead,
    color: Colors.primary,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  roleHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.callout,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  roleCards: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  roleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  roleTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  roleDesc: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameInput: {
    flex: 1,
  },
  button: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  footerLink: {
    ...Typography.subhead,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
