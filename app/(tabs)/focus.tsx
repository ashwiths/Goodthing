import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusTimer } from '../../src/hooks/useFocusTimer';
import { useAmbientSound } from '../../src/hooks/useAmbientSound';
import { useTheme } from '../../src/hooks/useTheme';
import { TimerRing } from '../../src/components/focus/TimerRing';
import { SessionControls } from '../../src/components/focus/SessionControls';
import { SoundCard } from '../../src/components/sounds/SoundCard';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientHeader } from '../../src/components/ui/GradientHeader';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { AMBIENT_SOUNDS } from '../../src/constants/sounds';
import { useFocusStore } from '../../src/stores/focusStore';
import { DARK, TEXT, NEON } from '../../src/constants/colors';
import { formatMinutes } from '../../src/utils/formatters';

export default function FocusScreen() {
  const { primary } = useTheme();
  const { phase, status, timeRemaining, currentSession, settings, start, pause, reset } = useFocusTimer();
  const { nextPhase } = useFocusStore();
  const { activeSoundId, isPlaying, volume, toggleSound, setVolume } = useAmbientSound();
  const { getTodayStats } = useFocusStore();
  const todayStats = getTodayStats();
  const totalDuration = (phase === 'focus'
    ? settings.focusDuration
    : phase === 'shortBreak'
    ? settings.shortBreakDuration
    : settings.longBreakDuration) * 60;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, '#0D0818', DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <GradientHeader
          title="Focus"
          subtitle={`Session ${currentSession}`}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Timer Ring */}
          <Animated.View entering={FadeInDown.delay(0)} style={styles.ringContainer}>
            <TimerRing
              timeRemaining={timeRemaining}
              totalDuration={totalDuration}
              phase={phase}
            />
          </Animated.View>

          {/* Controls */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <SessionControls
              status={status}
              onStart={start}
              onPause={pause}
              onReset={reset}
              onNext={nextPhase}
            />
          </Animated.View>

          {/* Today Stats */}
          <Animated.View entering={FadeInDown.delay(140)}>
            <GlassCard gradient glowColor={primary} style={styles.statsCard}>
              <Text style={styles.statsTitle}>Today's Focus</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statVal, { color: primary }]}>{todayStats.sessions}</Text>
                  <Text style={styles.statLabel}>Sessions</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statVal, { color: primary }]}>{formatMinutes(todayStats.minutes)}</Text>
                  <Text style={styles.statLabel}>Focused</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statVal, { color: primary }]}>{currentSession - 1}</Text>
                  <Text style={styles.statLabel}>Cycles</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Ambient Sounds */}
          <Animated.View entering={FadeInDown.delay(180)}>
            <Text style={styles.sectionLabel}>🎵 AMBIENT SOUNDS</Text>
            {AMBIENT_SOUNDS.map((track) => (
              <SoundCard
                key={track.id}
                track={track}
                isActive={activeSoundId === track.id}
                isPlaying={isPlaying && activeSoundId === track.id}
                onPress={toggleSound}
              />
            ))}
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: DARK.bg },
  safe:          { flex: 1 },
  content:       { paddingHorizontal: 20, paddingTop: 16, gap: 20, alignItems: 'center' },
  ringContainer: { alignItems: 'center', paddingVertical: 16 },
  statsCard:     { width: '100%' },
  statsTitle:    { color: TEXT.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  statsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  stat:          { alignItems: 'center', gap: 4 },
  statVal:       { fontSize: 26, fontWeight: '800', letterSpacing: -1 },
  statLabel:     { color: TEXT.muted, fontSize: 11, fontWeight: '600' },
  statDivider:   { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' },
  sectionLabel:  { color: TEXT.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8, alignSelf: 'flex-start', width: '100%' },
});
