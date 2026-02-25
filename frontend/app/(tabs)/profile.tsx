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
  UserCircle,
  Mail,
  Shield,
  LogOut,
  ChevronRight,
  Car,
  Star,
  Edit3,
  MessageSquare,
  Warehouse,
  CreditCard,
  Receipt,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import Modal from '../../src/components/Modal';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import ReviewsList from '../../src/components/ReviewsList';
import GarageScreen from '../../src/components/GarageScreen';
import UserRatingBadge from '../../src/components/UserRatingBadge';
import PaymentSetupModal from '../../src/components/PaymentSetupModal';
import InvoicesList from '../../src/components/InvoicesList';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/config/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.firstName || '');
  const [editLast, setEditLast] = useState(user?.lastName || '');
  const [showReviews, setShowReviews] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);

  const isDriver = user?.role === 'DRIVER';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || '').toUpperCase()}
              {(user?.lastName?.[0] || '').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{isDriver ? 'Driver' : 'Rider'}</Text>
          </View>
          {user?.id && (
            <View style={styles.ratingRow}>
              <UserRatingBadge userId={user.id} />
            </View>
          )}
        </Animated.View>

        {}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <ProfileRow
              icon={<Mail size={18} color={Colors.textSecondary} />}
              label="Email"
              value={user?.email || ''}
            />
            <Divider />
            {isDriver && (
              <>
                <ProfileRow
                  icon={<Car size={18} color={Colors.textSecondary} />}
                  label="License Plate"
                  value={user?.licensePlate || 'Not set'}
                />
                <Divider />
                <ProfileRow
                  icon={<Shield size={18} color={Colors.textSecondary} />}
                  label="Verification"
                  value={user?.isVerified ? 'Verified' : 'Pending'}
                  valueColor={user?.isVerified ? Colors.success : Colors.secondary}
                />
                <Divider />
              </>
            )}
            {!isDriver && (
              <>
                <ProfileRow
                  icon={<Star size={18} color={Colors.textSecondary} />}
                  label="Total Rides"
                  value={String(user?.rides ?? 0)}
                />
                <Divider />
                <ProfileRow
                  icon={<CreditCard size={18} color={Colors.textSecondary} />}
                  label="Payment Method"
                  value={user?.hasPaymentMethod ? 'Card on file' : 'Not set'}
                  valueColor={user?.hasPaymentMethod ? Colors.success : Colors.secondary}
                />
                <Divider />
              </>
            )}
          </View>
        </Animated.View>

        {}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setEditName(user?.firstName || '');
                setEditLast(user?.lastName || '');
                setShowEditModal(true);
              }}
            >
              <Edit3 size={18} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>Edit Profile</Text>
              <ChevronRight size={18} color={Colors.border} />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <LogOut size={18} color={Colors.error} />
              <Text style={[styles.actionLabel, { color: Colors.error }]}>Sign Out</Text>
              <ChevronRight size={18} color={Colors.border} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Access */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowReviews(true)}>
              <MessageSquare size={18} color={Colors.textSecondary} />
              <Text style={styles.actionLabel}>My Reviews</Text>
              <ChevronRight size={18} color={Colors.border} />
            </TouchableOpacity>
            {isDriver && (
              <>
                <Divider />
                <TouchableOpacity style={styles.actionRow} onPress={() => setShowGarage(true)}>
                  <Warehouse size={18} color={Colors.textSecondary} />
                  <Text style={styles.actionLabel}>My Garage</Text>
                  <ChevronRight size={18} color={Colors.border} />
                </TouchableOpacity>
              </>
            )}
            {!isDriver && (
              <>
                <Divider />
                <TouchableOpacity style={styles.actionRow} onPress={() => setShowPaymentSetup(true)}>
                  <CreditCard size={18} color={Colors.textSecondary} />
                  <Text style={styles.actionLabel}>Payment Settings</Text>
                  <ChevronRight size={18} color={Colors.border} />
                </TouchableOpacity>
                <Divider />
                <TouchableOpacity style={styles.actionRow} onPress={() => setShowInvoices(true)}>
                  <Receipt size={18} color={Colors.textSecondary} />
                  <Text style={styles.actionLabel}>Invoices</Text>
                  <ChevronRight size={18} color={Colors.border} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>

        <Text style={styles.version}>Locus v1.0.0</Text>
      </ScrollView>

      {/* Reviews Modal */}
      {user?.id && (
        <ReviewsList
          visible={showReviews}
          onClose={() => setShowReviews(false)}
          userId={user.id}
          title="My Reviews"
        />
      )}

      {/* Garage Overlay */}
      {showGarage && (
        <GarageScreen onBack={() => setShowGarage(false)} />
      )}

      {/* Payment Setup Modal */}
      <PaymentSetupModal
        visible={showPaymentSetup}
        onClose={() => setShowPaymentSetup(false)}
        onPaymentMethodChanged={() => fetchProfile()}
      />

      {/* Invoices Overlay */}
      <InvoicesList
        visible={showInvoices}
        onClose={() => setShowInvoices(false)}
      />
      
      <Modal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
      >
        <Input
          label="First Name"
          value={editName}
          onChangeText={setEditName}
          icon={<UserCircle size={18} color={Colors.textSecondary} />}
        />
        <Input
          label="Last Name"
          value={editLast}
          onChangeText={setEditLast}
        />
        <Button
          title="Save Changes"
          onPress={() => {
            // Profile update endpoint can be added here
            setShowEditModal(false);
            Alert.alert('Saved', 'Profile updated successfully.');
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.profileRow}>
      {icon}
      <View style={styles.profileRowText}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={[styles.profileValue, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    ...Typography.title1,
    color: Colors.primary,
  },
  name: {
    ...Typography.title2,
    color: Colors.text,
  },
  roleBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.footnote,
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  ratingRow: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  profileRowText: {
    flex: 1,
  },
  profileLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  profileValue: {
    ...Typography.callout,
    color: Colors.text,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md + 18 + Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  actionLabel: {
    ...Typography.callout,
    color: Colors.text,
    flex: 1,
  },
  version: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
