// src/screens/DetailsScreen.tsx
import React, { useLayoutEffect, useMemo } from 'react';
import { Image, ScrollView, View, Share, RefreshControl, useWindowDimensions } from 'react-native';
import { Text, Card, Chip, IconButton, Button, useTheme, ProgressBar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '@/../App';
import { useFavorites } from '@/store/useFavorites';
import { useFetch } from '@/hooks/useFetch';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGlobalBlocker } from '@/hooks/useGlobalBlocker';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

// Responsiva konstanter
const CONTENT_MAX = 1100; // maxbredd för hela detaljsidan
const GAP = 16; // avstånd mellan element

export default function DetailsScreen({ route, navigation }: Props) {
  const { name } = route.params;
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Hämta Pokémon-data
  const { data, loading, error, refetch } = useFetch<any>(
    `https://pokeapi.co/api/v2/pokemon/${name}`,
    { retry: 1, ttl: 10_000 },
  );

  // Global overlay (visas tills första data)
  useGlobalBlocker(loading, error, data, 'Laddar detaljer...');

  // Favoriter
  const { favorites, toggleFavorite } = useFavorites();
  const isFav = favorites.includes(name);

  // Dela
  function handleShare() {
    Share.share({
      message: `Kolla ${name}! https://pokeapi.co/api/v2/pokemon/${name}`,
    }).catch(() => {});
  }

  // Header (titel + actions)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: name.charAt(0).toUpperCase() + name.slice(1),
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="share-variant" accessibilityLabel="Dela" onPress={handleShare} />
          <IconButton
            icon={isFav ? 'heart' : 'heart-outline'}
            iconColor={isFav ? theme.colors.error : undefined}
            onPress={() => toggleFavorite(name)}
            accessibilityLabel={isFav ? 'Ta bort som favorit' : 'Lägg till som favorit'}
          />
        </View>
      ),
    });
  }, [navigation, isFav, name, theme.colors.error, toggleFavorite]);

  // Fel-fallback (overlay är för “loading”, inte fel)
  if (error) {
    return (
      <View style={{ padding: 16 }}>
        <Card>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">Något gick fel</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {String(error) || 'No data'}
            </Text>
            {refetch && (
              <Button mode="contained" onPress={refetch}>
                Försök igen
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  }

  // ✅ Om vi är här men saknar data täcks vyn av den globala overlayen ändå
  const sprite =
    data?.sprites?.other?.['official-artwork']?.front_default ??
    data?.sprites?.front_default ??
    null;

  const dexNo = `#${String(data?.id ?? '').padStart(3, '0')}`;
  const heightM = (((data?.height ?? 0) / 10) as number).toFixed(1);
  const weightKg = (((data?.weight ?? 0) / 10) as number).toFixed(1);

  const stats: Array<{ key: string; label: string; value: number }> = (data?.stats ?? []).map(
    (s: any) => ({
      key: s.stat?.name,
      label: statLabel(s.stat?.name),
      value: s.base_stat ?? 0,
    }),
  );
  const maxStat = 255;

  const abilities: string[] = (data?.abilities ?? []).map((a: any) => a.ability?.name);

  // Responsiva beräkningar
  const contentWidth = Math.min(width - 24, CONTENT_MAX);
  const isWide = contentWidth >= 900; // breakpoint för 2-kolumnslayout
  const spriteSize = isWide ? 320 : 240;

  // Layout för chip-färger (liten transparens)
  const chipStyle = useMemo(() => ({ backgroundColor: 'rgba(255,255,255,0.2)' }), []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', padding: 16, gap: GAP }}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(loading)}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={{ width: contentWidth, gap: GAP }}>
          {/* På breda skärmar: hero + fakta sida vid sida */}
          {isWide ? (
            <View style={{ flexDirection: 'row', gap: GAP }}>
              {/* Bild/typer */}
              <View style={{ flex: 1 }}>
                <Card style={{ borderRadius: theme.roundness + 12, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 }}
                  >
                    <Text
                      variant="labelLarge"
                      style={{ color: 'white', opacity: 0.9, marginBottom: 8 }}
                      accessibilityLabel={`Pokédexnummer ${dexNo}`}
                    >
                      {dexNo}
                    </Text>

                    {sprite ? (
                      <Image
                        source={{ uri: sprite }}
                        style={{ width: spriteSize, height: spriteSize }}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                    ) : (
                      <Text variant="headlineLarge" style={{ color: 'white' }}>
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    )}

                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginTop: 12,
                        justifyContent: 'center',
                      }}
                    >
                      {data?.types?.map((t: any) => (
                        <Chip
                          key={t.type.name}
                          style={chipStyle}
                          textStyle={{ textTransform: 'capitalize', color: 'white' }}
                        >
                          {t.type.name}
                        </Chip>
                      ))}
                    </View>
                  </LinearGradient>
                </Card>
              </View>

              {/* Fakta */}
              <View style={{ flex: 1 }}>
                <Card style={{ borderRadius: theme.roundness + 8 }}>
                  <Card.Content style={{ gap: 16 }}>
                    <Text
                      variant="headlineSmall"
                      style={{ textTransform: 'capitalize' }}
                      accessibilityRole="header"
                    >
                      {name}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                      <Fact
                        icon="arrow-up-down"
                        label="Höjd"
                        value={`${heightM} m`}
                        color={theme.colors.primary}
                      />
                      <Fact
                        icon="weight"
                        label="Vikt"
                        value={`${weightKg} kg`}
                        color={theme.colors.primary}
                      />
                    </View>

                    {abilities.length > 0 && (
                      <View style={{ gap: 8 }}>
                        <Text variant="titleMedium">Förmågor</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {abilities.map((a) => (
                            <Chip key={a} style={{ backgroundColor: theme.colors.surfaceVariant }}>
                              {a.replace(/-/g, ' ')}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Actions i fakta-kortet på breda skärmar */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Button
                        mode="contained"
                        icon="share-variant"
                        onPress={handleShare}
                        style={{ flex: 1 }}
                      >
                        Dela
                      </Button>
                      <Button
                        mode={isFav ? 'contained' : 'outlined'}
                        icon={isFav ? 'heart' : 'heart-outline'}
                        onPress={() => toggleFavorite(name)}
                        style={{ flex: 1 }}
                        accessibilityLabel={isFav ? 'Ta bort som favorit' : 'Lägg till som favorit'}
                      >
                        {isFav ? 'Favorit' : 'Spara'}
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              </View>
            </View>
          ) : (
            <>
              {/* Smal layout: bild/typer i eget kort */}
              <Card style={{ borderRadius: theme.roundness + 12, overflow: 'hidden' }}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 }}
                >
                  <Text
                    variant="labelLarge"
                    style={{ color: 'white', opacity: 0.9, marginBottom: 8 }}
                    accessibilityLabel={`Pokédexnummer ${dexNo}`}
                  >
                    {dexNo}
                  </Text>

                  {sprite ? (
                    <Image
                      source={{ uri: sprite }}
                      style={{ width: spriteSize, height: spriteSize }}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <Text variant="headlineLarge" style={{ color: 'white' }}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 12,
                      justifyContent: 'center',
                    }}
                  >
                    {data?.types?.map((t: any) => (
                      <Chip
                        key={t.type.name}
                        style={chipStyle}
                        textStyle={{ textTransform: 'capitalize', color: 'white' }}
                      >
                        {t.type.name}
                      </Chip>
                    ))}
                  </View>
                </LinearGradient>
              </Card>

              {/* Fakta-kort (smal) */}
              <Card style={{ borderRadius: theme.roundness + 8 }}>
                <Card.Content style={{ gap: 16 }}>
                  <Text
                    variant="headlineSmall"
                    style={{ textTransform: 'capitalize' }}
                    accessibilityRole="header"
                  >
                    {name}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <Fact
                      icon="arrow-up-down"
                      label="Höjd"
                      value={`${heightM} m`}
                      color={theme.colors.primary}
                    />
                    <Fact
                      icon="weight"
                      label="Vikt"
                      value={`${weightKg} kg`}
                      color={theme.colors.primary}
                    />
                  </View>

                  {abilities.length > 0 && (
                    <View style={{ gap: 8 }}>
                      <Text variant="titleMedium">Förmågor</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {abilities.map((a) => (
                          <Chip key={a} style={{ backgroundColor: theme.colors.surfaceVariant }}>
                            {a.replace(/-/g, ' ')}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>

              {/* Actions (smal) */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button
                  mode="contained"
                  icon="share-variant"
                  onPress={handleShare}
                  style={{ flex: 1 }}
                >
                  Dela
                </Button>
                <Button
                  mode={isFav ? 'contained' : 'outlined'}
                  icon={isFav ? 'heart' : 'heart-outline'}
                  onPress={() => toggleFavorite(name)}
                  style={{ flex: 1 }}
                  accessibilityLabel={isFav ? 'Ta bort som favorit' : 'Lägg till som favorit'}
                >
                  {isFav ? 'Favorit' : 'Spara'}
                </Button>
              </View>
            </>
          )}

          {/* Stats-kort – samma för båda layouterna */}
          {stats.length > 0 && (
            <Card style={{ borderRadius: theme.roundness + 8 }}>
              <Card.Content style={{ gap: 12 }}>
                <Text variant="titleMedium">Basvärden</Text>
                <View style={{ gap: 10 }}>
                  {stats.map((s) => (
                    <View key={s.key} accessibilityLabel={`${s.label} ${s.value}`}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text variant="labelMedium">{s.label}</Text>
                        <Text variant="labelMedium">{s.value}</Text>
                      </View>
                      <ProgressBar progress={s.value / maxStat} />
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** 🔹 Hjälpkomponent för fakta (ikon + label + värde) */
function Fact({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text variant="labelMedium">{label}</Text>
      <Text variant="titleMedium">{value}</Text>
    </View>
  );
}

/** 🔹 Konverterar API-statistikens nycklar till svenska labels */
function statLabel(key: string): string {
  switch (key) {
    case 'hp':
      return 'HP';
    case 'attack':
      return 'Attack';
    case 'defense':
      return 'Försvar';
    case 'special-attack':
      return 'Sp. Attack';
    case 'special-defense':
      return 'Sp. Försvar';
    case 'speed':
      return 'Hastighet';
    default:
      return key?.replace(/-/g, ' ') ?? 'Okänd';
  }
}
