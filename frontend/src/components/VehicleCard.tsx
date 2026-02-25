import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Car, Hash, Palette, CheckCircle2, Trash2 } from 'lucide-react-native';
import { Spacing, BorderRadius, Typography } from '../config/theme';

/* soft-black pastel palette for Garage */
const G = {
  bg: '#1A1A1E',
  surface: '#242428',
  surfaceAlt: '#2E2E33',
  accent: '#FFD400',
  accentDim: '#FFD40033',
  text: '#F0F0F0',
  textSec: '#9A9A9F',
  border: '#3A3A3F',
  success: '#4ADE80',
  danger: '#FF6B6B',
} as const;

export interface VehicleItem {
  id: string;
  make: string;
  model: string;
  licensePlate: string;
  color: string;
  isActive: boolean;
}

interface Props {
  vehicle: VehicleItem;
  index: number;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function VehicleCard({ vehicle, index, onActivate, onDelete }: Props) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Car size={22} color={G.accent} strokeWidth={1.5} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.makeModel}>
            {vehicle.make} {vehicle.model}
          </Text>
          <View style={styles.plateRow}>
            <Hash size={12} color={G.textSec} />
            <Text style={styles.plate}>{vehicle.licensePlate}</Text>
          </View>
        </View>
        {vehicle.isActive && (
          <View style={styles.activeBadge}>
            <CheckCircle2 size={12} color={G.success} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>

      {/* Color row */}
      <View style={styles.colorRow}>
        <Palette size={14} color={G.textSec} />
        <Text style={styles.colorText}>{vehicle.color}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!vehicle.isActive && (
          <TouchableOpacity
            style={styles.activateBtn}
            onPress={() => onActivate(vehicle.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.activateBtnText}>Set Active</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(vehicle.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={G.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: G.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: G.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: G.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  makeModel: {
    ...Typography.headline,
    color: G.text,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  plate: {
    ...Typography.footnote,
    color: G.textSec,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4ADE8020',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activeText: {
    ...Typography.caption,
    color: G.success,
    fontFamily: 'Inter_600SemiBold',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingLeft: 44 + Spacing.md,
  },
  colorText: {
    ...Typography.footnote,
    color: G.textSec,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  activateBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: G.accentDim,
  },
  activateBtnText: {
    ...Typography.footnote,
    color: G.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
