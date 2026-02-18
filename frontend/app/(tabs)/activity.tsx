import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Clock, MapPin, Navigation2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/config/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
interface MockRide {
  id: string;
  date: string;
  from: string;
  to: string;
  price: string;
  status: string;
}
const mockHistory: MockRide[] = [
  {
    id: '1',
    date: 'Feb 17, 2026',
    from: 'Home',
    to: 'City Centre',
    price: '$8.50',
    status: 'Completed',
  },
  {
    id: '2',
    date: 'Feb 16, 2026',
    from: 'Office',
    to: 'Airport',
    price: '$24.00',
    status: 'Completed',
  },
  {
    id: '3',
    date: 'Feb 14, 2026',
    from: 'Mall',
    to: 'Home',
    price: '$11.20',
    status: 'Cancelled',
  },
];
function RideCard({ ride, index }: { ride: MockRide; index: number }) {
  const isCancelled = ride.status === 'Cancelled';
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{ride.date}</Text>
        <Text
          style={[
            styles.cardStatus,
            isCancelled && { color: Colors.error },
          ]}
        >
          {ride.status}
        </Text>
      </View>
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText}>{ride.from}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.routeText}>{ride.to}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.price}>{ride.price}</Text>
      </View>
    </Animated.View>
  );
}
export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your recent rides</Text>
        <FlatList
          data={mockHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <RideCard ride={item} index={index} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Clock size={40} color={Colors.border} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No rides yet</Text>
            </View>
          }
        />
      </View>
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
  },
  price: {
    ...Typography.headline,
    color: Colors.text,
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
