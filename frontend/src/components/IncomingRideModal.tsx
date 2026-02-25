import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Navigation2, Clock, Star } from 'lucide-react-native';
import Modal from './Modal';
import Button from './Button';
import UserRatingBadge from './UserRatingBadge';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { RideRequestData } from '../store/rideStore';
import { reverseGeocode } from '../utils/reverseGeocode';

interface Props {
  visible: boolean;
  onClose: () => void;
  ride: RideRequestData | null;
  onAccept: () => void;
  loading?: boolean;
}

export default function IncomingRideModal({
  visible,
  onClose,
  ride,
  onAccept,
  loading,
}: Props) {
  const [pickupAddr, setPickupAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');

  useEffect(() => {
    if (!ride) return;
    reverseGeocode(ride.pickup.lat, ride.pickup.lng).then(setPickupAddr);
    reverseGeocode(ride.destination.lat, ride.destination.lng).then(setDestAddr);
  }, [ride?.pickup.lat, ride?.pickup.lng, ride?.destination.lat, ride?.destination.lng]);

  if (!ride) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="New Ride Request" position="bottom">
      {/* Rider rating badge */}
      {ride.riderId && (
        <View style={styles.riderInfoRow}>
          <Text style={styles.riderLabel}>Rider rating:</Text>
          <UserRatingBadge userId={ride.riderId} />
        </View>
      )}

      {/* Route card with addresses */}
      <View style={styles.card}>
        <View style={styles.row}>
          <MapPin size={18} color={Colors.primary} />
          <View style={styles.info}>
            <Text style={styles.label}>Pickup</Text>
            <Text style={styles.value} numberOfLines={2}>
              {pickupAddr || 'Loading address...'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Navigation2 size={18} color={Colors.secondary} />
          <View style={styles.info}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value} numberOfLines={2}>
              {destAddr || 'Loading address...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Time */}
      <View style={styles.timeRow}>
        <Clock size={14} color={Colors.textSecondary} />
        <Text style={styles.timeText}>Just now</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Decline"
          variant="outline"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <Button
          title="Accept"
          onPress={onAccept}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  riderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  riderLabel: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  info: {
    flex: 1,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...Typography.subhead,
    color: Colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
    marginLeft: 34,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  timeText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
