import { useThemeStore } from '../stores/themeStore';
import { DARK, GLASS, TEXT, GRADIENT } from '../constants/colors';

export function useTheme() {
  const { theme, activeTheme, wallpaper } = useThemeStore();

  return {
    // Live theme values
    primary:     theme.primary,
    secondary:   theme.secondary,
    activeTheme,
    wallpaper,

    // Static tokens
    dark: DARK,
    glass: GLASS,
    text: TEXT,
    gradient: GRADIENT,

    // Convenience helpers
    neonShadow: (opacity = 0.4) =>
      `0 0 20px ${theme.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,

    glowStyle: {
      shadowColor:   theme.primary,
      shadowOffset:  { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius:  12,
      elevation:     8,
    },

    cardStyle: {
      backgroundColor: GLASS.background,
      borderColor:     GLASS.border,
      borderWidth:     1,
    },
  };
}
