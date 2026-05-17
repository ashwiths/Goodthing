import React, { useCallback } from 'react';
import {
  Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { SPRING, DURATION } from '../../constants/animations';
import { TEXT } from '../../constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface NeonButtonProps {
  label:      string;
  onPress:    () => void;
  variant?:   Variant;
  size?:      Size;
  disabled?:  boolean;
  loading?:   boolean;
  style?:     ViewStyle;
  textStyle?: TextStyle;
  icon?:      React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeonButton({
  label, onPress, variant = 'primary', size = 'md',
  disabled, loading, style, textStyle, icon, fullWidth,
}: NeonButtonProps) {
  const { primary, secondary, glowStyle } = useTheme();
  const { medium } = useHaptics();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value   = withSpring(0.95, SPRING.snappy);
    opacity.value = withTiming(0.85, { duration: DURATION.fast });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value   = withSpring(1, SPRING.bouncy);
    opacity.value = withTiming(1, { duration: DURATION.fast });
  }, []);

  const handlePress = useCallback(() => {
    medium();
    onPress();
  }, [onPress]);

  const sizeStyles = SIZE_MAP[size];
  const isGhost    = variant === 'ghost';
  const isDanger   = variant === 'danger';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animStyle, fullWidth && { width: '100%' }, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isGhost ? (
        <Animated.View style={[
          styles.ghostBtn, sizeStyles.container,
          { borderColor: primary },
          disabled && styles.disabled,
        ]}>
          {icon}
          <Text style={[styles.text, sizeStyles.text, { color: primary }, textStyle]}>
            {loading ? '...' : label}
          </Text>
        </Animated.View>
      ) : (
        <LinearGradient
          colors={isDanger
            ? ['#FF2D55', '#FF6B35']
            : [primary, secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.btn, sizeStyles.container,
            disabled && styles.disabled,
            !disabled && { ...glowStyle, shadowColor: primary },
          ]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                {icon}
                <Text style={[styles.text, sizeStyles.text, textStyle]}>{label}</Text>
              </>
          }
        </LinearGradient>
      )}
    </AnimatedPressable>
  );
}

const SIZE_MAP = {
  sm: { container: { paddingVertical: 8,  paddingHorizontal: 16, borderRadius: 10 }, text: { fontSize: 13 } },
  md: { container: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 }, text: { fontSize: 15 } },
  lg: { container: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16 }, text: { fontSize: 17 } },
};

const styles = StyleSheet.create({
  btn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
    gap: 8,
    backgroundColor: 'transparent',
  },
  text: {
    color:      TEXT.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabled: { opacity: 0.4 },
});
