import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 30,
  borderRadius = 24,
  padding = 28,
}: GlassCardProps) {
  return (
    <View style={[styles.wrapper, { borderRadius }, style]}>
      {/* Blur layer */}
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {/* Glass tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            backgroundColor: COLORS.glass15,
          },
        ]}
      />
      {/* Border shimmer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            borderWidth: 1,
            borderColor: COLORS.glassBorderStrong,
          },
        ]}
      />
      {/* Content */}
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
});
