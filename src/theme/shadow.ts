// styles/shadow.ts
import { Platform } from 'react-native';

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 4 },
  web: { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' as any },
});
