// src/screens/HomeScreen.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  RefreshControl,
  Keyboard,
  Platform,
  FlatList,
  useWindowDimensions,
  ListRenderItemInfo,
} from 'react-native';
import { Button, Text, Card, Icon, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/../App';
import ItemCard from '@/components/ItemCard';
import SearchBar from '@/components/SearchBar';
import { useFetch } from '@/hooks/useFetch';
import { useGlobalBlocker } from '@/hooks/useGlobalBlocker';

type PokemonListItem = { name: string; url: string };
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Responsiva konstanter
const CONTENT_MAX = 1200; // maxbredd på desktop
const GAP = 16; // avstånd mellan kort

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const { data, loading, error, refetch } = useFetch<{ results: PokemonListItem[] }>(
    'https://pokeapi.co/api/v2/pokemon?limit=151',
    { retry: 1, ttl: 10_000 },
  );
  const results = data?.results ?? [];

  // Filtrera via sök
  const list = useMemo(() => {
    if (!query) return results;
    const q = query.toLowerCase();
    return results.filter((x) => x.name.toLowerCase().includes(q));
  }, [results, query]);

  // Global overlay
  useGlobalBlocker(loading, error, results.length ? results : undefined, 'Laddar Kanto Pokédex...');

  // Responsiv bredd + kolumner
  const contentWidth = Math.min(width - 24, CONTENT_MAX);
  const columns = useMemo(() => {
    if (contentWidth >= 1100) return 5;
    if (contentWidth >= 900) return 4;
    if (contentWidth >= 680) return 3;
    return 2;
  }, [contentWidth]);
  const itemWidth = useMemo(() => {
    const totalGutters = GAP * (columns - 1);
    return Math.floor((contentWidth - totalGutters) / columns);
  }, [contentWidth, columns]);

  const keyExtractor = useCallback((item: PokemonListItem) => item.name, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<PokemonListItem>) => {
      const id = item.url.split('/').at(-2);
      const sprite = id
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        : undefined;
      const isLastInRow = (index + 1) % columns === 0;

      return (
        <View
          style={{
            width: itemWidth,
            marginRight: isLastInRow ? 0 : GAP,
            marginBottom: GAP,
          }}
        >
          <ItemCard
            name={item.name}
            spriteUrl={sprite}
            onPress={() => navigation.navigate('Details', { name: item.name })}
          />
        </View>
      );
    },
    [columns, itemWidth, navigation],
  );

  // Fel-fallback (overlay täcker mest "loading")
  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Card mode="elevated" style={{ width: '85%' }}>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">Något gick fel</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {String(error)}
            </Text>
            <Button mode="contained" onPress={refetch}>
              Försök igen
            </Button>
          </Card.Content>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Topbar: centrerat innehåll */}
      <View style={styles.topbarWrap}>
        <View style={[styles.topbarInner, { maxWidth: contentWidth }]}>
          <SearchBar value={query} onChangeText={setQuery} />
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Kanto Pokédex
            </Text>
            <View style={styles.headerButtons}>
              <Button
                mode="contained"
                icon="heart"
                onPress={() => navigation.navigate('Favorites')}
                style={styles.headerBtn}
              >
                Mina favoriter
              </Button>
              <Button
                mode="outlined"
                icon="cog"
                onPress={() => navigation.navigate('Settings')}
                style={styles.headerBtn}
              >
                Inställningar
              </Button>
            </View>
          </View>
        </View>
      </View>

      {/* Lista – centrerad och responsiv */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <FlatList
          data={list}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={columns}
          // Viktigt: sätt fast content-bredd och lägg gutters i renderItem
          contentContainerStyle={[styles.listContent, { width: contentWidth }]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                Keyboard.dismiss();
                refetch();
              }}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon source="emoticon-sad-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleMedium" style={{ marginTop: 8 }}>
                Inga resultat
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                Ingen Pokémon matchar din sökning.
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 12 }} />}
          removeClippedSubviews={Platform.OS !== 'web'}
          initialNumToRender={16}
          windowSize={5}
          maxToRenderPerBatch={16}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbarWrap: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  topbarInner: {
    width: '100%',
    gap: 8,
  },
  header: {
    paddingHorizontal: 0,
    paddingTop: 4,
    gap: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerBtn: {
    borderRadius: 999,
  },
  headerTitle: {
    marginBottom: 4,
  },

  listContent: {
    paddingTop: 12,
    paddingBottom: 12,
  },

  empty: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    gap: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
