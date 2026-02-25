import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Star } from 'lucide-react-native';
import { reviewApi, RatingResponse } from '../services/api';
import { Colors, Typography, Spacing } from '../config/theme';

interface Props {
  userId: string;
  compact?: boolean;
}

export default function UserRatingBadge({ userId, compact = false }: Props) {
  const [rating, setRating] = useState<RatingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    reviewApi
      .getAverageRating(userId)
      .then((res) => setRating(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="small" color={Colors.textSecondary} />;
  }

  if (!rating || rating.count === 0) {
    return compact ? null : (
      <Text style={styles.noRating}>No ratings yet</Text>
    );
  }

  return (
    <View style={styles.container}>
      <Star
        size={compact ? 12 : 14}
        color={Colors.secondary}
        fill={Colors.secondary}
        strokeWidth={1.5}
      />
      <Text style={[styles.ratingText, compact && styles.ratingTextCompact]}>
        {rating.average !== null ? rating.average.toFixed(1) : '—'}
      </Text>
      {!compact && (
        <Text style={styles.countText}>({rating.count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.footnote,
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
  },
  ratingTextCompact: {
    fontSize: 11,
  },
  countText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  noRating: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
