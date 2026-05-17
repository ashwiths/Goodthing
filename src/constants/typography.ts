import { TextStyle } from 'react-native';

export const FONT_FAMILY = {
  regular:     'System',
  medium:      'System',
  semibold:    'System',
  bold:        'System',
  mono:        'SpaceMono',
} as const;

export const FONT_SIZE = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,
  hero:  52,
} as const;

export const LINE_HEIGHT = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
} as const;

export const LETTER_SPACING = {
  tight:  -0.5,
  normal: 0,
  wide:   1,
  wider:  2,
  widest: 4,
} as const;

export const TYPE_SCALE = {
  hero: {
    fontSize:      FONT_SIZE.hero,
    fontWeight:    '900',
    letterSpacing: LETTER_SPACING.tight,
  } as TextStyle,
  h1: {
    fontSize:      FONT_SIZE['3xl'],
    fontWeight:    '800',
    letterSpacing: LETTER_SPACING.tight,
  } as TextStyle,
  h2: {
    fontSize:      FONT_SIZE['2xl'],
    fontWeight:    '700',
    letterSpacing: LETTER_SPACING.normal,
  } as TextStyle,
  h3: {
    fontSize:      FONT_SIZE.xl,
    fontWeight:    '600',
    letterSpacing: LETTER_SPACING.normal,
  } as TextStyle,
  h4: {
    fontSize:      FONT_SIZE.lg,
    fontWeight:    '600',
    letterSpacing: LETTER_SPACING.wide,
  } as TextStyle,
  body: {
    fontSize:      FONT_SIZE.base,
    fontWeight:    '400',
    letterSpacing: LETTER_SPACING.normal,
  } as TextStyle,
  bodySmall: {
    fontSize:      FONT_SIZE.sm,
    fontWeight:    '400',
    letterSpacing: LETTER_SPACING.normal,
  } as TextStyle,
  label: {
    fontSize:      FONT_SIZE.xs,
    fontWeight:    '600',
    letterSpacing: LETTER_SPACING.wider,
  } as TextStyle,
  mono: {
    fontSize:      FONT_SIZE.base,
    fontFamily:    FONT_FAMILY.mono,
    letterSpacing: LETTER_SPACING.normal,
  } as TextStyle,
} as const;
