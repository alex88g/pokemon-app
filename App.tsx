// App.tsx
import 'react-native-gesture-handler';
import React, { useContext, useMemo, useEffect, useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
} from '@react-navigation/native';
import { Platform, StyleSheet, Animated } from 'react-native';

// ✅ Importera endast en installer-funktion (ingen side-effect import)
import { installForegroundNotificationHandler } from '@/lib/notifications';

import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// UI (Paper)
import { Provider as PaperProvider, Text, ActivityIndicator, useTheme } from 'react-native-paper';

// Tema/contexts
import { ThemeProvider, ThemeContext } from '@/theme/ThemeContext';
import { lightTheme, darkTheme } from '@/theme/theme';

// Skärmar
import HomeScreen from '@/screens/HomeScreen';
import DetailsScreen from '@/screens/DetailsScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import SettingsScreen from '@/screens/SettingsScreen';

// Global overlay
import { GlobalSplashProvider, useGlobalSplash } from '@/context/GlobalSplashContext';

// 🚫 Viktigt för web: använd native-stack överallt
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Details: { name: string };
  Favorites: undefined;
  Settings: undefined;
  Modal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Splash (endast native): håll kvar tills navigationen är redo
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function App() {
  // Ladda fonter/ikoner (skippa på web för snabbare boot)
  const [fontsReady, setFontsReady] = useState(Platform.OS === 'web');

  // 🔧 Sätt upp foreground-notiser endast på native
  useEffect(() => {
    if (Platform.OS !== 'web') {
      installForegroundNotificationHandler();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        await Font.loadAsync(MaterialCommunityIcons.font);
      } finally {
        setFontsReady(true);
      }
    })();
  }, []);

  if (!fontsReady) return null;

  return (
    <PaperProvider
      // ✅ Paper använder Expo-ikoner direkt (minimerar vector-icon-varningar)
      settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}
    >
      <ThemeProvider>
        <GlobalSplashProvider>
          <ThemedNavigation />
          <OverlayHost />
        </GlobalSplashProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}

function OverlayHost() {
  const { visible, message } = useGlobalSplash();
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 120,
      // 🔧 På web finns ingen native-driver – undviker varningen
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      // 🔧 Flytta pointerEvents till style (web-only) – prop är deprecated på RN Web
      style={[
        styles.backdrop,
        { backgroundColor: 'transparent', opacity },
        Platform.OS === 'web' ? ({ pointerEvents: 'auto' } as any) : null,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Laddar...'}
      testID="global-splash-overlay"
    >
      {/* Visa PNG-bild endast på native för att undvika require-fel på web */}
      {Platform.OS !== 'web' && (
        // @ts-ignore – Metro hanterar require av statiska resurser
        <Animated.Image
          source={require('./assets/splash.png')}
          style={styles.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      )}
      <ActivityIndicator size="large" style={{ marginTop: 12 }} />
      <Text variant="labelLarge" style={{ marginTop: 6, color: theme.colors.onSurfaceVariant }}>
        {message || 'Laddar...'}
      </Text>
    </Animated.View>
  );
}

function ThemedNavigation() {
  const { isDarkMode } = useContext(ThemeContext);

  const navTheme = useMemo(
    () =>
      isDarkMode
        ? { ...NavDark, colors: { ...NavDark.colors, background: darkTheme.colors.background } }
        : { ...NavLight, colors: { ...NavLight.colors, background: lightTheme.colors.background } },
    [isDarkMode],
  );

  const headerBg = isDarkMode ? darkTheme.colors.surface : lightTheme.colors.surface;
  const headerText = isDarkMode ? darkTheme.colors.onSurface : lightTheme.colors.onSurface;

  return (
    <NavigationContainer
      theme={navTheme}
      onReady={() => {
        if (Platform.OS !== 'web') {
          SplashScreen.hideAsync().catch(() => {});
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: headerText,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Hem' }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Detaljer' }} />
        <Stack.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{ title: 'Favoriter' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Inställningar' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  image: { width: 200, height: 200 },
});
