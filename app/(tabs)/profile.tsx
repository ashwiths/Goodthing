import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../src/stores/userStore';
import { useTheme } from '../../src/hooks/useTheme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientHeader } from '../../src/components/ui/GradientHeader';
import { ThemePicker } from '../../src/components/settings/ThemePicker';
import { SettingsRow } from '../../src/components/settings/SettingsRow';
import { XPBar } from '../../src/components/home/XPBar';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { DARK, TEXT, NEON } from '../../src/constants/colors';
import { getXPProgress, getLevelTitle } from '../../src/utils/xpUtils';
import { formatMinutes, formatStreak } from '../../src/utils/formatters';

export default function ProfileScreen() {
  const { primary } = useTheme();
  const { profile, xp, streak, stats, prefs, updateProfile } = useUserStore();
  const xpProg = getXPProgress(xp.total);

  const STAT_ITEMS = [
    { icon: '✅', label: 'Habits',      value: stats.habitsCompleted, color: NEON.green   },
    { icon: '🎯', label: 'Sessions',    value: stats.focusSessions,   color: NEON.cyan    },
    { icon: '⏱',  label: 'Focus Time',  value: formatMinutes(stats.focusMinutes), color: NEON.violet },
    { icon: '📝', label: 'Journal',     value: stats.journalEntries,  color: NEON.amber   },
    { icon: '💭', label: 'Mood Logs',   value: stats.moodLogs,        color: NEON.pink    },
    { icon: '🏆', label: 'Achievements',value: stats.achievements,    color: NEON.cyan    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface, DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <GradientHeader title="Profile" subtitle={getLevelTitle(xpProg.level)} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Avatar + Info */}
          <Animated.View entering={FadeInDown.delay(0)}>
            <GlassCard gradient glowColor={primary} padding={24}>
              <View style={styles.profileRow}>
                <Pressable
                  onPress={() => Alert.alert('Avatar', 'Avatar customization coming in Phase 2!')}
                  style={[styles.avatar, { borderColor: primary }]}
                  accessibilityLabel="Change avatar"
                >
                  <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
                  <View style={[styles.avatarBadge, { backgroundColor: primary }]}>
                    <Text style={styles.avatarBadgeText}>✎</Text>
                  </View>
                </Pressable>
                <View style={styles.profileInfo}>
                  <Text style={styles.username}>{profile.username}</Text>
                  <Text style={[styles.levelBadge, { color: primary }]}>
                    ⚡ LVL {xpProg.level} · {getLevelTitle(xpProg.level)}
                  </Text>
                  <View style={styles.streakRow}>
                    <Text style={styles.streakFire}>🔥</Text>
                    <Text style={styles.streakText}>{formatStreak(streak.current)} streak</Text>
                  </View>
                </View>
              </View>

              <View style={styles.xpSection}>
                <XPBar
                  level={xpProg.level}
                  current={xpProg.current}
                  toNext={xpProg.toNext}
                  percent={xpProg.percent}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Stats grid */}
          <Animated.View entering={FadeInDown.delay(80)}>
            <Text style={styles.sectionLabel}>LIFETIME STATS</Text>
            <View style={styles.statsGrid}>
              {STAT_ITEMS.map((s) => (
                <GlassCard key={s.label} padding={14} style={styles.statCell} glowColor={s.color}>
                  <Text style={styles.statIcon}>{s.icon}</Text>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          {/* Theme picker */}
          <Animated.View entering={FadeInDown.delay(120)}>
            <GlassCard gradient padding={16}>
              <ThemePicker />
            </GlassCard>
          </Animated.View>

          {/* Settings shortcut */}
          <Animated.View entering={FadeInDown.delay(160)}>
            <Text style={styles.sectionLabel}>SETTINGS</Text>
            <GlassCard padding={4}>
              <SettingsRow icon="🔔" label="Notifications"    value={prefs.notifications ? 'On' : 'Off'} onPress={() => router.push('/(tabs)/settings' as any)} />
              <SettingsRow icon="📳" label="Haptics"          value={prefs.haptics ? 'On' : 'Off'}        onPress={() => router.push('/(tabs)/settings' as any)} />
              <SettingsRow icon="🔐" label="App Lock"         value={prefs.appLockEnabled ? 'On' : 'Off'} onPress={() => router.push('/(tabs)/settings' as any)} />
              <SettingsRow icon="⚙️" label="All Settings"                                                  onPress={() => router.push('/(tabs)/settings' as any)} />
            </GlassCard>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: DARK.bg },
  safe:        { flex: 1 },
  content:     { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  profileRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji:     { fontSize: 36 },
  avatarBadge:     { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarBadgeText: { fontSize: 10, color: '#000', fontWeight: '900' },
  profileInfo:  { flex: 1, gap: 4 },
  username:     { color: TEXT.primary, fontSize: 22, fontWeight: '800' },
  levelBadge:   { fontSize: 13, fontWeight: '700' },
  streakRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakFire:   { fontSize: 13 },
  streakText:   { color: TEXT.secondary, fontSize: 13 },
  xpSection:    {},
  sectionLabel: { color: TEXT.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell:     { width: '30.5%', alignItems: 'center', gap: 4 },
  statIcon:     { fontSize: 20 },
  statVal:      { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLabel:    { color: TEXT.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
