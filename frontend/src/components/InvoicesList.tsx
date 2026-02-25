import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Receipt, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../config/theme';
import { paymentApi, InvoiceResponse } from '../services/api';
import { reverseGeocode } from '../utils/reverseGeocode';
import { rideApi } from '../services/api';

interface DisplayInvoice extends InvoiceResponse {
  pickupAddress?: string;
  destAddress?: string;
}

function statusColor(status: string) {
  switch (status) {
    case 'PAID':
      return Colors.success;
    case 'AUTHORIZED':
      return Colors.primary;
    case 'FAILED':
      return Colors.error;
    case 'CANCELLED':
    case 'REFUNDED':
      return Colors.textSecondary;
    default:
      return Colors.secondary;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'AUTHORIZED':
      return 'Authorized';
    case 'FAILED':
      return 'Failed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return status;
  }
}

function InvoiceCard({ invoice, index }: { invoice: DisplayInvoice; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(invoice.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = new Date(invoice.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.cardLeft}>
          <Receipt size={18} color={Colors.primary} />
          <View>
            <Text style={styles.cardDate}>{date}</Text>
            <Text style={styles.cardTime}>{time}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardAmount}>{invoice.amount} {invoice.currency}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(invoice.status) + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor(invoice.status) }]}>
              {statusLabel(invoice.status)}
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={16} color={Colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={Colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {invoice.pickupAddress && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{invoice.pickupAddress}</Text>
            </View>
          )}
          {invoice.destAddress && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{invoice.destAddress}</Text>
            </View>
          )}
          {invoice.paidAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Paid at</Text>
              <Text style={styles.detailValue}>
                {new Date(invoice.paidAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ride ID</Text>
            <Text style={[styles.detailValue, { fontSize: 11 }]}>{invoice.rideId}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

interface InvoicesListProps {
  visible: boolean;
  onClose: () => void;
}

export default function InvoicesList({ visible, onClose }: InvoicesListProps) {
  const [invoices, setInvoices] = useState<DisplayInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      const { data } = await paymentApi.getInvoices();

      // Resolve ride addresses for each invoice
      const enriched = await Promise.all(
        data.map(async (inv) => {
          try {
            const { data: rides } = await rideApi.getCompletedRides();
            const ride = rides.find((r) => r.id === inv.rideId);
            if (ride) {
              const [pickupAddress, destAddress] = await Promise.all([
                reverseGeocode(ride.pickupLat, ride.pickupLng),
                reverseGeocode(ride.destinationLat, ride.destinationLng),
              ]);
              return { ...inv, pickupAddress, destAddress };
            }
          } catch {}
          return inv as DisplayInvoice;
        }),
      );

      setInvoices(enriched);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchInvoices();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.overlay} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoices</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Payment history for your rides</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={invoices}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <InvoiceCard invoice={item} index={index} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Receipt size={40} color={Colors.border} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No invoices yet</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    zIndex: 100,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.title1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  list: {
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardDate: {
    ...Typography.callout,
    color: Colors.text,
  },
  cardTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  cardAmount: {
    ...Typography.headline,
    color: Colors.text,
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.caption,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    width: 60,
  },
  detailValue: {
    ...Typography.footnote,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.callout,
    color: Colors.textSecondary,
  },
});
