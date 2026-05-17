import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { THEMES, ThemeKey } from '../../constants/colors';
import { useThemeStore } from '../../stores/themeStore';
import { TEXT } from '../../constants/colors';
import { useHaptics } from '../../hooks/useHaptics';

export function ThemePicker() {
  const { activeTheme, setTheme } = useThemeStore();
  const { selection } = useHaptics();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>NEON THEME</Text>
      <View style={styles.grid}>
        {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
          <Pressable
            key={key}
            onPress={() => { selection(); setTheme(key); }}
            style={[
              styles.chip,
              { borderColor: t.primary },
              activeTheme === key && { backgroundColor: t.primary + '33' },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: activeTheme === key }}
            accessibilityLabel={t.name}
          >
            <View style={[styles.dot, { backgroundColor: t.primary }]} />
            <Text style={[styles.name, activeTheme === key && { color: t.primary }]}>{t.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label:     { color: TEXT.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  dot:  { width: 10, height: 10, borderRadius: 5 },
  name: { color: TEXT.secondary, fontSize: 12, fontWeight: '600' },
});
