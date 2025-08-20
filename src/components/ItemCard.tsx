// src/components/ItemCard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Platform, Pressable } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavorites } from '@/store/useFavorites';

type Props = {
  name: string;
  spriteUrl?: string;
  onPress?: () => void;
};

const SPRITE_CACHE = new Map<string, string | undefined>();
const isWeb = Platform.OS === 'web';

export default function ItemCard({ name, spriteUrl, onPress }: Props) {
  const theme = useTheme();
  const { favorites, toggleFavorite } = useFavorites();
  const isFav = favorites.includes(name);

  const [hovered, setHovered] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(spriteUrl);

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    const useND = !isWeb; // avoid native-driver warning on web
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: useND }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: useND, friction: 6, tension: 80 }),
    ]).start();
  }, [fade, scale]);

  useEffect(() => {
    if (spriteUrl) {
      setResolvedUrl(spriteUrl);
      return;
    }
    const key = name.toLowerCase();
    if (SPRITE_CACHE.has(key)) {
      setResolvedUrl(SPRITE_CACHE.get(key));
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        const art: string | undefined =
          json?.sprites?.other?.['official-artwork']?.front_default ||
          json?.sprites?.front_default ||
          undefined;
        SPRITE_CACHE.set(key, art);
        setResolvedUrl(art);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          SPRITE_CACHE.set(key, undefined);
          setResolvedUrl(undefined);
        }
      }
    })();
    return () => controller.abort();
  }, [name, spriteUrl]);

  const initial = useMemo(() => name?.charAt(0)?.toUpperCase() ?? '·', [name]);
  const cardTransform = [{ scale }, { scale: hovered ? 1.02 : 1 }];

  const CardShell = (
    <Card
      mode="elevated"
      style={[styles.card, { borderRadius: theme.roundness + 10 }]}
      {...(!isWeb
        ? {
            onPress,
            accessible: true,
            accessibilityRole: 'button' as const,
            accessibilityLabel: `${name}. ${isFav ? 'Favorit' : 'Inte favorit'}. Tryck för att öppna.`,
            testID: 'item-card',
          }
        : {
            // web: don’t let Card be a button; the outer wrapper handles clicks
            accessible: false,
            testID: 'item-card',
          })}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mediaContainer}
      >
        {resolvedUrl ? (
          <Image
            source={{ uri: resolvedUrl }}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Text variant="headlineSmall" style={[styles.placeholderText, { color: 'white' }]}>
              {initial}
            </Text>
          </View>
        )}

        {/* This is a real <button> on web (IconButton). That’s fine as long as the OUTER wrapper is not a button. */}
        <View style={styles.favContainer}>
          <IconButton
            icon={isFav ? 'heart' : 'heart-outline'}
            size={22}
            onPress={(e: any) => {
              e?.stopPropagation?.(); // don’t trigger outer click on web
              toggleFavorite(name);
            }}
            style={[styles.favBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            iconColor={isFav ? theme.colors.error : 'white'}
            accessibilityLabel={isFav ? 'Ta bort som favorit' : 'Lägg till som favorit'}
            testID="favorite-toggle"
          />
          <Text variant="labelSmall" style={[styles.favText, { color: 'white' }]}>
            {isFav ? 'Favorit' : 'Spara'}
          </Text>
        </View>
      </LinearGradient>

      <Card.Content style={styles.content}>
        <Text
          variant="titleMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        isWeb && hovered ? styles.webShadowHover : styles.webShadowBase,
        { transform: cardTransform, opacity: fade },
      ]}
      {...(isWeb
        ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
        : {})}
    >
      {isWeb ? (
        // WEB: Use a plain View (div) as clickable wrapper — NOT a button.
        <View
          // @ts-ignore – onClick exists on RN Web
          onClick={onPress}
          style={{ borderRadius: theme.roundness + 10 }}
          // Don’t set accessibilityRole="button" here to keep it a <div>, not a <button>
        >
          {CardShell}
        </View>
      ) : (
        // NATIVE: Let Card handle onPress normally.
        CardShell
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {},
  webShadowBase: Platform.select({
    web: {
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      transitionProperty: 'transform, box-shadow',
      transitionDuration: '140ms',
      transitionTimingFunction: 'ease-out',
      willChange: 'transform',
      borderRadius: 16,
    } as any,
    default: {},
  }),
  webShadowHover: Platform.select({
    web: { boxShadow: '0 6px 24px rgba(0,0,0,0.12)' } as any,
    default: {},
  }),
  card: { overflow: 'hidden' },
  mediaContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 12,
  },
  image: { width: 110, height: 110 },
  placeholder: {
    width: 110,
    height: 110,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontWeight: '700' },
  favContainer: { position: 'absolute', top: 6, right: 6, alignItems: 'center' },
  favBtn: { margin: 0 },
  favText: { fontSize: 10, opacity: 0.9 },
  content: { alignItems: 'center', paddingTop: 10, paddingBottom: 14 },
  title: { textTransform: 'capitalize', textAlign: 'center', letterSpacing: 0.25 },
});
