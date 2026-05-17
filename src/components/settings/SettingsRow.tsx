import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { TEXT, DARK } from '../../constants/colors';

interface SettingsRowProps {
  icon:     string;
  label:    string;
  value?:   string;
  right?:   React.ReactNode;
  onPress?: () => void;
  danger?:  boolean;
}

export function SettingsRow({ icon, label, value, right, onPress, danger }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={label}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.label, danger && { color: '#FF2D55' }]}>{label}</Text>
      </View>
      <View style={styles.right}>
        {value && <Text style={styles.value}>{value}</Text>}
        {right}
        {onPress && !right && <Text style={styles.chevron}>›</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 2,
  },
  pressed: { opacity: 0.7 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  icon:  { fontSize: 20 },
  label: { color: TEXT.primary, fontSize: 15, fontWeight: '500', flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { color: TEXT.muted, fontSize: 14 },
  chevron:{ color: TEXT.muted, fontSize: 20 },
});
