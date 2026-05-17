/**
 * AnimatedLogo.tsx
 * "Zolo" wordmark with "ash_withs" subtitle.
 * Pure code — zero image assets required.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../constants/colors';

interface AnimatedLogoProps {
  showSlogan?: boolean;
  entryDelay?: number;
  size?: 'small' | 'large';
}

export function AnimatedLogo({
  showSlogan  = true,
  entryDelay  = 400,
  size        = 'large',
}: AnimatedLogoProps) {
  const isLarge = size === 'large';

  const opacity   = useSharedValue(0);
  const scaleVal  = useSharedValue(0.84);
  const floatY    = useSharedValue(0);
  const glow      = useSharedValue(0);
  const sloganOp  = useSharedValue(0);
  const sloganY   = useSharedValue(10);
  const shimmer   = useSharedValue(0);
  const subOp     = useSharedValue(0);

  useEffect(() => {
    // Fade + spring scale
    opacity.value  = withDelay(entryDelay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
    scaleVal.value = withDelay(entryDelay, withSpring(1, { damping: 18, stiffness: 68 }));

    // Shimmer sweep (one-shot)
    shimmer.value = withDelay(
      entryDelay + 200,
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) })
    );

    // Float loop
    floatY.value = withDelay(
      entryDelay + 700,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0,  { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      )
    );

    // Glow breathe
    glow.value = withDelay(
      entryDelay + 500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      )
    );

    // Subtitle fade
    subOp.value = withDelay(entryDelay + 600, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));

    // Slogan reveal
    sloganOp.value = withDelay(entryDelay + 900, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    sloganY.value  = withDelay(entryDelay + 900, withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scaleVal.value }, { translateY: floatY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity:      interpolate(glow.value, [0, 1], [0.25, 0.70]),
    shadowRadius: interpolate(glow.value, [0, 1], [30, 65]),
    transform:    [{ scale: interpolate(glow.value, [0, 1], [1, 1.18]) }],
  }));

  const sloganStyle = useAnimatedStyle(() => ({
    opacity:   sloganOp.value,
    transform: [{ translateY: sloganY.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(shimmer.value, [0, 0.4, 0.85, 1], [0, 0.7, 0.5, 0]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-200, 200]) }],
  }));

  const subStyle = useAnimatedStyle(() => ({ opacity: subOp.value }));

  const wordSize  = isLarge ? 72 : 30;
  const glowW     = isLarge ? 300 : 150;
  const glowH     = isLarge ? 90  : 50;
  const letterSp  = isLarge ? 12  : 7;

  return (
    <Animated.View style={[styles.root, containerStyle]}>

      {/* Glow halo — shadow only, no visible shape */}
      <Animated.View
        style={[
          styles.glow,
          {
            width:        glowW,
            height:       glowH,
            borderRadius: glowH / 2,
            shadowColor:  C.blue400,
          },
          glowStyle,
        ]}
      />

      {/* ── "Zolo" main wordmark ──────────────────────────────── */}
      <View style={styles.wordWrap}>
        <Text style={[styles.word, { fontSize: wordSize, letterSpacing: letterSp }]}>
          Zolo
        </Text>

        {/* One-shot shimmer sweep */}
        <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* ── "ash_withs" subtitle under the main word ─────────── */}
      <Animated.Text
        style={[
          styles.subtitle,
          { fontSize: isLarge ? 12 : 9, letterSpacing: isLarge ? 3.5 : 2 },
          subStyle,
        ]}
      >
        ash_withs
      </Animated.Text>

      {/* Thin accent rule */}
      {isLarge && (
        <LinearGradient
          colors={['transparent', C.blue400, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.underline}
        />
      )}

      {/* ── Slogan ────────────────────────────────────────────── */}
      {showSlogan && (
        <Animated.Text style={[styles.slogan, sloganStyle]}>
          FOCUS  •  GROW  •  BECOME
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position:        'absolute',
    backgroundColor: 'transparent',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0,
    elevation:       0,
  },
  wordWrap: {
    overflow: 'hidden',
  },
  word: {
    fontWeight:         '200',
    color:              '#FFFFFF',
    includeFontPadding: false,
  },
  subtitle: {
    marginTop:     6,
    fontWeight:    '400',
    color:         C.text45,
    textTransform: 'lowercase',
    letterSpacing: 3.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0, bottom: 0,
    left: -50,
    width: 100,
  },
  underline: {
    height:    1,
    width:     '60%',
    marginTop: 14,
    opacity:   0.40,
  },
  slogan: {
    marginTop:     20,
    fontSize:      9.5,
    fontWeight:    '500',
    color:         C.text25,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
});
