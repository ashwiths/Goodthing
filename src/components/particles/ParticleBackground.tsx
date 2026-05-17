import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { PARTICLE } from '../../constants/animations';

const { width: W, height: H } = Dimensions.get('window');

interface Particle {
  id:       number;
  x:        number;
  y:        number;
  size:     number;
  opacity:  number;
  duration: number;
  delay:    number;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function SingleParticle({ p, color }: { p: Particle; color: string }) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      p.delay,
      withRepeat(
        withTiming(-H * 0.4, { duration: p.duration * 1000, easing: Easing.linear }),
        -1, false
      )
    );
    opacity.value = withDelay(
      p.delay,
      withRepeat(
        withTiming(p.opacity, { duration: p.duration * 500 }),
        -1, true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left:            p.x,
          top:             p.y,
          width:           p.size,
          height:          p.size,
          borderRadius:    p.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function ParticleBackground() {
  const { primary } = useTheme();

  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: PARTICLE.count }, (_, i) => ({
      id:       i,
      x:        randomBetween(0, W),
      y:        randomBetween(H * 0.2, H),
      size:     randomBetween(PARTICLE.minSize, PARTICLE.maxSize),
      opacity:  randomBetween(PARTICLE.minOpacity, PARTICLE.maxOpacity),
      duration: randomBetween(8, 20),
      delay:    randomBetween(0, 5000),
    })),
  []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <SingleParticle key={p.id} p={p} color={primary} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute' },
});
