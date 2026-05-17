import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface StreakBadgeProps {
  streak: number;
  color:  string;
}

export function StreakBadge({ streak, color }: StreakBadgeProps) {
  if (streak === 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={styles.fire}>🔥</Text>
      <Text style={[styles.text, { color }]}>{streak}d streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start',
  },
  fire: { fontSize: 10 },
  text: { fontSize: 10, fontWeight: '700' },
});
