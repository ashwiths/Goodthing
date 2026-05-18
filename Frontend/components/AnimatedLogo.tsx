/**
 * AnimatedLogo.tsx
 * Custom geometric vector monogram logo for Ash_withs.
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
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { C } from '../constants/colors';

interface AnimatedLogoProps {
  showSlogan?: boolean;
  entryDelay?: number;
  size?: 'small' | 'large';
  animated?: boolean;
}

export function AnimatedLogo({
  showSlogan  = true,
  entryDelay  = 400,
  size        = 'large',
  animated    = true,
}: AnimatedLogoProps) {
  const isLarge = size === 'large';
  const logoSize = isLarge ? 120 : 64;

  const opacity   = useSharedValue(animated ? 0 : 1);
  const scaleVal  = useSharedValue(animated ? 0.84 : 1);
  const floatY    = useSharedValue(0);
  const glow      = useSharedValue(animated ? 0 : 0.5);
  const sloganOp  = useSharedValue(animated ? 0 : 1);
  const sloganY   = useSharedValue(animated ? 10 : 0);

  useEffect(() => {
    if (!animated) return;

    // Fade + spring scale
    opacity.value  = withDelay(entryDelay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
    scaleVal.value = withDelay(entryDelay, withSpring(1, { damping: 18, stiffness: 68 }));

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

    // Slogan reveal
    sloganOp.value = withDelay(entryDelay + 900, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    sloganY.value  = withDelay(entryDelay + 900, withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [animated]);

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

  return (
    <Animated.View style={[styles.root, containerStyle]}>

      {/* Glow halo — shadow only, no visible shape */}
      <Animated.View
        style={[
          styles.glow,
          {
            width:        logoSize,
            height:       logoSize,
            borderRadius: logoSize / 2,
            shadowColor:  C.blue400,
          },
          glowStyle,
        ]}
      />

      {/* ── Custom SVG Geometric Logo Monogram (Entry Screen) / Stylized Text (Login Screen) ── */}
      {isLarge ? (
        <View style={[styles.logoWrap, { width: logoSize, height: logoSize }]}>
          <Svg width="100%" height="100%" viewBox="0 0 120 120">
            <Defs>
              <SvgLinearGradient id="logoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#3FA9F5" />
                <Stop offset="35%" stopColor="#9EEBFF" />
                <Stop offset="70%" stopColor="#FFF3D1" />
                <Stop offset="100%" stopColor="#FFC887" />
              </SvgLinearGradient>
            </Defs>

            {/* Outer partial circle arc */}
            <Path
              d="M 28,93 A 46,46 0 1,1 82,20"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth={6.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Top-right dot */}
            <Circle
              cx={96}
              cy={20}
              r={5}
              fill="url(#logoGrad)"
            />

            {/* Inner Mountain peak "A" */}
            <Path
              d="M 24,94 L 60,30 L 82,58"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth={6.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner Wave "W" */}
            <Path
              d="M 38,76 L 50,94 L 63,70 L 76,94 L 98,60"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth={6.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : (
        <View style={styles.wordWrap}>
          <Text style={[styles.word, { fontSize: 32, letterSpacing: 2 }]}>
            To|Do
          </Text>
        </View>
      )}

      {/* ── Slogan ── */}
      {showSlogan && (
        <Animated.Text style={[styles.slogan, sloganStyle]}>
          Ash_withs
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
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  wordWrap: {
    overflow: 'hidden',
  },
  word: {
    fontWeight:         '900',
    color:              '#FFFFFF',
    includeFontPadding: false,
  },
  slogan: {
    marginTop:     12,
    fontSize:      11,
    fontWeight:    '700',
    color:         C.text45,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
