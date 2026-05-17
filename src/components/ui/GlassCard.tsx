import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

interface GlassCardProps {
  children:   React.ReactNode;
  style?:     StyleProp<ViewStyle>;
  intensity?: number;       // blur 0-100
  glowColor?: string;       // optional neon edge glow
  gradient?:  boolean;      // show top-edge gradient sheen
  padding?:   number;
}

export function GlassCard({
  children, style, intensity = 20, glowColor, gradient = false, padding = 16,
}: GlassCardProps) {
  const { glass, glowStyle } = useTheme();

  return (
    <View style={[styles.wrapper, glowColor && { ...glowStyle, shadowColor: glowColor }, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      {gradient && (
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradientSheen]}
        />
      )}
      <View style={[styles.border, { padding }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow:     'hidden',
    backgroundColor: 'rgba(10,10,20,0.6)',
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.08)',
  },
  gradientSheen: {
    borderRadius: 20,
    opacity:      0.6,
  },
  border: {
    borderRadius: 20,
  },
});
