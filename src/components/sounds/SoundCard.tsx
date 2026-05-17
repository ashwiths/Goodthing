import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { SoundTrack } from '../../constants/sounds';
import { TEXT } from '../../constants/colors';
import { SPRING } from '../../constants/animations';

interface SoundCardProps {
  track:      SoundTrack;
  isActive:   boolean;
  isPlaying:  boolean;
  onPress:    (id: string) => void;
}

export function SoundCard({ track, isActive, isPlaying, onPress }: SoundCardProps) {
  const { primary } = useTheme();
  const { light } = useHaptics();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = isActive ? track.color : 'rgba(255,255,255,0.1)';

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.93, SPRING.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING.bouncy); }}
        onPress={() => { light(); onPress(track.id); }}
        style={[
          styles.card,
          { borderColor: color },
          isActive && { backgroundColor: track.color + '18' },
        ]}
        accessibilityLabel={`${track.title}. ${isActive && isPlaying ? 'Playing' : 'Stopped'}`}
        accessibilityRole="button"
      >
        <Text style={styles.icon}>{track.icon}</Text>
        <View style={styles.info}>
          <Text style={[styles.title, isActive && { color: track.color }]}>{track.title}</Text>
          <Text style={styles.desc}>{track.description}</Text>
        </View>
        <View style={[
          styles.playBtn,
          { backgroundColor: isActive ? track.color : 'rgba(255,255,255,0.08)' }
        ]}>
          <Text style={styles.playIcon}>{isActive && isPlaying ? '⏸' : '▶'}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 16,
    borderWidth: 1.5, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 12,
  },
  icon:    { fontSize: 28 },
  info:    { flex: 1 },
  title:   { color: TEXT.primary, fontSize: 15, fontWeight: '600' },
  desc:    { color: TEXT.muted, fontSize: 12, marginTop: 2 },
  playBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  playIcon:{ fontSize: 14 },
});
