import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Car, Hash, Palette } from 'lucide-react-native';
import Modal from './Modal';
import Button from './Button';
import { Colors, Typography, Spacing, BorderRadius } from '../config/theme';
import { vehicleApi, VehiclePayload } from '../services/api';

/* Garage dark palette */
const G = {
  bg: '#1A1A1E',
  surface: '#242428',
  accent: '#FFD400',
  text: '#F0F0F0',
  textSec: '#9A9A9F',
  border: '#3A3A3F',
} as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddVehicleModal({ visible, onClose, onAdded }: Props) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!make.trim() || !model.trim() || !licensePlate.trim() || !color.trim()) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const payload: VehiclePayload = {
        make: make.trim(),
        model: model.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        color: color.trim(),
      };
      await vehicleApi.addVehicle(payload);
      setMake('');
      setModel('');
      setLicensePlate('');
      setColor('');
      onAdded();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to add vehicle';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Add Vehicle">
      <GarageInput
        label="Make"
        placeholder="e.g. Toyota"
        value={make}
        onChangeText={setMake}
        icon={<Car size={18} color={Colors.textSecondary} />}
      />
      <GarageInput
        label="Model"
        placeholder="e.g. Camry"
        value={model}
        onChangeText={setModel}
        icon={<Car size={18} color={Colors.textSecondary} />}
      />
      <GarageInput
        label="License Plate"
        placeholder="e.g. ABC-1234"
        value={licensePlate}
        onChangeText={setLicensePlate}
        autoCapitalize="characters"
        icon={<Hash size={18} color={Colors.textSecondary} />}
      />
      <GarageInput
        label="Color"
        placeholder="e.g. White"
        value={color}
        onChangeText={setColor}
        icon={<Palette size={18} color={Colors.textSecondary} />}
      />
      <Button
        title="Add to Garage"
        onPress={handleSave}
        loading={loading}
        style={{ marginTop: Spacing.sm }}
      />
    </Modal>
  );
}

/* Inline input to reuse existing Input style */
import Input from './Input';

function GarageInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} />;
}
