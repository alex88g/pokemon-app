// src/store/useFavorites.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type State = {
  favorites: string[];
  hasHydrated: boolean;
  toggleFavorite: (name: string) => void;
  reset: () => void;
};

export const useFavorites = create<State>()(
  persist(
    (set) => ({
      favorites: [],
      hasHydrated: false,
      toggleFavorite: (name) =>
        set((state) => {
          const n = name.trim().toLowerCase(); // normalisera
          const exists = state.favorites.includes(n);
          return {
            favorites: exists ? state.favorites.filter((x) => x !== n) : [...state.favorites, n],
          };
        }),
      reset: () => set({ favorites: [] }),
    }),
    {
      name: 'favorites.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ favorites: s.favorites }),
      onRehydrateStorage: () => (_rehydratedState, error) => {
        if (error) console.warn('favorites rehydrate error', error);
        // Viktigt: använd store-instansen här, inte 'set'
        useFavorites.setState({ hasHydrated: true });
      },
      version: 1,
      migrate: (persisted, _version) => {
        const s = persisted as any;
        // Säkerställ strängar + lowercase om äldre format
        if (Array.isArray(s?.favorites)) {
          return { ...s, favorites: s.favorites.map((v: any) => String(v).toLowerCase()) };
        }
        return s as any;
      },
    },
  ),
);

// Hjälphooks (valfritt, smidigare i komponenter)
export const useIsFavorite = (name: string) =>
  useFavorites((s) => s.favorites.includes(name.trim().toLowerCase()));

export const useFavoritesActions = () =>
  useFavorites((s) => ({ toggleFavorite: s.toggleFavorite, reset: s.reset }));
