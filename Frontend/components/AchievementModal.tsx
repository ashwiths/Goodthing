import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useGamificationStore } from '../src/store/gamificationStore';
import { fireSuccessHaptic } from '../utils/haptics';
import { C } from '../constants/colors';

const { width: W, height: H } = Dimensions.get('window');

const RARITY_COLORS = {
  common:    { text: '#CCCCCC', border: 'rgba(200,200,200,0.4)', glow: '#FFFFFF', name: 'Common' },
  rare:      { text: '#4CAF50', border: 'rgba(76,175,80,0.4)',  glow: '#4CAF50', name: 'Rare' },
  epic:      { text: '#00D2FF', border: 'rgba(0,210,255,0.4)',  glow: '#00D2FF', name: 'Epic' },
  legendary: { text: '#FFD700', border: 'rgba(255,215,0,0.4)',   glow: '#FFD700', name: 'Legendary' }
};

export function AchievementModal() {
  const { newlyUnlockedBadge, clearUnlockedBadgePopup } = useGamificationStore();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glow = useSharedValue(1);

  // Trigger when newlyUnlockedBadge changes
  useEffect(() => {
    if (newlyUnlockedBadge) {
      fireSuccessHaptic();

      scale.value = withSpring(1, { damping: 12, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });

      // Pulsing infinite glow
      glow.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [newlyUnlockedBadge]);

  if (!newlyUnlockedBadge) return null;

  const rarity = newlyUnlockedBadge.rarity || 'common';
  const theme = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
    opacity: interpolateGlowOpacity(glow.value)
  }));

  function interpolateGlowOpacity(val: number) {
    'worklet';
    return 0.3 + (val - 1) * 3; // fades in/out beautifully
  }

  const handleClose = () => {
    scale.value = withTiming(0, { duration: 250 }, () => {
      opacity.value = withTiming(0, { duration: 100 }, () => {
        clearUnlockedBadgePopup();
      });
    });
  };

  return (
    <Modal transparent visible={!!newlyUnlockedBadge} animationType="none">
      <View style={s.overlay}>
        {/* Soft-blur backplane */}
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View style={[s.modalCard, modalStyle, { borderColor: theme.border }]}>
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Background SVGs / Glow Rings */}
          <Animated.View style={[s.glowRing, glowStyle, { borderColor: theme.border, shadowColor: theme.glow }]} />

          {/* Sparkles / Particles Simulation using inline SVGs */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Circle cx="40" cy="50" r="3" fill={theme.glow} opacity="0.6" />
              <Circle cx="240" cy="70" r="2" fill={theme.glow} opacity="0.4" />
              <Circle cx="80" cy="220" r="4" fill={theme.glow} opacity="0.5" />
              <Circle cx="220" cy="250" r="3" fill={theme.glow} opacity="0.7" />
            </Svg>
          </View>

          {/* Medal Icon Wrapper */}
          <View style={[s.iconBox, { backgroundColor: `${theme.glow}15`, borderColor: theme.border }]}>
            <Ionicons name={(newlyUnlockedBadge.icon || 'medal') as any} size={54} color={theme.glow} />
          </View>

          {/* Rarity Tag */}
          <View style={[s.rarityBadge, { backgroundColor: `${theme.glow}20` }]}>
            <Text style={[s.rarityText, { color: theme.glow }]}>{theme.name.toUpperCase()}</Text>
          </View>

          {/* Congratulatory Text */}
          <Text style={s.unlockedTitle}>Badge Unlocked! 🎉</Text>
          <Text style={s.title}>{newlyUnlockedBadge.title}</Text>
          <Text style={s.subtitle}>{newlyUnlockedBadge.sub}</Text>

          {/* XP Gained Reward */}
          <View style={s.xpRewardBox}>
            <Ionicons name="sparkles" size={14} color="#FFD700" />
            <Text style={s.xpRewardText}>+{newlyUnlockedBadge.xp} Score XP Awarded</Text>
          </View>

          {/* Actions */}
          <Pressable style={s.claimBtn} onPress={handleClose}>
            <Text style={s.claimTxt}>Awesome! 🚀</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: Math.min(W - 48, 340),
    borderRadius: 32,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 28, 0.45)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    top: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    zIndex: -1,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 14,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  unlockedTitle: {
    fontSize: 14,
    color: '#87C4FF',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    color: C.white,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  xpRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,215,0,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    marginBottom: 24,
  },
  xpRewardText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  claimBtn: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  claimTxt: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
