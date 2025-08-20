// src/theme/ThemeContext.tsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  useContext,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { lightTheme, darkTheme } from './theme';

type ThemeContextValue = {
  isDarkMode: boolean; // True = mörkt tema aktivt
  toggleTheme: () => void; // Växla mellan mörkt/ljust
  setDarkMode: (v: boolean) => void; // Sätt explicit tema
};

const STORAGE_KEY = 'theme'; // Key i AsyncStorage ('dark' | 'light')

// Skapar ett context med standardvärden (faller tillbaka om Provider saknas)
export const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

type Props = { children: ReactNode };

export function ThemeProvider({ children }: Props) {
  const [isDarkMode, setIsDarkMode] = useState(false); // State för tema
  const [hydrated, setHydrated] = useState(false); // Säkerställer att AsyncStorage är laddat innan render

  // 🔹 Hämta sparat tema från AsyncStorage vid appstart
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark') setIsDarkMode(true);
        if (saved === 'light') setIsDarkMode(false);
      } finally {
        setHydrated(true); // Markera att vi nu kan visa appen
      }
    })();
  }, []);

  // 🔹 När temat är laddat → göm splashskärmen
  // Kräver att App.tsx kör `SplashScreen.preventAutoHideAsync()`
  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hydrated]);

  // 🔹 Uppdatera tema och spara till AsyncStorage
  const setDarkMode = useCallback(async (v: boolean) => {
    setIsDarkMode(v);
    await AsyncStorage.setItem(STORAGE_KEY, v ? 'dark' : 'light');
  }, []);

  // 🔹 Växla tema mellan mörkt/ljust
  const toggleTheme = useCallback(() => setDarkMode(!isDarkMode), [isDarkMode, setDarkMode]);

  // 🔹 Bestäm vilket tema react-native-paper ska använda
  const paperTheme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  // 🔹 Memoisera context-värdet för att undvika onödiga re-renders
  const ctx = useMemo(
    () => ({ isDarkMode, toggleTheme, setDarkMode }),
    [isDarkMode, toggleTheme, setDarkMode],
  );

  // 🔹 Om vi inte hunnit ladda AsyncStorage → returnera null
  // Detta gör att splashskärmen visas tills temat är klart
  if (!hydrated) return null;

  // 🔹 Slutlig provider som wrappar barn-komponenter
  return (
    <ThemeContext.Provider value={ctx}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

// 🔹 Hjälp-hook för att enkelt använda temat i komponenter
export const useAppTheme = () => useContext(ThemeContext);
