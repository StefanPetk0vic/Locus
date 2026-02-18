import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Car,
  Plus,
  Palette,
  Hash,
  CircleDot,
  CheckCircle2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { userApi } from '../../src/services/api';
import Modal from '../../src/components/Modal';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/config/theme';

export default function VehicleScreen() {
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [showAddModal, setShowAddModal] = useState(false);
  const [licensePlate, setLicensePlate] = useState(user?.licensePlate || '');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [saving, setSaving] = useState(false);

  const hasVehicle = !!user?.licensePlate;

  const handleSave = async () => {
    if (!licensePlate.trim()) {
      Alert.alert('Required', 'Please enter a license plate number.');
      return;
    }
    setSaving(true);
    try {
      await userApi.updateLicensePlate(user!.id, licensePlate.trim());
      await fetchProfile();
      setShowAddModal(false);
      Alert.alert('Saved', 'Vehicle information updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Vehicle</Text>
        <Text style={styles.subtitle}>Manage your vehicle details</Text>

        {hasVehicle ? (
          
          <Animated.View entering={FadeInDown.duration(400)} style={styles.vehicleCard}>
            <View style={styles.vehicleIcon}>
              <Car size={32} color={Colors.primary} strokeWidth={1.5} />
            </View>

            <View style={styles.vehicleInfo}>
              <View style={styles.infoRow}>
                <Hash size={15} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>License Plate</Text>
                <Text style={styles.infoValue}>{user?.licensePlate}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <CheckCircle2 size={15} color={user?.isVerified ? Colors.success : Colors.textSecondary} />
                <Text style={styles.infoLabel}>Status</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: user?.isVerified ? Colors.success : Colors.secondary },
                  ]}
                >
                  {user?.isVerified ? 'Verified' : 'Pending review'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setLicensePlate(user?.licensePlate || '');
                setShowAddModal(true);
              }}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* ── Empty state ── */
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Car size={48} color={Colors.border} strokeWidth={1.2} />
            </View>
            <Text style={styles.emptyTitle}>No vehicle added</Text>
            <Text style={styles.emptyDesc}>
              Add your vehicle details to start accepting ride requests.
            </Text>
            <Button
              title="Add Vehicle"
              onPress={() => setShowAddModal(true)}
              icon={<Plus size={18} color="#fff" />}
              style={styles.addBtn}
            />
          </Animated.View>
        )}
        
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderRow}>
              <Car size={18} color={Colors.textSecondary} />
              <Text style={styles.placeholderLabel}>Make & Model</Text>
              <Text style={styles.placeholderValue}>Coming soon</Text>
            </View>
            <View style={styles.placeholderDivider} />
            <View style={styles.placeholderRow}>
              <Palette size={18} color={Colors.textSecondary} />
              <Text style={styles.placeholderLabel}>Color</Text>
              <Text style={styles.placeholderValue}>Coming soon</Text>
            </View>
            <View style={styles.placeholderDivider} />
            <View style={styles.placeholderRow}>
              <CircleDot size={18} color={Colors.textSecondary} />
              <Text style={styles.placeholderLabel}>Year</Text>
              <Text style={styles.placeholderValue}>Coming soon</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={hasVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <Input
          label="License Plate"
          placeholder="e.g. ABC-1234"
          value={licensePlate}
          onChangeText={setLicensePlate}
          autoCapitalize="characters"
          icon={<Hash size={18} color={Colors.textSecondary} />}
        />
        <Input
          label="Make & Model (optional)"
          placeholder="e.g. Toyota Camry"
          value={vehicleMake}
          onChangeText={setVehicleMake}
          icon={<Car size={18} color={Colors.textSecondary} />}
        />
        <Input
          label="Color (optional)"
          placeholder="e.g. White"
          value={vehicleColor}
          onChangeText={setVehicleColor}
          icon={<Palette size={18} color={Colors.textSecondary} />}
        />
        <Button
          title="Save"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: Spacing.sm }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...Typography.title1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  vehicleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  vehicleInfo: {
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...Typography.callout,
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  editBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
  },
  editBtnText: {
    ...Typography.subhead,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: Spacing.lg,
  },
  addBtn: {
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  placeholderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  placeholderLabel: {
    ...Typography.callout,
    color: Colors.text,
    flex: 1,
  },
  placeholderValue: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  placeholderDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md + 18 + Spacing.sm,
  },
});
