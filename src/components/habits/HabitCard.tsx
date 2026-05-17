import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { GlassCard } from '../ui/GlassCard';
import { StreakBadge } from './StreakBadge';
import { HabitWithStats } from '../../types/habit.types';
import { TEXT } from '../../constants/colors';
import { SPRING } from '../../constants/animations';

interface HabitCardProps {
  habit:      HabitWithStats;
  onToggle:   (id: string) => void;
  onLongPress:(id: string) => void;
}

export function HabitCard({ habit, onToggle, onLongPress }: HabitCardProps) {
  const { primary } = useTheme();
  const { success, medium } = useHaptics();
  const scale      = useSharedValue(1);
  const checkScale = useSharedValue(habit.completedToday ? 1 : 0);

  const cardStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  const handleToggle = useCallback(() => {
    if (!habit.completedToday) {
      success();
      scale.value = withSequence(
        withSpring(1.04, SPRING.snappy),
        withSpring(1,    SPRING.bouncy)
      );
      checkScale.value = withSpring(1, SPRING.bouncy);
    } else {
      medium();
      checkScale.value = withTiming(0, { duration: 200 });
    }
    onToggle(habit.id);
  }, [habit.completedToday, habit.id]);

  return (
    <Animated.View style={cardStyle}>
      <GlassCard
        gradient
        glowColor={habit.completedToday ? habit.color : undefined}
        padding={14}
        style={[styles.card, habit.completedToday && { borderColor: habit.color + '55' }]}
      >
        <Pressable
          onPress={handleToggle}
          onLongPress={() => { medium(); onLongPress(habit.id); }}
          style={styles.row}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: habit.completedToday }}
          accessibilityLabel={habit.title}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: habit.color + '22' }]}>
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>

          {/* Text */}
          <View style={styles.content}>
            <Text style={styles.title}>{habit.title}</Text>
            {habit.description ? (
              <Text style={styles.desc} numberOfLines={1}>{habit.description}</Text>
            ) : null}
            <StreakBadge streak={habit.streak.currentStreak} color={habit.color} />
          </View>

          {/* XP */}
          <Text style={[styles.xp, { color: habit.color }]}>+{habit.xpReward}</Text>

          {/* Check */}
          <Pressable onPress={handleToggle} style={[
            styles.checkCircle,
            { borderColor: habit.completedToday ? habit.color : 'rgba(255,255,255,0.2)' },
            habit.completedToday && { backgroundColor: habit.color },
          ]}>
            <Animated.Text style={[styles.checkMark, checkStyle]}>✓</Animated.Text>
          </Pressable>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card:    { marginBottom: 10 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap:{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon:    { fontSize: 22 },
  content: { flex: 1, gap: 2 },
  title:   { color: TEXT.primary, fontSize: 15, fontWeight: '600' },
  desc:    { color: TEXT.muted, fontSize: 12 },
  xp:      { fontSize: 12, fontWeight: '700' },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#000', fontSize: 14, fontWeight: '900' },
});
