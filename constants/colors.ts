// ─── Withs — Cinematic Color System ──────────────────────────────────────────

export const C = {
  // ── Backgrounds ───────────────────────────────────────────────
  void:        '#04060D',   // absolute dark base
  deep:        '#080D1A',   // primary bg
  navy:        '#0C1226',   // surface
  midnight:    '#111A33',   // elevated surface

  // ── Blue Spectrum ─────────────────────────────────────────────
  blue900:     '#0A1628',
  blue700:     '#1A3A6B',
  blue500:     '#2D6BE4',
  blue400:     '#4C8EF5',
  blue300:     '#7AABFF',
  blue200:     '#A8C8FF',
  blue100:     '#D6E8FF',

  // ── Accent Glow ───────────────────────────────────────────────
  glowBlue:    'rgba(45,107,228,0.55)',
  glowBlueHot: 'rgba(76,142,245,0.70)',
  glowWhite:   'rgba(255,255,255,0.14)',
  glowPulse:   'rgba(100,160,255,0.30)',

  // ── Glass / Surfaces ──────────────────────────────────────────
  glass04:     'rgba(255,255,255,0.04)',
  glass08:     'rgba(255,255,255,0.08)',
  glass12:     'rgba(255,255,255,0.12)',
  glass20:     'rgba(255,255,255,0.20)',
  glassBlue04: 'rgba(45,107,228,0.04)',
  glassBlue08: 'rgba(45,107,228,0.08)',
  border:      'rgba(255,255,255,0.09)',
  borderBlue:  'rgba(76,142,245,0.30)',
  borderFocus: 'rgba(76,142,245,0.70)',

  // ── Text ──────────────────────────────────────────────────────
  white:       '#FFFFFF',
  text100:     'rgba(255,255,255,0.92)',
  text70:      'rgba(255,255,255,0.70)',
  text45:      'rgba(255,255,255,0.45)',
  text25:      'rgba(255,255,255,0.25)',
  textBlue:    '#7AABFF',

  // ── Gradients (arrays for LinearGradient) ─────────────────────
  gradSky:     ['#0C1226', '#0A1E45', '#060E20'] as string[],
  gradCard:    ['rgba(20,35,70,0.85)', 'rgba(8,14,28,0.92)'] as string[],
  gradBtn:     ['#2D6BE4', '#1A4BC0'] as string[],
  gradSlogan:  ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.72)', 'rgba(255,255,255,0.0)'] as string[],

  // ── Particle colors ────────────────────────────────────────────
  particle:    ['#4C8EF5', '#7AABFF', '#A8C8FF', '#FFFFFF'] as string[],
} as const;
