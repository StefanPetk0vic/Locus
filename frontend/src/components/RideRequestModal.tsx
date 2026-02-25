import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MapPin, Navigation2, DollarSign, CreditCard, User, Car, Hash } from 'lucide-react-native';
import Modal from './Modal';
import Button from './Button';
import UserRatingBadge from './UserRatingBadge';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { useRideStore } from '../store/rideStore';
import { useAuthStore } from '../store/authStore';
import { rideApi, DriverInfoResponse } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onDriverMatched?: () => void;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  pickupLabel?: string;
  destLabel?: string;
  price?: number;
  distanceKm?: number;
}

export default function RideRequestModal({
  visible,
  onClose,
  onDriverMatched,
  pickupLat,
  pickupLng,
  destLat,
  destLng,
  pickupLabel = 'Current location',
  destLabel = 'Selected destination',
  price,
  distanceKm,
}: Props) {
  const { requestRide, isRequesting, currentRide } = useRideStore();
  const user = useAuthStore((s) => s.user);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfoResponse | null>(null);
  const [loadingDriverInfo, setLoadingDriverInfo] = useState(false);

  const hasPaymentMethod = user?.role === 'RIDER' ? !!user?.hasPaymentMethod : true;
  const driverMatched = !!(requested && currentRide?.driverId);

  const handleRequest = async () => {
    if (!hasPaymentMethod) {
      Alert.alert(
        'Payment Required',
        'You need to add a payment method before requesting a ride. Go to Profile → Payment Settings.',
      );
      return;
    }
    setError(null);
    try {
      await requestRide(pickupLat, pickupLng, destLat, destLng, price);
      setRequested(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to request ride';
      setError(msg);
      Alert.alert('Payment Error', msg);
    }
  };

  const handleClose = () => {
    if (driverMatched) {
      // Transition to the tracking view instead of blocking
      setRequested(false);
      setDriverInfo(null);
      onDriverMatched?.();
      return;
    }
    setRequested(false);
    setError(null);
    setDriverInfo(null);
    onClose();
  };

  useEffect(() => {
    if (driverMatched && currentRide?.id && !driverInfo) {
      setLoadingDriverInfo(true);
      rideApi
        .getDriverInfoForRide(currentRide.id)
        .then((res) => setDriverInfo(res.data))
        .catch(() => {})
        .finally(() => setLoadingDriverInfo(false));
    }
  }, [driverMatched, currentRide?.id]);

  useEffect(() => {
    if (driverMatched && driverInfo) {
      const timer = setTimeout(() => {
        setRequested(false);
        setDriverInfo(null);
        onDriverMatched?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [driverMatched, driverInfo]);

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={driverMatched ? 'Driver Found!' : 'Confirm Ride'}
      closable={true}
    >
      {/* Route info */}
      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <View style={styles.routeText}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeValue}>{pickupLabel}</Text>
          </View>
        </View>

        <View style={styles.line} />

        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
          <View style={styles.routeText}>
            <Text style={styles.routeLabel}>Destination</Text>
            <Text style={styles.routeValue}>{destLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceRow}>
        <DollarSign size={18} color={price ? Colors.text : Colors.textSecondary} />
        {price ? (
          <Text style={styles.priceTextBold}>{price} RSD</Text>
        ) : (
          <Text style={styles.priceText}>Calculating price...</Text>
        )}
        {distanceKm !== undefined && distanceKm > 0 && (
          <Text style={styles.distanceText}>({distanceKm.toFixed(1)} km)</Text>
        )}
      </View>

      {driverMatched ? (
        <View style={styles.driverInfoSection}>
          <View style={styles.driverMatchedBanner}>
            <Navigation2 size={20} color={Colors.success} />
            <Text style={styles.driverMatchedText}>Your driver is on the way!</Text>
          </View>

          {loadingDriverInfo ? (
            <View style={styles.loadingDriverRow}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={styles.loadingDriverText}>Loading driver details...</Text>
            </View>
          ) : driverInfo ? (
            <View style={styles.driverCard}>
              <View style={styles.driverRow}>
                <View style={styles.driverAvatar}>
                  <User size={22} color={Colors.surface} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>
                    {driverInfo.firstName} {driverInfo.lastName}
                  </Text>
                  <UserRatingBadge userId={driverInfo.driverId} compact />
                </View>
              </View>

              {/* Vehicle info */}
              {driverInfo.vehicle && (
                <View style={styles.vehicleSection}>
                  <View style={styles.vehicleRow}>
                    <Car size={16} color={Colors.textSecondary} />
                    <Text style={styles.vehicleText}>
                      {driverInfo.vehicle.color} {driverInfo.vehicle.make} {driverInfo.vehicle.model}
                    </Text>
                  </View>
                  <View style={styles.vehicleRow}>
                    <Hash size={16} color={Colors.textSecondary} />
                    <Text style={styles.plateText}>{driverInfo.vehicle.licensePlate}</Text>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </View>
      ) : requested && !currentRide?.driverId ? (
        <View style={styles.waitingContainer}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={styles.waitingText}>Looking for a driver nearby...</Text>
          <Button
            title="Cancel Request"
            variant="outline"
            onPress={() => {
              setRequested(false);
              setError(null);
              setDriverInfo(null);
              onClose();
            }}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      ) : !hasPaymentMethod ? (
        <View style={styles.noPaymentContainer}>
          <CreditCard size={20} color={Colors.secondary} />
          <Text style={styles.noPaymentText}>
            Add a payment method in Profile → Payment Settings before requesting a ride.
          </Text>
        </View>
      ) : (
        /* Initial state — confirm or cancel */
        <View style={styles.actionsRow}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={handleClose}
            style={{ flex: 1 }}
          />
          <Button
            title="Confirm Ride"
            onPress={handleRequest}
            loading={isRequesting}
            icon={<Navigation2 size={18} color="#fff" />}
            style={{ flex: 2 }}
          />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 4.5,
    marginVertical: Spacing.xs,
  },
  routeText: {
    flex: 1,
  },
  routeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeValue: {
    ...Typography.subhead,
    color: Colors.text,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  priceText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  priceTextBold: {
    ...Typography.headline,
    color: Colors.text,
    fontSize: 16,
  },
  distanceText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginLeft: 'auto' as any,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  waitingText: {
    ...Typography.callout,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  driverInfoSection: {
    gap: Spacing.md,
  },
  driverMatchedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: '#E8F9EE',
    borderRadius: BorderRadius.md,
  },
  driverMatchedText: {
    ...Typography.callout,
    color: Colors.success,
    fontFamily: 'Inter_600SemiBold',
  },
  loadingDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingDriverText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  driverCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: 2,
  },
  vehicleSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vehicleText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  plateText: {
    ...Typography.headline,
    color: Colors.text,
    fontSize: 16,
    letterSpacing: 1,
  },
  noPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.secondaryLight,
    borderRadius: BorderRadius.md,
  },
  noPaymentText: {
    ...Typography.footnote,
    color: Colors.secondary,
    flex: 1,
  },
});
