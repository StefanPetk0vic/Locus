import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MapPin, Navigation2, DollarSign, CreditCard } from 'lucide-react-native';
import Modal from './Modal';
import Button from './Button';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { useRideStore } from '../store/rideStore';
import { useAuthStore } from '../store/authStore';

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

  const hasPaymentMethod = user?.role === 'RIDER' ? !!user?.hasPaymentMethod : true;

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
    setRequested(false);
    setError(null);
    onClose();
  };
  
  useEffect(() => {
    if (requested && currentRide?.driverId) {
      const timer = setTimeout(() => {
        setRequested(false);
        onDriverMatched?.();
      }, 1200); 
      return () => clearTimeout(timer);
    }
  }, [currentRide?.driverId, requested]);

  return (
    <Modal visible={visible} onClose={handleClose} title="Confirm Ride">
      {}
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

      {}
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

      {}
      {requested && !currentRide?.driverId ? (
        <View style={styles.waitingContainer}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={styles.waitingText}>Looking for a driver nearby...</Text>
        </View>
      ) : currentRide?.driverId ? (
        <View style={styles.matchedContainer}>
          <Navigation2 size={20} color={Colors.success} />
          <Text style={styles.matchedText}>Driver is on the way!</Text>
        </View>      ) : !hasPaymentMethod ? (
        <View style={styles.noPaymentContainer}>
          <CreditCard size={20} color={Colors.secondary} />
          <Text style={styles.noPaymentText}>
            Add a payment method in Profile → Payment Settings before requesting a ride.
          </Text>
        </View>      ) : (
        <Button
          title="Request Ride"
          onPress={handleRequest}
          loading={isRequesting}
          icon={<MapPin size={18} color="#fff" />}
        />
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
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  waitingText: {
    ...Typography.callout,
    color: Colors.textSecondary,
  },
  matchedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: '#E8F9EE',
    borderRadius: BorderRadius.md,
  },
  matchedText: {
    ...Typography.callout,
    color: Colors.success,
    fontFamily: 'Inter_600SemiBold',
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
