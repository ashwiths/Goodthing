import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import { THEMES, ThemeKey } from '../constants/colors';
import { NeonTheme, WallpaperKey } from '../types/theme.types';

interface ThemeState {
  activeTheme:  ThemeKey;
  wallpaper:    WallpaperKey;
  theme:        NeonTheme;
  setTheme:     (key: ThemeKey)     => void;
  setWallpaper: (key: WallpaperKey) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeTheme: 'cyber',
      wallpaper:   'particles',
      theme: { key: 'cyber', ...THEMES.cyber },

      setTheme: (key) =>
        set({ activeTheme: key, theme: { key, ...THEMES[key] } }),

      setWallpaper: (key) => set({ wallpaper: key }),
    }),
    { name: 'zenforge_theme', storage: createJSONStorage(() => zustandAsyncStorage) }
  )
);
