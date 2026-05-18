import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/useAppTheme';
import { SoundDefinition } from '../../src/store/ambientSoundStore';
import EqualizerAnimation from './EqualizerAnimation';

interface AmbientCardProps {
  sound: SoundDefinition;
  isActive: boolean;
  isPlaying: boolean;
  onPress: () => void;
}

export default function AmbientCard({ sound, isActive, isPlaying, onPress }: AmbientCardProps) {
  const { P, getBlurIntensity } = useAppTheme();

  // Pulse animation scale for active play state
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1.0);
    }
  }, [isPlaying]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Border glow intensity based on playing state
  const borderGlowColor = isActive
    ? (isPlaying ? '#87C4FF' : '#87C4FF60')
    : 'transparent';

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[s.card, cardStyle, isActive && s.cardActive, { borderColor: borderGlowColor }]}>
        <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Subtle active state linear gradient background overlay */}
        {isActive && (
          <LinearGradient
            colors={['rgba(135,196,255,0.08)', 'rgba(43,107,255,0.03)']}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={s.cardBody}>
          {/* Left side: Icon Frame */}
          <View style={[
            s.iconFrame,
            {
              backgroundColor: isActive ? 'rgba(135,196,255,0.12)' : 'rgba(255,255,255,0.03)',
              borderColor: isActive ? 'rgba(135,196,255,0.25)' : 'rgba(255,255,255,0.06)'
            }
          ]}>
            <Ionicons
              name={sound.icon as any}
              size={24}
              color={isActive ? '#87C4FF' : 'rgba(255,255,255,0.4)'}
            />
          </View>

          {/* Center content: Text description & Title */}
          <View style={s.infoColumn}>
            <Text style={[s.title, { color: P.white }, isActive && { color: '#87C4FF' }]}>
              {sound.title}
            </Text>
            <Text style={[s.desc, { color: P.dimmer }]}>
              {sound.description}
            </Text>
          </View>

          {/* Right side: Equalizer / Play button */}
          <View style={s.actionBox}>
            {isPlaying ? (
              <View style={s.equalizerWrap}>
                <EqualizerAnimation isPlaying={isPlaying} />
              </View>
            ) : null}

            <View
              style={[
                s.playBtn,
                {
                  backgroundColor: isActive && isPlaying ? 'rgba(255,255,255,0.1)' : 'rgba(135,196,255,0.15)',
                  borderColor: isActive && isPlaying ? 'rgba(255,255,255,0.15)' : 'rgba(135,196,255,0.3)'
                }
              ]}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={16}
                color={isActive && isPlaying ? P.white : '#87C4FF'}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,18,34,0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardActive: {
    shadowColor: '#87C4FF',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    backgroundColor: 'rgba(10,18,34,0.5)',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  iconFrame: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  equalizerWrap: {
    marginRight: -4,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  }
});
