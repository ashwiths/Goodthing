import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { TEXT } from '../../constants/colors';
import { SPRING } from '../../constants/animations';

interface QuickAction {
  icon:   string;
  label:  string;
  href:   string;
  color:  string;
}

const ACTIONS: QuickAction[] = [
  { icon: '✅', label: 'Habits',  href: '/(tabs)/habits',  color: '#39FF14' },
  { icon: '🎯', label: 'Focus',   href: '/(tabs)/focus',   color: '#00F5FF' },
  { icon: '💭', label: 'Mood',    href: '/(tabs)/mood',    color: '#F72585' },
  { icon: '📝', label: 'Journal', href: '/(tabs)/journal', color: '#8B5CF6' },
  { icon: '🎵', label: 'Sounds',  href: '/(tabs)/focus',   color: '#FFB703' },
  { icon: '📊', label: 'Stats',   href: '/(tabs)/profile', color: '#3B82F6' },
];

function ActionTile({ action }: { action: QuickAction }) {
  const { light } = useHaptics();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92, SPRING.snappy); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING.bouncy); }}
        onPress={() => { light(); router.push(action.href as any); }}
        style={[styles.tile, { borderColor: action.color + '44' }]}
        accessibilityLabel={action.label}
      >
        <View style={[styles.iconBg, { backgroundColor: action.color + '22' }]}>
          <Text style={styles.icon}>{action.icon}</Text>
        </View>
        <Text style={styles.label}>{action.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function QuickActionGrid() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {ACTIONS.map((a) => <ActionTile key={a.label} action={a} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: TEXT.secondary, fontSize: 12, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  tile: {
    width: 90, alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderRadius: 16, padding: 12,
  },
  iconBg: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  icon:  { fontSize: 22 },
  label: { color: TEXT.secondary, fontSize: 11, fontWeight: '600' },
});
