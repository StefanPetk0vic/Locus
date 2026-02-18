import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Button from '../src/components/Button';
import { Colors, Typography, Spacing } from '../src/config/theme';
export default function NotFound() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.message}>Page not found</Text>
      <Button
        title="Go Back"
        variant="outline"
        onPress={() => router.back()}
        icon={<ArrowLeft size={18} color={Colors.primary} />}
        style={styles.btn}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  code: {
    ...Typography.largeTitle,
    color: Colors.border,
    fontSize: 64,
  },
  message: {
    ...Typography.callout,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  btn: {
    paddingHorizontal: Spacing.xl,
  },
});
