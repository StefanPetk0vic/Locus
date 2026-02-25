import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Clock, Star } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/config/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rideApi, RideResponse, paymentApi, InvoiceResponse } from '../../src/services/api';
import { reverseGeocode } from '../../src/utils/reverseGeocode';
import ReviewModal from '../../src/components/ReviewModal';

interface DisplayRide extends RideResponse {
  pickupAddress: string;
  destAddress: string;
  paymentStatus?: string;
}

function RideCard({
  ride,
  index,
  onReview,
}: {
  ride: DisplayRide;
  index: number;
  onReview: (rideId: string) => void;
}) {
  const date = new Date(ride.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{date}</Text>
        <Text style={styles.cardStatus}>Completed</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {ride.pickupAddress}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {ride.destAddress}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.price}>
            {ride.price ? `${ride.price} RSD` : '—'}
          </Text>
          {ride.paymentStatus && (
            <Text style={[styles.paymentStatus, {
              color: ride.paymentStatus === 'PAID' ? Colors.success : Colors.textSecondary,
            }]}>
              {ride.paymentStatus === 'PAID' ? '✓ Paid' : ride.paymentStatus}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => onReview(ride.id)}
          activeOpacity={0.7}
        >
          <Star size={14} color={Colors.secondary} />
          <Text style={styles.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const [rides, setRides] = useState<DisplayRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewRideId, setReviewRideId] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    try {
      const [ridesRes, invoicesRes] = await Promise.all([
        rideApi.getCompletedRides(),
        paymentApi.getInvoices().catch(() => ({ data: [] as InvoiceResponse[] })),
      ]);
      const data = ridesRes.data;
      const invoices = invoicesRes.data;

      // Build a map from rideId → invoice status
      const invoiceMap = new Map<string, string>();
      for (const inv of invoices) {
        invoiceMap.set(inv.rideId, inv.status);
      }

      /* Resolve addresses in parallel */
      const withAddresses = await Promise.all(
        data.map(async (r: RideResponse) => {
          const [pickupAddress, destAddress] = await Promise.all([
            reverseGeocode(r.pickupLat, r.pickupLng),
            reverseGeocode(r.destinationLat, r.destinationLng),
          ]);
          return {
            ...r,
            pickupAddress,
            destAddress,
            paymentStatus: invoiceMap.get(r.id),
          } as DisplayRide;
        }),
      );
      setRides(withAddresses);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your completed rides</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={rides}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <RideCard
                ride={item}
                index={index}
                onReview={(id) => setReviewRideId(id)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Clock size={40} color={Colors.border} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No completed rides yet</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Review Modal */}
      {reviewRideId && (
        <ReviewModal
          visible={!!reviewRideId}
          onClose={() => setReviewRideId(null)}
          rideId={reviewRideId}
          onSubmitted={fetchRides}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardDate: {
    ...Typography.footnote,
    color: Colors.textSecondary,
  },
  cardStatus: {
    ...Typography.footnote,
    color: Colors.success,
    fontFamily: 'Inter_600SemiBold',
  },
  route: {
    marginBottom: Spacing.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 3.5,
    marginVertical: 2,
  },
  routeText: {
    ...Typography.callout,
    color: Colors.text,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...Typography.headline,
    color: Colors.text,
  },
  paymentStatus: {
    ...Typography.caption,
    marginTop: 2,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondaryLight,
  },
  reviewBtnText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontFamily: 'Inter_600SemiBold',
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
