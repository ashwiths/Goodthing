import React, { useRef, useState } from 'react';
import {
  StyleSheet, View, Text, Dimensions, FlatList, Pressable,
} from 'react-native';
import Animated, {
  FadeInUp, FadeInDown, useSharedValue,
  useAnimatedScrollHandler, useAnimatedStyle,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useTheme } from '../../src/hooks/useTheme';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { DARK, TEXT } from '../../src/constants/colors';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    icon:     '🌌',
    title:    'Your Productivity\nUniverse.',
    subtitle: 'Build habits, master focus, and track your growth — all in one dark, beautiful space.',
    color:    '#00F5FF',
  },
  {
    icon:     '⚡',
    title:    'Forge Your\nDaily Habits.',
    subtitle: 'Build streaks, earn XP, and level up your life with science-backed habit loops.',
    color:    '#8B5CF6',
  },
  {
    icon:     '🎯',
    title:    'Deep Focus.\nZero Distractions.',
    subtitle: 'Pomodoro timer with ambient soundscapes and neon focus mode to enter the flow state.',
    color:    '#F72585',
  },
  {
    icon:     '🧘',
    title:    'Track Your\nMind & Mood.',
    subtitle: 'Daily mood logging, journal entries, and smart analytics to understand yourself.',
    color:    '#39FF14',
  },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<typeof SLIDES[0]>);

export default function OnboardingScreen() {
  const { primary, secondary } = useTheme();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface, DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      {/* Skip button */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.skipRow}>
        <Pressable onPress={handleSkip} style={styles.skipBtn} accessibilityLabel="Skip onboarding">
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      {/* Slides */}
      <AnimatedFlatList
        ref={flatRef as any}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / W));
        }}
        renderItem={({ item, index }) => {
          return (
            <View style={[styles.slide, { width: W }]}>
              <Animated.Text entering={FadeInUp.delay(100)} style={styles.slideIcon}>{item.icon}</Animated.Text>
              <Animated.Text entering={FadeInUp.delay(200)} style={[styles.slideTitle, { color: item.color }]}>
                {item.title}
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(300)} style={styles.slideSubtitle}>
                {item.subtitle}
              </Animated.Text>
            </View>
          );
        }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => {
          const dotStyle = useAnimatedStyle(() => ({
            width: interpolate(
              scrollX.value,
              [(i - 1) * W, i * W, (i + 1) * W],
              [6, 22, 6],
              Extrapolation.CLAMP
            ),
            backgroundColor: i === activeIndex ? SLIDES[i].color : 'rgba(255,255,255,0.2)',
          }));
          return <Animated.View key={i} style={[styles.dot, dotStyle]} />;
        })}
      </View>

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(400)} style={styles.cta}>
        <NeonButton
          label={activeIndex === SLIDES.length - 1 ? "⚡  BEGIN YOUR JOURNEY" : "Next  →"}
          onPress={handleNext}
          size="lg"
          fullWidth
        />
        <Text style={styles.tagline}>ZenForge · Your Productivity Universe.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  skipRow:   { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 60, paddingRight: 24 },
  skipBtn:   { padding: 8 },
  skipText:  { color: TEXT.muted, fontSize: 15, fontWeight: '500' },
  slide: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 40,
  },
  slideIcon:     { fontSize: 80, marginBottom: 24 },
  slideTitle:    { fontSize: 36, fontWeight: '900', textAlign: 'center', lineHeight: 42, marginBottom: 16 },
  slideSubtitle: { color: TEXT.secondary, fontSize: 17, textAlign: 'center', lineHeight: 26 },
  dots:   { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingBottom: 24 },
  dot:    { height: 6, borderRadius: 3 },
  cta:    { paddingHorizontal: 24, paddingBottom: 48, gap: 16, alignItems: 'center' },
  tagline:{ color: TEXT.muted, fontSize: 12, letterSpacing: 1 },
});
