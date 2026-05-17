import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMoodStore } from '../../src/stores/moodStore';
import { useUserStore } from '../../src/stores/userStore';
import { useTheme } from '../../src/hooks/useTheme';
import { MoodGrid } from '../../src/components/mood/MoodGrid';
import { MoodHistoryChart } from '../../src/components/mood/MoodHistoryChart';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { GradientHeader } from '../../src/components/ui/GradientHeader';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { DARK, TEXT, NEON } from '../../src/constants/colors';
import { MoodLevel, MOOD_OPTIONS } from '../../src/types/mood.types';
import { getLast7Days, formatDisplayDate } from '../../src/utils/dateUtils';
import { XP_REWARDS } from '../../src/utils/xpUtils';

export default function MoodScreen() {
  const { primary } = useTheme();
  const { logMood, getTodayLog, getLast7, getStats } = useMoodStore();
  const { addXP, updateStats } = useUserStore();

  const todayLog = getTodayLog();
  const last7    = getLast7();
  const stats    = getStats();
  const last7Days= getLast7Days();

  const [selected, setSelected] = useState<MoodLevel | null>(todayLog?.level ?? null);
  const [note,     setNote]     = useState(todayLog?.note ?? '');
  const [saved,    setSaved]    = useState(!!todayLog);

  const moodOption = selected ? MOOD_OPTIONS.find((m) => m.level === selected) : null;

  const handleSave = () => {
    if (!selected) return;
    const isNew = !todayLog;
    logMood(selected, note);
    if (isNew) {
      addXP(XP_REWARDS.moodLog);
      updateStats({ moodLogs: 1 });
    }
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface, DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <GradientHeader title="Mood" subtitle="How are you feeling?" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Current mood display */}
          {saved && moodOption ? (
            <Animated.View entering={FadeInDown.delay(0)}>
              <GlassCard gradient glowColor={moodOption.color} padding={20}>
                <View style={styles.todayMoodRow}>
                  <Text style={styles.bigEmoji}>{moodOption.emoji}</Text>
                  <View style={styles.todayMoodText}>
                    <Text style={styles.todayLabel}>Today's Mood</Text>
                    <Text style={[styles.todayMoodTitle, { color: moodOption.color }]}>{moodOption.label}</Text>
                    <Text style={styles.moodDesc}>{moodOption.description}</Text>
                  </View>
                </View>
                <NeonButton
                  label="Update Mood"
                  onPress={() => setSaved(false)}
                  variant="ghost"
                  size="sm"
                  style={styles.updateBtn}
                />
              </GlassCard>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(0)}>
              <GlassCard gradient glowColor={moodOption?.color ?? primary} padding={20}>
                <MoodGrid selected={selected} onSelect={(l) => { setSelected(l); setSaved(false); }} />

                {selected && (
                  <Animated.View entering={FadeInUp.delay(0)} style={styles.noteSection}>
                    <Text style={styles.noteLabel}>Add a note (optional)</Text>
                    <TextInput
                      value={note}
                      onChangeText={setNote}
                      placeholder="What's on your mind?"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={[styles.noteInput, { borderColor: moodOption?.color ?? primary }]}
                      multiline
                      numberOfLines={3}
                    />
                    <NeonButton label={`Save Mood  +${XP_REWARDS.moodLog}XP`} onPress={handleSave} />
                  </Animated.View>
                )}
              </GlassCard>
            </Animated.View>
          )}

          {/* 7-day mood stats */}
          {stats.totalLogs > 0 && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <GlassCard gradient>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: primary }]}>{stats.averageMood.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Avg Mood</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: primary }]}>{stats.totalLogs}</Text>
                    <Text style={styles.statLabel}>Total Logs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statVal, { color: primary }]}>
                      {stats.moodTrend === 'up' ? '📈' : stats.moodTrend === 'down' ? '📉' : '〰️'}
                    </Text>
                    <Text style={styles.statLabel}>Trend</Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* History chart */}
          <Animated.View entering={FadeInDown.delay(140)}>
            <GlassCard gradient padding={20}>
              <MoodHistoryChart logs={last7} dates={last7Days} />
            </GlassCard>
          </Animated.View>

          {/* Recent logs */}
          {last7.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180)}>
              <Text style={styles.sectionLabel}>RECENT ENTRIES</Text>
              {[...last7].reverse().map((log) => {
                const opt = MOOD_OPTIONS.find((m) => m.level === log.level);
                return (
                  <GlassCard key={log.id} padding={14} style={styles.logCard}>
                    <View style={styles.logRow}>
                      <Text style={styles.logEmoji}>{opt?.emoji}</Text>
                      <View style={styles.logText}>
                        <Text style={[styles.logMood, { color: opt?.color }]}>{opt?.label}</Text>
                        <Text style={styles.logDate}>{formatDisplayDate(log.loggedAt)}</Text>
                        {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: DARK.bg },
  safe:         { flex: 1 },
  content:      { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  todayMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  bigEmoji:     { fontSize: 52 },
  todayMoodText:{ flex: 1 },
  todayLabel:   { color: TEXT.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  todayMoodTitle:{ fontSize: 22, fontWeight: '800', marginTop: 2 },
  moodDesc:     { color: TEXT.secondary, fontSize: 13, marginTop: 2 },
  updateBtn:    { alignSelf: 'flex-start' },
  noteSection:  { gap: 10, marginTop: 16 },
  noteLabel:    { color: TEXT.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  noteInput:    {
    color: TEXT.primary, fontSize: 15, lineHeight: 22,
    borderWidth: 1.5, borderRadius: 14, padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    minHeight: 80, textAlignVertical: 'top',
  },
  statsRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:  { alignItems: 'center', gap: 4 },
  statVal:   { fontSize: 24, fontWeight: '800' },
  statLabel: { color: TEXT.muted, fontSize: 11, fontWeight: '600' },
  sectionLabel:{ color: TEXT.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 },
  logCard:   { marginBottom: 6 },
  logRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  logEmoji:  { fontSize: 24 },
  logText:   { flex: 1 },
  logMood:   { fontSize: 15, fontWeight: '700' },
  logDate:   { color: TEXT.muted, fontSize: 12 },
  logNote:   { color: TEXT.secondary, fontSize: 13, marginTop: 4 },
});
