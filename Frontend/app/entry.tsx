/**
 * app/entry.tsx
 * Cinematic animated entry screen for "Withs"
 *
 * Flow:
 *  1. Screen fades in (dark animated background already alive)
 *  2. Logo + slogan reveal with shimmer
 *  3. After 3.2 s → router.replace('/login')
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { CinematicBackground } from '../components/CinematicBackground';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { useAuthStore } from '../src/store/authStore';
import { C } from '../constants/colors';

export default function EntryScreen() {
  const screenOp = useSharedValue(0);

  useEffect(() => {
    // Full-screen cinematic fade-in
    screenOp.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });

    // Auto-navigate after 3.2 s
    const timer = setTimeout(() => {
      const activeToken = useAuthStore.getState().token;
      if (activeToken) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/login' as any);
      }
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOp.value }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Animated cinematic environment ── */}
      <CinematicBackground particleCount={42} showScanLine />

      {/* ── Logo — perfectly centered ── */}
      <View style={styles.center}>
        <AnimatedLogo showSlogan entryDelay={350} size="large" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.void,
  },
  center: {
    flex: 1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  30, // optical center (slightly above geometric center)
  },
});
