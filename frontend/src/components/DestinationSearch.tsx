import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import { ArrowLeft, MapPin, Navigation, X } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../config/theme';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

interface DestinationSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dest: { lat: number; lng: number; label: string }) => void;
  userLat?: number;
  userLng?: number;
  
  title?: string;
  
  placeholder?: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export default function DestinationSearch({
  visible,
  onClose,
  onSelect,
  userLat,
  userLng,
  title = 'Where to?',
  placeholder = 'Search destination',
}: DestinationSearchProps) {
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  const search = async (text: string) => {
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: text,
        format: 'json',
        limit: '8',
        addressdetails: '1',
      });
      if (userLat && userLng) {
        params.set('viewbox', `${userLng - 0.5},${userLat + 0.5},${userLng + 0.5},${userLat - 0.5}`);
        params.set('bounded', '0');
      }
      const resp = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        headers: { 'User-Agent': 'LocusApp/1.0' },
      });
      const data = await resp.json();
      setResults(
        data.map((item: any) => ({
          id: item.place_id.toString(),
          title: item.display_name.split(',')[0],
          subtitle: item.display_name.split(',').slice(1, 3).join(',').trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        })),
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 500);
  };

  const handleSelect = (item: SearchResult) => {
    Keyboard.dismiss();
    onSelect({ lat: item.lat, lng: item.lng, label: item.title });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <View style={styles.dot} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={handleTextChange}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.tapHint}
        activeOpacity={0.7}
        onPress={() => {
          onClose();
        }}
      >
        <Navigation size={18} color={Colors.primary} />
        <Text style={styles.tapHintText}>Or tap on the map to set destination</Text>
      </TouchableOpacity>
      
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        ListEmptyComponent={
          query.length >= 3 && !loading ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View>
            <TouchableOpacity
              style={styles.resultRow}
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.resultIcon}>
                <MapPin size={18} color={Colors.primary} />
              </View>
              <View style={styles.resultText}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const TOP_INSET = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 8;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    zIndex: 100,
    paddingTop: TOP_INSET,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  inputContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  input: {
    flex: 1,
    ...Typography.callout,
    color: Colors.text,
    padding: 0,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tapHintText: {
    ...Typography.footnote,
    color: Colors.primary,
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    ...Typography.callout,
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
  },
  resultSubtitle: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
