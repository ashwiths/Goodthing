// ─── Theme Types ──────────────────────────────────────────────────────────────

import { ThemeKey } from '../constants/colors';

export interface NeonTheme {
  key:       ThemeKey;
  name:      string;
  primary:   string;    // main neon color
  secondary: string;    // accent neon color
}

export interface ThemeState {
  activeTheme: ThemeKey;
  theme:       NeonTheme;
}

export type WallpaperKey = 'particles' | 'grid' | 'waves' | 'none';

export interface WallpaperOption {
  key:   WallpaperKey;
  label: string;
  icon:  string;
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  { key: 'particles', label: 'Particles', icon: '✦' },
  { key: 'grid',      label: 'Cyber Grid', icon: '⊞' },
  { key: 'waves',     label: 'Sound Waves', icon: '〰' },
  { key: 'none',      label: 'Clean',       icon: '◻' },
];
