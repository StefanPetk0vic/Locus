import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { CreditCard, Trash2, Check } from 'lucide-react-native';
import Modal from './Modal';
import Button from './Button';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { STRIPE_PUBLISHABLE_KEY } from '../config/api';
import { paymentApi, PaymentMethodInfo } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPaymentMethodChanged?: () => void;
}

export default function PaymentSetupModal({ visible, onClose, onPaymentMethodChanged }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingCard, setExistingCard] = useState<PaymentMethodInfo | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState(''); // MM/YY
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (visible) fetchExistingCard();
  }, [visible]);

  const fetchExistingCard = async () => {
    setLoading(true);
    try {
      const { data } = await paymentApi.getPaymentMethod();
      setExistingCard(data);
    } catch {
      setExistingCard(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const createStripeToken = async (): Promise<string> => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const [expMonth, expYear] = expiry.split('/');

    const body = new URLSearchParams();
    body.append('card[number]', cleanNumber);
    body.append('card[exp_month]', expMonth);
    body.append('card[exp_year]', `20${expYear}`);
    body.append('card[cvc]', cvc);

    const response = await fetch('https://api.stripe.com/v1/tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error.message || 'Card validation failed');
    }

    return json.id; // tok_xxx
  };

  const handleAddCard = async () => {
    if (!cardNumber || !expiry || !cvc) {
      Alert.alert('Error', 'Please fill in all card fields.');
      return;
    }

    setSaving(true);
    try {
      const token = await createStripeToken();
      const { data } = await paymentApi.addCard(token);
      setExistingCard(data);
      setCardNumber('');
      setExpiry('');
      setCvc('');
      onPaymentMethodChanged?.();
      Alert.alert('Success', 'Card added successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to add card');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCard = async () => {
    Alert.alert('Remove Card', 'Are you sure you want to remove your card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await paymentApi.removePaymentMethod();
            setExistingCard(null);
            onPaymentMethodChanged?.();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to remove card');
          }
        },
      },
    ]);
  };

  const brandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MC';
      case 'amex':
        return 'AMEX';
      default:
        return brand?.toUpperCase() || 'CARD';
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Payment Method">
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : existingCard ? (
        /* ── Show existing card ── */
        <View>
          <View style={styles.cardDisplay}>
            <CreditCard size={24} color={Colors.primary} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardBrand}>{brandIcon(existingCard.brand)}</Text>
              <Text style={styles.cardDetails}>
                •••• •••• •••• {existingCard.last4}
              </Text>
              <Text style={styles.cardExpiry}>
                Expires {String(existingCard.expMonth).padStart(2, '0')}/{existingCard.expYear}
              </Text>
            </View>
            <View style={styles.activeIndicator}>
              <Check size={14} color={Colors.success} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveCard}>
            <Trash2 size={16} color={Colors.error} />
            <Text style={styles.removeBtnText}>Remove Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Add new card form ── */
        <View>
          <Text style={styles.formLabel}>Card Number</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={(t) => setCardNumber(formatCardNumber(t))}
            maxLength={19}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.formLabel}>Expiry</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
                maxLength={5}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.formLabel}>CVC</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                value={cvc}
                onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <Button
            title={saving ? 'Saving...' : 'Add Card'}
            onPress={handleAddCard}
            loading={saving}
            icon={<CreditCard size={18} color="#fff" />}
          />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  cardDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    ...Typography.caption,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardDetails: {
    ...Typography.headline,
    color: Colors.text,
    fontSize: 15,
    letterSpacing: 1.5,
  },
  cardExpiry: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F9EE',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activeText: {
    ...Typography.caption,
    color: Colors.success,
    fontFamily: 'Inter_600SemiBold',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  removeBtnText: {
    ...Typography.callout,
    color: Colors.error,
  },
  formLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.callout,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
});
