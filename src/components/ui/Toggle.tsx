import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { SPRING } from '../../constants/animations';

interface ToggleProps {
  value:    boolean;
  onChange: (val: boolean) => void;
  style?:   ViewStyle;
  disabled?: boolean;
}

export function Toggle({ value, onChange, style, disabled }: ToggleProps) {
  const { primary } = useTheme();
  const { selection } = useHaptics();
  const progress = useSharedValue(value ? 1 : 0);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.1)', primary]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 22 }],
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;
    const next = !value;
    progress.value = withSpring(next ? 1 : 0, SPRING.snappy);
    selection();
    onChange(next);
  }, [value, disabled]);

  return (
    <Pressable onPress={handlePress} style={style} accessibilityRole="switch">
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width:        50,
    height:       28,
    borderRadius: 14,
    padding:       3,
    justifyContent: 'center',
  },
  thumb: {
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: '#fff',
    shadowColor:     '#000',
    shadowOpacity:   0.3,
    shadowRadius:    4,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       4,
  },
});
