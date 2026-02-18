import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Navigation2, Clock } from 'lucide-react-native';
import Modal from './Modal';
import Button from './Button';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { RideRequestData } from '../store/rideStore';
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
  if (!ride) return null;
  return (
    <Modal visible={visible} onClose={onClose} title="New Ride Request" position="bottom">
      {}
      <View style={styles.card}>
        <View style={styles.row}>
          <MapPin size={18} color={Colors.primary} />
          <View style={styles.info}>
            <Text style={styles.label}>Pickup</Text>
            <Text style={styles.value}>
              {ride.pickup.lat.toFixed(4)}, {ride.pickup.lng.toFixed(4)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Navigation2 size={18} color={Colors.secondary} />
          <View style={styles.info}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value}>
              {ride.destination.lat.toFixed(4)}, {ride.destination.lng.toFixed(4)}
            </Text>
          </View>
        </View>
      </View>
      {}
      <View style={styles.timeRow}>
        <Clock size={14} color={Colors.textSecondary} />
        <Text style={styles.timeText}>Just now</Text>
      </View>
      {}
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
