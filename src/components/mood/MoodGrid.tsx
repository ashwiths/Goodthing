import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { MOOD_OPTIONS, MoodLevel } from '../../types/mood.types';
import { TEXT } from '../../constants/colors';
import { SPRING } from '../../constants/animations';

interface MoodGridProps {
  selected?:  MoodLevel | null;
  onSelect:   (level: MoodLevel) => void;
}

function MoodButton({ option, selected, onSelect }: {
  option:   typeof MOOD_OPTIONS[0];
  selected: boolean;
  onSelect: (l: MoodLevel) => void;
}) {
  const scale = useSharedValue(1);
  const { medium } = useHaptics();

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    medium();
    scale.value = withSequence(
      withSpring(1.2, SPRING.snappy),
      withSpring(1,   SPRING.bouncy)
    );
    onSelect(option.level);
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.moodBtn,
          selected && { borderColor: option.color, backgroundColor: option.color + '22' },
        ]}
        accessibilityLabel={option.label}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
      >
        <Text style={styles.emoji}>{option.emoji}</Text>
        <Text style={[styles.moodLabel, selected && { color: option.color }]}>{option.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function MoodGrid({ selected, onSelect }: MoodGridProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.grid}>
        {MOOD_OPTIONS.map((opt) => (
          <MoodButton
            key={opt.level}
            option={opt}
            selected={selected === opt.level}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  title: {
    color: TEXT.primary, fontSize: 18, fontWeight: '700', textAlign: 'center',
  },
  grid: {
    flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8,
  },
  moodBtn: {
    alignItems: 'center', padding: 12,
    borderRadius: 16, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 60,
  },
  emoji:     { fontSize: 34 },
  moodLabel: { color: TEXT.muted, fontSize: 11, fontWeight: '600', marginTop: 4 },
});
