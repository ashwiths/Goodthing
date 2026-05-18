import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function HeadphoneBanner() {
  const { P, getBlurIntensity } = useAppTheme();

  return (
    <View style={[s.banner, { borderColor: '#87C4FF35' }]}>
      <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={s.glowOverlay} />
      
      <View style={s.iconContainer}>
        <Ionicons name="headset-outline" size={20} color="#87C4FF" />
      </View>

      <View style={s.textContainer}>
        <Text style={[s.title, { color: P.white }]}>🎧 Best Experience with Headphones</Text>
        <Text style={[s.subtitle, { color: P.dim }]}>
          For immersive ambient audio and deeper focus sessions, we recommend using headphones.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(135,196,255,0.03)',
    shadowColor: '#87C4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(135,196,255,0.02)',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(135,196,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(135,196,255,0.25)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  }
});
