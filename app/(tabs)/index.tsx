import React from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/stores/userStore';
import { useHabitStore } from '../../src/stores/habitStore';
import { useFocusStore } from '../../src/stores/focusStore';
import { useMoodStore } from '../../src/stores/moodStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { XPBar } from '../../src/components/home/XPBar';
import { DailyMissionCard } from '../../src/components/home/DailyMissionCard';
import { QuickActionGrid } from '../../src/components/home/QuickActionGrid';
import { StatCard } from '../../src/components/home/StatCard';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { DARK, TEXT, NEON } from '../../src/constants/colors';
import { getGreeting, formatTime } from '../../src/utils/dateUtils';
import { formatStreak } from '../../src/utils/formatters';
import { getXPProgress } from '../../src/utils/xpUtils';
import { MOOD_OPTIONS } from '../../src/types/mood.types';

export default function HomeScreen() {
  const { primary, secondary } = useTheme();
  const { heavy } = useHaptics();

  const { profile, xp, streak, missions, completeMission } = useUserStore();
  const habitStore   = useHabitStore();
  const focusStore   = useFocusStore();
  const moodStore    = useMoodStore();

  const xpProgress   = getXPProgress(xp.total);
  const todayFocus   = focusStore.getTodayStats();
  const habitsToday  = habitStore.getHabitsWithStats().filter((h) => h.completedToday).length;
  const todayMood    = moodStore.getTodayLog();
  const moodOption   = todayMood ? MOOD_OPTIONS.find((m) => m.level === todayMood.level) : null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface, DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(0)} style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.username}>{profile.username}</Text>
              <View style={[styles.streakRow]}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={[styles.streakText, { color: primary }]}>
                  {formatStreak(streak.current)} streak
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/profile' as any)}
              style={[styles.avatar, { borderColor: primary }]}
              accessibilityLabel="Open profile"
            >
              <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
            </Pressable>
          </Animated.View>

          {/* ── XP Bar ──────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80)}>
            <GlassCard gradient glowColor={primary} style={styles.xpCard}>
              <XPBar
                level={xpProgress.level}
                current={xpProgress.current}
                toNext={xpProgress.toNext}
                percent={xpProgress.percent}
              />
            </GlassCard>
          </Animated.View>

          {/* ── DEEP WORK CTA ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(120)}>
            <Pressable
              onPress={() => { heavy(); router.push('/(tabs)/focus' as any); }}
              accessibilityLabel="Start Deep Work Focus Session"
            >
              <LinearGradient
                colors={[primary + 'DD', secondary + 'AA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.deepWorkBtn}
              >
                <Text style={styles.deepWorkIcon}>⚡</Text>
                <View>
                  <Text style={styles.deepWorkLabel}>START DEEP WORK</Text>
                  <Text style={styles.deepWorkSub}>Pomodoro · Focus Timer · Ambient Sounds</Text>
                </View>
                <Text style={styles.deepWorkArrow}>›</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Today Stats ──────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(160)}>
            <Text style={styles.sectionLabel}>TODAY'S SUMMARY</Text>
            <View style={styles.statsRow}>
              <StatCard
                icon="🎯"
                value={todayFocus.sessions}
                label="Focus Sessions"
                color={NEON.cyan}
                subtext={`${todayFocus.minutes}min`}
              />
              <StatCard
                icon="✅"
                value={habitsToday}
                label="Habits Done"
                color={NEON.green}
              />
              <StatCard
                icon="💭"
                value={moodOption?.emoji ?? '—'}
                label="Mood"
                color={moodOption?.color ?? NEON.violet}
                subtext={moodOption?.label}
              />
            </View>
          </Animated.View>

          {/* ── Quick Actions ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <QuickActionGrid />
          </Animated.View>

          {/* ── Daily Missions ────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(240)}>
            <DailyMissionCard
              missions={missions}
              onComplete={completeMission}
            />
          </Animated.View>

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 90 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  safe:      { flex: 1 },
  scroll:    { flex: 1 },
  content:   { paddingHorizontal: 20, paddingTop: 12, gap: 16 },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingBottom: 4,
  },
  greeting:  { color: TEXT.muted, fontSize: 14, fontWeight: '500' },
  username:  { color: TEXT.primary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  streakFire:{ fontSize: 14 },
  streakText:{ fontSize: 13, fontWeight: '700' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 26 },

  xpCard: {},

  deepWorkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 18,
    shadowColor: '#00F5FF', shadowOpacity: 0.4,
    shadowRadius: 20, elevation: 10,
  },
  deepWorkIcon:  { fontSize: 32 },
  deepWorkLabel: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  deepWorkSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  deepWorkArrow: { color: '#fff', fontSize: 28, marginLeft: 'auto' },

  sectionLabel: {
    color: TEXT.muted, fontSize: 10, fontWeight: '800',
    letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
});