/**
 * CinematicBackground.tsx
 * Fully animated dark background with:
 *  - Deep void base
 *  - Two slowly rotating gradient orbs (simulate moving light sources)
 *  - A central radial glow that breathes
 *  - FloatingParticles on top
 */
import React, { useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingParticles } from './FloatingParticles';
import { C } from '../constants/colors';

const { width: W, height: H } = Dimensions.get('window');

// Size of the animated orbs
const ORB_SIZE = W * 1.1;

function BreathingOrb({
  startX,
  startY,
  color1,
  color2,
  duration,
  delay,
  travelX = 60,
  travelY = 80,
}: {
  startX: number;
  startY: number;
  color1: string;
  color2: string;
  duration: number;
  delay: number;
  travelX?: number;
  travelY?: number;
}) {
  const progress = useSharedValue(0);
  const scale    = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay + duration * 0.3,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,  { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX + interpolate(progress.value, [0, 1], [0, travelX]) },
      { translateY: startY + interpolate(progress.value, [0, 1], [0, travelY]) },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.orb, style]}>
      <LinearGradient
        colors={[color1, color2]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 0.8, y: 0.9 }}
      />
    </Animated.View>
  );
}

// Thin horizontal scan line that slowly moves down
function ScanLine() {
  const y = useSharedValue(-2);

  useEffect(() => {
    y.value = withRepeat(
      withTiming(H + 2, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return <Animated.View style={[styles.scanLine, style]} />;
}

interface CinematicBackgroundProps {
  particleCount?: number;
  showScanLine?:  boolean;
}

export function CinematicBackground({
  particleCount = 38,
  showScanLine  = false,
}: CinematicBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── 1. Absolute void base ─────────────────────────────── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.void }]} />

      {/* ── 2. Orb A — top-left blue nebula ──────────────────── */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <BreathingOrb
          startX={-ORB_SIZE * 0.5}
          startY={-ORB_SIZE * 0.35}
          color1="rgba(14,36,90,0.65)"
          color2="rgba(4,8,20,0.00)"
          duration={9000}
          delay={0}
          travelX={55}
          travelY={45}
        />

        {/* ── 3. Orb B — bottom-right warmer blue ──────────────── */}
        <BreathingOrb
          startX={W * 0.2}
          startY={H * 0.38}
          color1="rgba(20,55,140,0.40)"
          color2="rgba(4,8,20,0.00)"
          duration={11500}
          delay={3000}
          travelX={-70}
          travelY={-50}
        />

        {/* ── 4. Orb C — centre subtle white gleam ─────────────── */}
        <BreathingOrb
          startX={W * 0.05}
          startY={H * 0.15}
          color1="rgba(60,100,200,0.22)"
          color2="rgba(4,8,20,0.00)"
          duration={13000}
          delay={1500}
          travelX={30}
          travelY={60}
        />
      </View>

      {/* ── 5. Radial vignette — edges stay dark ─────────────── */}
      <LinearGradient
        colors={[
          'rgba(4,6,13,0.00)',
          'rgba(4,6,13,0.00)',
          'rgba(4,6,13,0.72)',
        ]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── 6. Bottom atmosphere gradient ────────────────────── */}
      <LinearGradient
        colors={['transparent', 'rgba(4,6,13,0.90)']}
        locations={[0.5, 1]}
        style={[StyleSheet.absoluteFill]}
      />

      {/* ── 7. Floating particles ─────────────────────────────── */}
      <FloatingParticles count={particleCount} />

      {/* ── 8. Optional scan line ─────────────────────────────── */}
      {showScanLine && <ScanLine />}
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position:     'absolute',
    width:        ORB_SIZE,
    height:       ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow:     'hidden',
  },
  scanLine: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: 'rgba(100,160,255,0.06)',
  },
});
