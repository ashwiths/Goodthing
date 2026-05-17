import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { DARK, TEXT } from '../../constants/colors';

interface GradientHeaderProps {
  title:        string;
  subtitle?:    string;
  right?:       React.ReactNode;
  style?:       ViewStyle;
  showBack?:    boolean;
}

export function GradientHeader({ title, subtitle, right, style }: GradientHeaderProps) {
  const { primary } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[DARK.bg, DARK.surface]}
      style={[styles.container, { paddingTop: insets.top + 8 }, style]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: primary }]}>{subtitle}</Text>}
        </View>
        {right && <View style={styles.right}>{right}</View>}
      </View>
      {/* Neon bottom line */}
      <LinearGradient
        colors={[primary + '00', primary + 'BB', primary + '00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.line}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom:     16,
  },
  content: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  left:  { flex: 1 },
  right: {},
  title: {
    color:      TEXT.primary,
    fontSize:   26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize:   13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop:   2,
  },
  line: {
    height:    1.5,
    marginTop: 12,
    opacity:   0.7,
  },
});
