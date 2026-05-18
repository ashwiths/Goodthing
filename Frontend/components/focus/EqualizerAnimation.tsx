import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  withSpring
} from 'react-native-reanimated';

interface EqualizerProps {
  isPlaying: boolean;
  color?: string;
}

export default function EqualizerAnimation({ isPlaying, color = '#87C4FF' }: EqualizerProps) {
  const barCount = 5;
  const heights = Array.from({ length: barCount }).map(() => useSharedValue(4));

  useEffect(() => {
    if (isPlaying) {
      heights.forEach((h, i) => {
        const targetMax = 12 + Math.random() * 16;
        h.value = withRepeat(
          withSequence(
            withTiming(targetMax, { duration: 300 + i * 70, easing: Easing.inOut(Easing.ease) }),
            withTiming(4, { duration: 300 + i * 70, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      });
    } else {
      heights.forEach((h) => {
        h.value = withSpring(4);
      });
    }
  }, [isPlaying]);

  return (
    <View style={s.container}>
      {heights.map((h, i) => {
        const barStyle = useAnimatedStyle(() => ({
          height: h.value,
        }));

        return (
          <Animated.View
            key={i}
            style={[
              s.bar,
              { backgroundColor: color, opacity: isPlaying ? 0.9 : 0.4 },
              barStyle
            ]}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    gap: 3,
    justifyContent: 'center',
    width: 40,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    minHeight: 4,
  }
});
