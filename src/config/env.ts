// src/config/env.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

function getDefaultDevBase() {
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api';
  return 'http://localhost:4000/api';
}

export const API_BASE = __DEV__
  ? (extra.apiBaseDev as string) || getDefaultDevBase()
  : (extra.apiBaseProd as string) || getDefaultDevBase();
