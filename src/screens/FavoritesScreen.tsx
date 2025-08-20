// src/screens/FavoritesScreen.tsx
import React, { useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { Text, Button, Icon, useTheme, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { useFavorites } from '@/store/useFavorites';
import ItemCard from '@/components/ItemCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/../App';
import { useGlobalBlocker } from '@/hooks/useGlobalBlocker';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Favorites'>;

// Layout constants
const CONTENT_MAX = 1200; // web max width
const GAP = 16;

// ✅ Safe web detection (no Platform typing issues)
const IS_WEB = typeof document !== 'undefined';

export default function FavoritesScreen() {
  const { favorites, reset, hasHydrated } = useFavorites() as {
    favorites: string[];
    reset: () => void;
    hasHydrated: boolean;
  };

  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();

  const count = favorites.length;

  // Block until Zustand has rehydrated
  useGlobalBlocker(!hasHydrated, undefined, hasHydrated, 'Laddar favoriter...');

  // Center/limit width on web only
  const contentWidth = Math.min(width - 24, CONTENT_MAX);

  // Column count (used for native list only)
  const columns = useMemo(() => {
    if (IS_WEB) return 0; // not used on web
    if (width >= 1100) return 5;
    if (width >= 900) return 4;
    if (width >= 680) return 3;
    return 2;
  }, [width]);

  // ---------- Web grid ----------
  const WebGrid = () => (
    <View style={{ flex: 1, alignItems: 'center' }}>
      {count === 0 ? (
        // ⬅️ Viktigt: flex:1 så tomvyn får höjd
        <View style={[styles.list, styles.fill, { width: contentWidth }]}>{EmptyState}</View>
      ) : (
        <View
          style={[
            styles.gridContainer as any,
            {
              maxWidth: contentWidth,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: GAP,
              width: '100%',
              paddingTop: 12,
              paddingBottom: 12,
            } as any,
          ]}
        >
          {favorites.map((name) => (
            <View key={name} style={{ width: '100%' }}>
              <ItemCard name={name} onPress={() => navigation.navigate('Details', { name })} />
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // ---------- Native list (FlashList) ----------
  const ListComponent: any = IS_WEB ? FlatList : FlashList;
  const keyExtractor = useCallback((name: string) => name, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => (
      <View style={{ flex: 1, marginBottom: GAP }}>
        <ItemCard name={item} onPress={() => navigation.navigate('Details', { name: item })} />
      </View>
    ),
    [navigation],
  );

  const EmptyState = (
    <View style={styles.emptyContainer}>
      <Icon source="heart-outline" size={72} color={theme.colors.onSurfaceVariant} />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        Inga favoriter ännu
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
      >
        Spara Pokémon som favoriter för att snabbt hitta dem här.
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Home')}
        style={styles.exploreButton}
        icon="magnify"
      >
        Utforska Pokémon
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Hero */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={[styles.heroInner, { maxWidth: IS_WEB ? contentWidth : undefined }]}>
          <View style={styles.heroTitleRow}>
            <Icon source="heart" size={22} color="white" />
            <Text variant="titleLarge" style={styles.heroTitle}>
              Mina favoriter
            </Text>
          </View>
          <Text variant="labelLarge" style={styles.heroSubtitle}>
            {count === 0 ? 'Du har inga favoriter ännu' : `${count} sparad${count > 1 ? 'e' : ''}`}
          </Text>
        </View>
      </LinearGradient>

      {/* Section header */}
      <View
        style={[
          styles.sectionHeader,
          { alignSelf: 'center', width: IS_WEB ? contentWidth : '100%' },
        ]}
      >
        <View style={styles.sectionRow}>
          <Text variant="labelLarge" style={{ opacity: 0.7 }}>
            Snabb åtkomst
          </Text>
          {count > 0 && (
            <Button
              compact
              mode="text"
              icon="delete-outline"
              onPress={reset}
              accessibilityLabel="Rensa alla favoriter"
            >
              Rensa alla
            </Button>
          )}
        </View>
        <Divider style={{ opacity: 0.4, marginTop: 6 }} />
      </View>

      {/* Content */}
      {IS_WEB ? (
        <WebGrid />
      ) : (
        <View style={{ flex: 1 }}>
          {count === 0 ? (
            // ⬅️ Viktigt: flex:1 så tomvyn får höjd
            <View style={[styles.list, styles.fill]}>{EmptyState}</View>
          ) : (
            <ListComponent
              data={favorites}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              numColumns={columns}
              // ✅ No fixed widths on native; use flex and column spacing instead
              columnWrapperStyle={
                columns > 1 ? { justifyContent: 'space-between', paddingHorizontal: 12 } : undefined
              }
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={<View style={{ height: 12 }} />}
              estimatedItemSize={180}
              key={`cols-${columns}`} // reflow on rotation/width change
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
  },
  heroInner: {
    width: '100%',
    paddingHorizontal: 16,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: 'white',
  },
  heroSubtitle: {
    color: 'white',
    opacity: 0.9,
    marginTop: 2,
  },
  sectionHeader: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ✅ Mobile-friendly: simple vertical padding; no width math
  list: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  // Web-only wrapper (ignored on native)
  gridContainer: {
    paddingHorizontal: 12,
  } as any,

  // ⬅️ Används för att ge höjd åt tomvyn
  fill: {
    flex: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
  },
});
