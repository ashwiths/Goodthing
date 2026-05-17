import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { TEXT } from '../../constants/colors';

interface StatCardProps {
  icon:    string;
  value:   string | number;
  label:   string;
  color:   string;
  subtext?: string;
}

export function StatCard({ icon, value, label, color, subtext }: StatCardProps) {
  return (
    <GlassCard padding={12} style={styles.card} glowColor={color}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtext && <Text style={styles.sub}>{subtext}</Text>}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card:  { alignItems: 'center', minWidth: 80, flex: 1 },
  icon:  { fontSize: 22, marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { color: TEXT.muted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  sub:   { color: TEXT.muted, fontSize: 10, marginTop: 2, textAlign: 'center' },
});
