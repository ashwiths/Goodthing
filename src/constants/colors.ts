// ─── ZenForge Color System ───────────────────────────────────────────────────

export const NEON = {
  cyan:   '#00F5FF',
  violet: '#8B5CF6',
  pink:   '#F72585',
  green:  '#39FF14',
  amber:  '#FFB703',
  blue:   '#3B82F6',
  red:    '#FF2D55',
} as const;

export const GLASS = {
  background: 'rgba(10, 10, 20, 0.85)',
  border:     'rgba(255, 255, 255, 0.08)',
  surface:    'rgba(255, 255, 255, 0.04)',
  highlight:  'rgba(255, 255, 255, 0.12)',
} as const;

export const DARK = {
  bg:       '#0A0A0F',
  surface:  '#111118',
  card:     '#16161F',
  border:   '#1E1E2E',
  muted:    '#2A2A3A',
} as const;

export const TEXT = {
  primary:   '#FFFFFF',
  secondary: 'rgba(255,255,255,0.7)',
  muted:     'rgba(255,255,255,0.4)',
  inverse:   '#0A0A0F',
} as const;

export const GRADIENT = {
  cyber:     ['#0A0A0F', '#0D0D1A', '#111118'] as string[],
  neonCyan:  ['#00F5FF22', '#00F5FF00'] as string[],
  neonViolet:['#8B5CF622', '#8B5CF600'] as string[],
  neonPink:  ['#F7258522', '#F7258500'] as string[],
  card:      ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as string[],
  header:    ['#0A0A0F', '#111118'] as string[],
} as const;

export const SHADOW = {
  neonCyan:   '0 0 20px rgba(0,245,255,0.4)',
  neonViolet: '0 0 20px rgba(139,92,246,0.4)',
  neonPink:   '0 0 20px rgba(247,37,133,0.4)',
} as const;

// Theme presets
export const THEMES = {
  cyber:   { primary: NEON.cyan,   secondary: NEON.violet, name: 'Cyber Blue'  },
  sakura:  { primary: NEON.pink,   secondary: NEON.violet, name: 'Sakura'      },
  matrix:  { primary: NEON.green,  secondary: NEON.cyan,   name: 'Matrix'      },
  solar:   { primary: NEON.amber,  secondary: NEON.pink,   name: 'Solar Flare' },
  cosmos:  { primary: NEON.violet, secondary: NEON.pink,   name: 'Cosmos'      },
} as const;

export type ThemeKey = keyof typeof THEMES;
