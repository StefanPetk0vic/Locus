import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Plus, Warehouse } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { vehicleApi, VehicleResponse } from '../../src/services/api';
import VehicleCard, { VehicleItem } from '../../src/components/VehicleCard';
import AddVehicleModal from '../../src/components/AddVehicleModal';
import { Typography, Spacing, BorderRadius } from '../../src/config/theme';

/* soft-black pastel palette */
const G = {
  bg: '#1A1A1E',
  surface: '#242428',
  accent: '#FFD400',
  accentDim: '#FFD40033',
  text: '#F0F0F0',
  textSec: '#9A9A9F',
  border: '#3A3A3F',
} as const;

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchVehicles = useCallback(async () => {
    try {
      const { data } = await vehicleApi.getMyVehicles();
      setVehicles(
        data.map((v: VehicleResponse) => ({
          id: v.id,
          make: v.make,
          model: v.model,
          licensePlate: v.licensePlate,
          color: v.color,
          isActive: v.isActive,
        })),
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleActivate = async (id: string) => {
    try {
      await vehicleApi.activateVehicle(id);
      fetchVehicles();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to activate');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Vehicle', 'Are you sure you want to remove this vehicle from your garage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await vehicleApi.deleteVehicle(id);
            fetchVehicles();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Garage</Text>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={styles.addBtn}
            activeOpacity={0.7}
          >
            <Plus size={22} color={G.accent} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Manage your vehicles</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={G.accent} />
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <VehicleCard
                vehicle={item}
                index={index}
                onActivate={handleActivate}
                onDelete={handleDelete}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Animated.View entering={FadeInDown.duration(400)} style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Warehouse size={48} color={G.border} strokeWidth={1.2} />
                </View>
                <Text style={styles.emptyTitle}>Garage is empty</Text>
                <Text style={styles.emptyDesc}>
                  Add your vehicles to manage them and start accepting rides.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setShowAdd(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={G.bg} />
                  <Text style={styles.emptyAddText}>Add Vehicle</Text>
                </TouchableOpacity>
              </Animated.View>
            }
          />
        )}
      </SafeAreaView>

      <AddVehicleModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={fetchVehicles}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: G.bg,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerTitle: {
    ...Typography.title1,
    color: G.text,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: G.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...Typography.subhead,
    color: G.textSec,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.title3,
    color: G.text,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    ...Typography.subhead,
    color: G.textSec,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: Spacing.lg,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: G.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyAddText: {
    ...Typography.headline,
    color: G.bg,
    fontSize: 15,
  },
});
