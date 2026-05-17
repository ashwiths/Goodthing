import { useSettingsStore } from '../store/settingsStore';

export const ACCENT_COLORS = [
  { name: 'Electric Blue', hex: '#4FA5FF' },
  { name: 'Neon Purple', hex: '#B76EFF' },
  { name: 'Cyber Pink', hex: '#FF6B9D' },
  { name: 'Emerald Green', hex: '#4ECDC4' },
  { name: 'Sunset Orange', hex: '#FFB347' },
];

const BASE_P = {
  bg: '#050410',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.4)',
  dimmer: 'rgba(255,255,255,0.15)',
  high: '#FF6B6B',
  medium: '#F7DC6F',
  low: '#4ECDC4',
  red: '#FF4A4A',
};

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '79,165,255';
}

export function useAppTheme() {
  const { theme, accentColor, blurQuality, glowIntensity, minimalMode } = useSettingsStore();

  const P = {
    ...BASE_P,
    bg: theme === 'minimalDark' ? '#080808' : '#050410',
    blue: accentColor,
    blue2: accentColor + 'CC', // 80% opacity
    purple: theme === 'minimalDark' ? '#1A1A1A' : '#B76EFF',
    purple2: theme === 'minimalDark' ? '#111111' : '#6B2BFF',
    border: `rgba(${hexToRgb(accentColor)}, 0.18)`,
    borderSub: theme === 'minimalDark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
  };

  const getBlurIntensity = (base: number) => {
    if (blurQuality === 'minimal') return Math.max(10, base * 0.3);
    if (blurQuality === 'ultra') return Math.min(100, base * 1.5);
    return base;
  };

  const getGlowStyles = (baseOpacity: number, baseRadius: number, glowColor: string = P.blue) => {
    let multiplier = 1;
    if (glowIntensity === 'low') multiplier = 0.3;
    if (glowIntensity === 'ultra') multiplier = 1.8;
    return {
      shadowColor: glowColor,
      shadowOpacity: baseOpacity * multiplier,
      shadowRadius: baseRadius * multiplier,
      elevation: baseRadius * multiplier,
    };
  };

  return { P, getBlurIntensity, getGlowStyles, minimalMode };
}
