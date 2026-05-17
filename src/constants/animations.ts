// ─── ZenForge Animation Constants ────────────────────────────────────────────

export const DURATION = {
  instant:  100,
  fast:     200,
  normal:   300,
  slow:     500,
  slower:   800,
  slowest: 1200,
  pulse:   2000,
} as const;

export const EASING = {
  // Standard easings (use with Reanimated Easing)
  smooth:   [0.4, 0.0, 0.2, 1.0] as [number,number,number,number],
  spring:   [0.175, 0.885, 0.32, 1.275] as [number,number,number,number],
  decel:    [0.0, 0.0, 0.2, 1.0] as [number,number,number,number],
  accel:    [0.4, 0.0, 1.0, 1.0] as [number,number,number,number],
} as const;

export const SPRING = {
  bouncy: {
    damping:   10,
    stiffness: 200,
    mass:      1,
  },
  gentle: {
    damping:   20,
    stiffness: 150,
    mass:      1,
  },
  snappy: {
    damping:   30,
    stiffness: 400,
    mass:      0.8,
  },
  wobbly: {
    damping:   8,
    stiffness: 100,
    mass:      1.2,
  },
} as const;

export const SCALE = {
  pressed:  0.95,
  active:   0.97,
  hover:    1.02,
  bounce:   1.05,
} as const;

export const PARTICLE = {
  count:    25,
  minSize:  1.5,
  maxSize:  4,
  minSpeed: 0.2,
  maxSpeed: 0.8,
  minOpacity: 0.1,
  maxOpacity: 0.6,
} as const;
