import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../ui/GlassCard';
import { TEXT } from '../../constants/colors';
import { DailyMission } from '../../types/user.types';
import { useHaptics } from '../../hooks/useHaptics';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface DailyMissionCardProps {
  missions:        DailyMission[];
  onComplete:      (id: string) => void;
}

export function DailyMissionCard({ missions, onComplete }: DailyMissionCardProps) {
  const { primary } = useTheme();
  const { success } = useHaptics();
  const completed = missions.filter((m) => m.completed).length;

  return (
    <GlassCard gradient glowColor={primary} padding={16}>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Daily Missions</Text>
        <Text style={[styles.count, { color: primary }]}>{completed}/{missions.length}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(completed / missions.length) * 100}%`, backgroundColor: primary },
          ]}
        />
      </View>
      {missions.map((m, i) => (
        <Animated.View key={m.id} entering={FadeInRight.delay(i * 60)}>
          <Pressable
            style={[styles.missionRow, m.completed && styles.completedRow]}
            onPress={() => { if (!m.completed) { success(); onComplete(m.id); } }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: m.completed }}
          >
            <Text style={styles.missionIcon}>{m.icon}</Text>
            <View style={styles.missionText}>
              <Text style={[styles.missionTitle, m.completed && styles.strikeThrough]}>
                {m.title}
              </Text>
              <Text style={styles.missionDesc}>{m.description}</Text>
            </View>
            <View style={[styles.xpBadge, { borderColor: primary }]}>
              <Text style={[styles.xpText, { color: primary }]}>+{m.xpReward}</Text>
            </View>
            <View style={[styles.check, m.completed && { backgroundColor: primary }]}>
              {m.completed && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </Pressable>
        </Animated.View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  title:    { color: TEXT.primary, fontSize: 16, fontWeight: '700' },
  count:    { fontSize: 14, fontWeight: '800' },
  progressTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, marginBottom: 12, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  missionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 10,
  },
  completedRow: { opacity: 0.5 },
  missionIcon:  { fontSize: 20 },
  missionText:  { flex: 1 },
  missionTitle: { color: TEXT.primary, fontSize: 14, fontWeight: '600' },
  missionDesc:  { color: TEXT.muted, fontSize: 12 },
  strikeThrough: { textDecorationLine: 'line-through' },
  xpBadge: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  xpText:   { fontSize: 11, fontWeight: '700' },
  check: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#000', fontSize: 12, fontWeight: '800' },
});
