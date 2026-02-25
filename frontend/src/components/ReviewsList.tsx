import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Star, MessageSquare, User } from 'lucide-react-native';
import Modal from './Modal';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { reviewApi, ReviewResponse, RatingResponse } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  title?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          color={s <= rating ? Colors.secondary : Colors.border}
          fill={s <= rating ? Colors.secondary : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review, index }: { review: ReviewResponse; index: number }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarSmall}>
          <User size={14} color={Colors.textSecondary} />
        </View>
        <StarRating rating={review.rating} />
        <Text style={styles.cardDate}>{date}</Text>
      </View>
      {review.comment ? (
        <Text style={styles.commentText}>{review.comment}</Text>
      ) : (
        <Text style={styles.noComment}>No comment</Text>
      )}
    </View>
  );
}

export default function ReviewsList({ visible, onClose, userId, title = 'Reviews' }: Props) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [rating, setRating] = useState<RatingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !userId) return;
    setLoading(true);
    Promise.all([
      reviewApi.getReviewsForUser(userId),
      reviewApi.getAverageRating(userId),
    ])
      .then(([revRes, ratRes]) => {
        setReviews(revRes.data);
        setRating(ratRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, userId]);

  return (
    <Modal visible={visible} onClose={onClose} title={title} scrollable={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <>
          {/* Rating Summary */}
          {rating && (
            <View style={styles.summaryCard}>
              <Text style={styles.avgRating}>
                {rating.average !== null ? rating.average.toFixed(1) : '—'}
              </Text>
              <StarRating rating={Math.round(rating.average || 0)} />
              <Text style={styles.countText}>
                {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
          )}

          {/* Reviews List */}
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <ReviewCard review={item} index={index} />}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MessageSquare size={32} color={Colors.border} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No reviews yet</Text>
              </View>
            }
          />
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  avgRating: {
    ...Typography.largeTitle,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  countText: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  list: {
    maxHeight: 350,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  commentText: {
    ...Typography.subhead,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  noComment: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.callout,
    color: Colors.textSecondary,
  },
});
