import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore } from '../../src/stores/habitStore';
import { useUserStore } from '../../src/stores/userStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { HabitCard } from '../../src/components/habits/HabitCard';
import { HabitForm } from '../../src/components/habits/HabitForm';
import { Modal } from '../../src/components/ui/Modal';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { GradientHeader } from '../../src/components/ui/GradientHeader';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { DARK, TEXT, NEON } from '../../src/constants/colors';
import { Habit } from '../../src/types/habit.types';
import { XP_REWARDS } from '../../src/utils/xpUtils';

const DEFAULT_HABITS = [
  { title: 'Morning Meditation', description: '10 min mindfulness', icon: '🧘', color: NEON.violet, category: 'mind',    frequency: 'daily', targetDays: [], xpReward: 10 },
  { title: 'Drink 2L Water',     description: 'Hydration goal',      icon: '💧', color: NEON.cyan,   category: 'health',  frequency: 'daily', targetDays: [], xpReward: 10 },
  { title: 'Evening Run',        description: '30 min cardio',        icon: '🏃', color: NEON.green,  category: 'fitness', frequency: 'daily', targetDays: [], xpReward: 15 },
] as const;

export default function HabitsScreen() {
  const { primary } = useTheme();
  const { success } = useHaptics();
  const habitStore = useHabitStore();
  const { addXP, updateStats, updateStreak } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const habitsWithStats = habitStore.getHabitsWithStats();

  // Seed defaults if no habits
  const hasSeedHabits = habitsWithStats.length > 0;

  const handleToggle = (id: string) => {
    const { wasCompleted, xpEarned } = habitStore.toggleCompletion(id);
    if (!wasCompleted && xpEarned > 0) {
      addXP(xpEarned);
      updateStats({ habitsCompleted: 1 });
      updateStreak();
    }
  };

  const handleSave = (data: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editHabit) {
      habitStore.updateHabit(editHabit.id, data);
    } else {
      habitStore.addHabit(data);
    }
    setShowForm(false);
    setEditHabit(null);
  };

  const handleLongPress = (id: string) => {
    const habit = habitsWithStats.find((h) => h.id === id);
    if (!habit) return;
    Alert.alert(habit.title, 'What would you like to do?', [
      { text: 'Edit',   onPress: () => { setEditHabit(habit); setShowForm(true); } },
      { text: 'Delete', style: 'destructive', onPress: () => habitStore.deleteHabit(id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const completedCount = habitsWithStats.filter((h) => h.completedToday).length;
  const total          = habitsWithStats.length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface, DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <GradientHeader
          title="Habits"
          subtitle={`${completedCount}/${total} today`}
          right={
            <Pressable onPress={() => { setEditHabit(null); setShowForm(true); }} style={styles.addBtn} accessibilityLabel="Add habit">
              <LinearGradient colors={[primary, primary + '88']} style={styles.addBtnGrad}>
                <Text style={styles.addBtnText}>+</Text>
              </LinearGradient>
            </Pressable>
          }
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Completion summary */}
          {total > 0 && (
            <Animated.View entering={FadeInDown.delay(0)}>
              <GlassCard gradient glowColor={completedCount === total ? NEON.green : primary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryEmoji}>{completedCount === total ? '🏆' : '⚡'}</Text>
                  <View>
                    <Text style={styles.summaryTitle}>
                      {completedCount === total ? 'All Done! Perfect Day!' : `${total - completedCount} habits remaining`}
                    </Text>
                    <Text style={styles.summarySub}>
                      {completedCount === total
                        ? 'You completed all your habits today!'
                        : `Keep going — ${completedCount} of ${total} complete`}
                    </Text>
                  </View>
                </View>
                {/* Mini progress */}
                <View style={styles.miniTrack}>
                  <View style={[
                    styles.miniFill,
                    { width: `${total > 0 ? (completedCount / total) * 100 : 0}%`, backgroundColor: primary },
                  ]} />
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Seed defaults if empty */}
          {!hasSeedHabits && (
            <Animated.View entering={FadeInDown.delay(60)}>
              <GlassCard padding={20}>
                <Text style={styles.emptyTitle}>Start Your Habit Journey</Text>
                <Text style={styles.emptyText}>Add your first habit or tap below to add starter habits.</Text>
                <View style={{ height: 12 }} />
                <NeonButton
                  label="Add Starter Habits"
                  onPress={() => {
                    DEFAULT_HABITS.forEach((h) => habitStore.addHabit(h as any));
                    success();
                  }}
                  variant="ghost"
                />
              </GlassCard>
            </Animated.View>
          )}

          {/* Habits list */}
          {habitsWithStats.map((habit, i) => (
            <Animated.View key={habit.id} entering={FadeInDown.delay(i * 60 + 80)}>
              <HabitCard
                habit={habit}
                onToggle={handleToggle}
                onLongPress={handleLongPress}
              />
            </Animated.View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showForm}
        onClose={() => { setShowForm(false); setEditHabit(null); }}
        title={editHabit ? 'Edit Habit' : 'New Habit'}
        height={620}
      >
        <HabitForm
          initial={editHabit ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditHabit(null); }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  safe:      { flex: 1 },
  scroll:    { flex: 1 },
  content:   { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  addBtn:    {},
  addBtnGrad:{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  addBtnText:{ color: '#000', fontSize: 22, fontWeight: '900', marginTop: -2 },
  summaryRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  summaryEmoji:{ fontSize: 32 },
  summaryTitle:{ color: TEXT.primary, fontSize: 15, fontWeight: '700' },
  summarySub:  { color: TEXT.muted, fontSize: 12 },
  miniTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  miniFill:  { height: '100%', borderRadius: 2 },
  emptyTitle:{ color: TEXT.primary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: TEXT.muted, fontSize: 14, lineHeight: 20 },
});
