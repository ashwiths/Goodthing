/**
 * FloatingParticles.tsx
 * Lightweight animated particle field — no canvas, pure RN Reanimated.
 * Each particle is a tiny blur-circle that floats upward and fades in/out.
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { C } from '../constants/colors';

const { width: W, height: H } = Dimensions.get('window');

interface ParticleDef {
  id:       number;
  x:        number;
  startY:   number;
  size:     number;
  color:    string;
  duration: number;
  delay:    number;
  opacity:  number;
  drift:    number;   // horizontal sway px
}

interface FloatingParticlesProps {
  count?: number;
}

function Particle({ p }: { p: ParticleDef }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      p.delay,
      withRepeat(
        withTiming(1, { duration: p.duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    // Opacity: fade in → sustain → fade out
    const opacity =
      t < 0.15
        ? interpolate(t, [0, 0.15], [0, p.opacity])
        : t > 0.82
        ? interpolate(t, [0.82, 1], [p.opacity, 0])
        : p.opacity;

    // Y: move from startY upward by ~40% screen height
    const translateY = interpolate(t, [0, 1], [p.startY, p.startY - H * 0.42]);

    // X: gentle sinusoidal drift
    const translateX = p.x + Math.sin(t * Math.PI * 2) * p.drift;

    return {
      opacity,
      transform: [{ translateY }, { translateX }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width:           p.size,
          height:          p.size,
          borderRadius:    p.size / 2,
          backgroundColor: p.color,
          // Soft glow via shadow
          shadowColor:     p.color,
          shadowOpacity:   0.9,
          shadowRadius:    p.size * 1.8,
          shadowOffset:    { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

export function FloatingParticles({ count = 40 }: FloatingParticlesProps) {
  const particles = useMemo<ParticleDef[]>(() => {
    const colors = C.particle;
    return Array.from({ length: count }, (_, i) => ({
      id:       i,
      x:        Math.random() * W - W * 0.5,          // offset from center
      startY:   H * 0.3 + Math.random() * H * 0.6,    // spawn in lower 70%
      size:     0.8 + Math.random() * 2.4,
      color:    colors[Math.floor(Math.random() * colors.length)],
      duration: 7000 + Math.random() * 10000,
      delay:    Math.random() * 6000,
      opacity:  0.18 + Math.random() * 0.55,
      drift:    8 + Math.random() * 24,
    }));
  }, [count]);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.container]}
      pointerEvents="none"
    >
      {particles.map((p) => (
        <Particle key={p.id} p={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  particle:  { position: 'absolute' },
});
