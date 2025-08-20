// src/theme/theme.ts

// Importerar färdiga ljusa och mörka teman från react-native-paper
// samt typen MD3Theme för typning
import { MD3LightTheme, MD3DarkTheme, type MD3Theme } from 'react-native-paper';
import { Platform } from 'react-native';

// Grundinställning för hörnavrundning (t.ex. knappar, kort osv.)
const baseRoundness = 12;

// Definierar det ljusa temat
export const lightTheme: MD3Theme = {
  ...MD3LightTheme, // Utgår från react-native-papers standard ljusa tema
  isV3: true, // Markerar att Material Design 3 används
  roundness: baseRoundness, // Använder samma bas-rundning över hela temat
  colors: {
    ...MD3LightTheme.colors, // Behåller grundfärgerna från MD3 och skriver över några
    primary: '#4E937A', // Primärfärg (t.ex. knappar, highlights)
    onPrimary: '#FFFFFF', // Textfärg ovanpå primärfärgen
    secondary: '#B4656F', // Sekundärfärg (accent/komplement)
    onSecondary: '#FFFFFF', // Textfärg ovanpå sekundärfärgen
    background: '#F8F9FA', // Sidans bakgrund
    surface: '#FFFFFF', // Ytor som kort, knappar osv.
    surfaceVariant: '#E4E7EC', // Variant för ytor (t.ex. listbakgrunder)
    error: '#D32F2F', // Felmeddelande/röd färg
    onSurface: '#333333', // Textfärg ovanpå ytor
    onSurfaceVariant: '#6B7280', // Sekundär textfärg
  },
  // Animationens skala justeras beroende på plattform
  animation: { scale: Platform.OS === 'ios' ? 0.95 : 1 },
};

// Definierar det mörka temat
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme, // Utgår från react-native-papers standard mörka tema
  isV3: true, // Markerar att Material Design 3 används
  roundness: baseRoundness, // Samma bas-rundning som ljusa temat
  colors: {
    ...MD3DarkTheme.colors, // Behåller grundfärgerna från MD3 och skriver över några
    primary: '#81C7B2', // Primärfärg i mörkt läge
    onPrimary: '#00332A', // Textfärg ovanpå primärfärgen
    secondary: '#E2959B', // Sekundärfärg i mörkt läge
    onSecondary: '#331013', // Textfärg ovanpå sekundärfärgen
    background: '#1B1B1B', // Bakgrund i mörkt läge
    surface: '#242424', // Ytor som kort och knappar i mörkt läge
    surfaceVariant: '#3A3A3A', // Variant för ytor
    error: '#F28B82', // Felmeddelande/röd färg i mörkt läge
    onSurface: '#EAEAEA', // Textfärg ovanpå ytor
    onSurfaceVariant: '#B0B0B0', // Sekundär textfärg
  },
};
