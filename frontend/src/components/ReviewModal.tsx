import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, MessageSquare } from 'lucide-react-native';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { reviewApi, ReviewPayload } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  onSubmitted?: () => void;
}

export default function ReviewModal({ visible, onClose, rideId, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload: ReviewPayload = { rideId, rating, comment: comment.trim() || undefined };
      await reviewApi.createReview(payload);
      setRating(0);
      setComment('');
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit review';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setComment('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleSkip} title="Rate Your Ride">
      <Text style={styles.subtitle}>How was your experience?</Text>

      {/* Star Rating */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
            <Star
              size={36}
              color={s <= rating ? Colors.secondary : Colors.border}
              fill={s <= rating ? Colors.secondary : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
      </View>

      {rating > 0 && (
        <Text style={styles.ratingLabel}>
          {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Excellent'}
        </Text>
      )}

      {/* Comment */}
      <Input
        label="Comment (optional)"
        placeholder="Share your thoughts..."
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        icon={<MessageSquare size={18} color={Colors.textSecondary} />}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Leave a Review" onPress={handleSubmit} loading={loading} style={styles.submitBtn} />

      <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ratingLabel: {
    ...Typography.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: {
    ...Typography.callout,
    color: Colors.textSecondary,
  },
});
