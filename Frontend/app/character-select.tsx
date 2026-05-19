/**
 * app/character-select.tsx
 *
 * Matches the reference design exactly:
 *  – Dark navy background
 *  – "Choose your character" title
 *  – Full-body illustrated character cards (swipeable)
 *  – Character name below the image
 *  – Dot page indicators
 *  – ☰ hamburger + Skip button in the header
 *
 * After choosing → 3-page onboarding swipe (placeholder text, edit freely)
 */
import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  FlatList,
  ListRenderItemInfo,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C } from '../constants/colors';
import { CinematicBackground } from '../components/CinematicBackground';
import { useSettingsStore } from '../store/settingsStore';

const { width: W, height: H } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER DATA — add / replace image paths or require() as needed
// ─────────────────────────────────────────────────────────────────────────────
type Character = {
  id: string;
  name: string;
  tagline: string;
  gender: 'male' | 'female';
  image: ImageSourcePropType;
  accent: string;
  gradient: [string, string];
  bgGlow: string;
};

const CHARACTERS: Character[] = [
  {
    id: 'brew-bro',
    name: 'Brew Bro',
    tagline: 'The Caffeine Crusader',
    gender: 'male',
    image: require('../assets/images/char_male.png'),
    accent: '#F5A623',
    gradient: ['#3D2000', '#110D00'],
    bgGlow: 'rgba(245,166,35,0.15)',
  },
  {
    id: 'spark-girl',
    name: 'Spark Girl',
    tagline: 'The Creative Igniter',
    gender: 'female',
    image: require('../assets/images/char_female.png'),
    accent: '#FF6B9D',
    gradient: ['#3D0020', '#150010'],
    bgGlow: 'rgba(255,107,157,0.15)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING PAGES — EDIT TEXT HERE!
// ─────────────────────────────────────────────────────────────────────────────
const ONBOARDING = [
  {
    id: 'ob1',
    emoji: '🚀',
    title: 'Your Title Goes Here',
    body: 'This is slide one placeholder text. Edit the ONBOARDING array in character-select.tsx to add your own content.',
  },
  {
    id: 'ob2',
    emoji: '✨',
    title: 'Your Title Goes Here',
    body: 'This is slide two placeholder text. Describe a key feature or benefit of your app here.',
  },
  {
    id: 'ob3',
    emoji: '🎯',
    title: 'Your Title Goes Here',
    body: 'Last slide! Get your user excited. Tap Get Started to begin the journey.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GENDER FILTER TABS
// ─────────────────────────────────────────────────────────────────────────────
type GenderFilter = 'male' | 'female';

function GenderTabs({
  active,
  onSelect,
  accent,
}: {
  active: GenderFilter;
  onSelect: (g: GenderFilter) => void;
  accent: string;
}) {
  const tabs: { key: GenderFilter; label: string }[] = [
    { key: 'male', label: '♂ Male' },
    { key: 'female', label: '♀ Female' },
  ];

  return (
    <View style={gTabStyles.row}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onSelect(t.key)}
            style={[
              gTabStyles.tab,
              isActive && { borderColor: accent, backgroundColor: accent + '22' },
            ]}
          >
            <Text style={[gTabStyles.label, isActive && { color: accent }]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const gTabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.glass08,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text45,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CHARACTER CARD (reference image style)
// ─────────────────────────────────────────────────────────────────────────────
function CharacterCard({
  character,
  index,
  scrollX,
  listWidth,
  onSelect,
}: {
  character: Character;
  index: number;
  scrollX: SharedValue<number>;
  listWidth: number;
  onSelect: () => void;
}) {
  const inputRange = [
    (index - 1) * listWidth,
    index * listWidth,
    (index + 1) * listWidth,
  ];

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[styles.cardSlide, { width: listWidth }, cardStyle]}>
      <Pressable onPress={onSelect} style={styles.cardPressable}>
        {/* Full-body character image — rounded to handle opaque backgrounds gracefully */}
        <Animated.View style={[styles.charImageWrap]}>
          <Image
            source={character.image}
            style={styles.charImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Name badge */}
        <View style={styles.nameBadge}>
          <Text style={[styles.charName, { color: '#B8C8FF' }]}>
            {character.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// DOT INDICATORS
// ─────────────────────────────────────────────────────────────────────────────
function Dots({
  count,
  activeIndex,
  accent,
}: {
  count: number;
  activeIndex: number;
  accent: string;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === activeIndex ? 22 : 7,
              backgroundColor: i === activeIndex ? accent : 'rgba(255,255,255,0.25)',
              opacity: i === activeIndex ? 1 : 0.5,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING SLIDE
// ─────────────────────────────────────────────────────────────────────────────
function OnboardSlide({
  page,
  isLast,
  accent,
  onNext,
}: {
  page: typeof ONBOARDING[number];
  isLast: boolean;
  accent: string;
  onNext: () => void;
}) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const s = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }));

  return (
    <View style={styles.obSlide}>
      <Animated.Text style={[styles.obEmoji, pulseStyle]}>
        {page.emoji}
      </Animated.Text>
      <Text style={styles.obTitle}>{page.title}</Text>
      <Text style={styles.obBody}>{page.body}</Text>

      <Pressable
        onPressIn={() => { s.value = withSpring(0.94, { damping: 12 }); }}
        onPressOut={() => { s.value = withSpring(1, { damping: 12 }); }}
        onPress={onNext}
      >
        <Animated.View style={btnStyle}>
          <LinearGradient
            colors={[accent, accent + 'BB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.obBtn}
          >
            <Text style={styles.obBtnText}>
              {isLast ? 'Get Started 🎉' : 'Next →'}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function CharacterSelectScreen() {
  const { showUserManual } = useSettingsStore();
  const [phase, setPhase] = useState<'select' | 'onboard'>('select');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('male');
  const [activeIdx, setActiveIdx] = useState(0);
  const [obPage, setObPage] = useState(0);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  const filtered = CHARACTERS.filter((c) => c.gender === genderFilter);

  const currentChar = filtered[activeIdx] ?? filtered[0];
  const accent = selectedChar?.accent ?? currentChar?.accent ?? C.blue400;

  const scrollX = useSharedValue(0);
  const charListRef = useRef<FlatList>(null);
  const obListRef = useRef<FlatList>(null);

  // Reset index when filter changes
  useEffect(() => {
    setActiveIdx(0);
    scrollX.value = 0;
    charListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [genderFilter]);

  // Phase fade
  const phaseOp = useSharedValue(1);
  const phaseStyle = useAnimatedStyle(() => ({ opacity: phaseOp.value }));

  const transitionToOnboard = useCallback((char: Character) => {
    setSelectedChar(char);
    setPhase('onboard');
    setObPage(0);
    phaseOp.value = withTiming(1, { duration: 350 });
  }, []);

  const goToOnboard = useCallback((char: Character) => {
    if (!showUserManual) {
      router.replace('/(tabs)' as any);
      return;
    }
    phaseOp.value = withTiming(0, { duration: 280 }, (finished) => {
      if (finished) {
        runOnJS(transitionToOnboard)(char);
      }
    });
  }, [transitionToOnboard, showUserManual]);

  const handleObNext = useCallback(() => {
    if (obPage < ONBOARDING.length - 1) {
      const next = obPage + 1;
      setObPage(next);
      obListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [obPage]);

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)' as any);
  }, []);



  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Animated background to match the rest of the app */}
      <CinematicBackground particleCount={28} showScanLine={false} />

      <Animated.View style={[styles.flex1, phaseStyle]}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => phase === 'onboard' ? (setPhase('select'), phaseOp.value = 1) : router.back()}
            style={styles.menuBtn}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        </View>

        {/* ── CHARACTER SELECTION ───────────────────────────────── */}
        {phase === 'select' && (
          <View style={styles.flex1}>
            {/* Title */}
            <View style={styles.titleBlock}>
              <Text style={styles.titleMain}>Choose</Text>
              <Text style={styles.titleSub}>your character</Text>
            </View>

            {/* Gender filter tabs */}
            <GenderTabs
              active={genderFilter}
              onSelect={setGenderFilter}
              accent={currentChar?.accent ?? C.blue400}
            />

            {/* Character carousel */}
            <FlatList
              ref={charListRef}
              data={filtered}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              onScroll={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                scrollX.value = x;
                const idx = Math.round(x / W);
                if (idx >= 0 && idx < filtered.length) setActiveIdx(idx);
              }}
              scrollEventThrottle={16}
              style={styles.flex1}
              renderItem={({ item, index }: ListRenderItemInfo<Character>) => (
                <CharacterCard
                  character={item}
                  index={index}
                  scrollX={scrollX}
                  listWidth={W}
                  onSelect={() => goToOnboard(item)}
                />
              )}
            />

            {/* Dots */}
            <Dots
              count={filtered.length}
              activeIndex={activeIdx}
              accent={currentChar?.accent ?? C.blue400}
            />
            <View style={{ height: 36 }} />
          </View>
        )}

        {/* ── ONBOARDING PHASE ─────────────────────────────────── */}
        {phase === 'onboard' && selectedChar && (
          <View style={styles.flex1}>
            {/* Character badge */}
            <View style={styles.charBadge}>
              <Image
                source={selectedChar.image}
                style={styles.badgeImg}
                resizeMode="contain"
              />
              <View>
                <Text style={[styles.badgeName, { color: selectedChar.accent }]}>
                  {selectedChar.name}
                </Text>
                <Text style={styles.badgeTagline}>{selectedChar.tagline}</Text>
              </View>
            </View>

            {/* Onboarding slides */}
            <FlatList
              ref={obListRef}
              data={ONBOARDING}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              style={styles.flex1}
              renderItem={({ item, index }: ListRenderItemInfo<typeof ONBOARDING[number]>) => (
                <OnboardSlide
                  page={item}
                  isLast={index === ONBOARDING.length - 1}
                  accent={selectedChar.accent}
                  onNext={handleObNext}
                />
              )}
            />

            {/* Dots */}
            <Dots
              count={ONBOARDING.length}
              activeIndex={obPage}
              accent={selectedChar.accent}
            />
            <View style={{ height: 40 }} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.void },
  flex1: { flex: 1 },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 4,
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: C.text70,
  },
  skipBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.glass08,
  },
  skipBtnText: {
    color: C.text70,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Title ──────────────────────────────────────────────────────────────────
  titleBlock: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  titleMain: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
  },
  titleSub: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D0D0D0',
    marginTop: -2,
  },

  // ── Character Card ─────────────────────────────────────────────────────────
  cardSlide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPressable: {
    alignItems: 'center',
  },
  charImageWrap: {
    width: W * 0.70,
    height: H * 0.45,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E2D4A', // matches the generated image bg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charImage: {
    width: '100%',
    height: '100%',
  },
  nameBadge: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  charName: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#B8C8FF',
  },

  // ── Dots ───────────────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },

  // ── Onboarding ─────────────────────────────────────────────────────────────
  charBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: C.glass08,
    borderWidth: 1,
    borderColor: C.border,
  },
  badgeImg: {
    width: 44,
    height: 44,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgeTagline: {
    fontSize: 12,
    color: C.text45,
    fontStyle: 'italic',
  },
  obSlide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 18,
  },
  obEmoji: {
    fontSize: 84,
    marginBottom: 8,
  },
  obTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  obBody: {
    fontSize: 15,
    color: C.text70,
    textAlign: 'center',
    lineHeight: 24,
  },
  obBtn: {
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  obBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
