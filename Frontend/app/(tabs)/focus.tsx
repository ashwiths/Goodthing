import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { CinematicBackground } from '../../components/CinematicBackground';

import { useAppTheme } from '../../hooks/useAppTheme';
import { fireHaptic } from '../../utils/haptics';
import { useFocusStore } from '../../src/store/focusStore';
import { C } from '../../constants/colors';

const { width: W } = Dimensions.get('window');
const MAX_W = 600;
const ACTUAL_W = Math.min(W, MAX_W);

// Helper to format seconds to MM:SS
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── STUNNING WAVE VISUALIZER (PURE GPU ANIMATED VIEWS) ───
function WaveformVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const barCount = 10;
  const scales = Array.from({ length: barCount }).map(() => useSharedValue(6));

  useEffect(() => {
    if (isPlaying) {
      scales.forEach((s, i) => {
        // Staggered oscillation heights
        const targetMax = 20 + Math.random() * 26;
        s.value = withRepeat(
          withSequence(
            withTiming(targetMax, { duration: 400 + i * 80, easing: Easing.inOut(Easing.ease) }),
            withTiming(6, { duration: 400 + i * 80, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      });
    } else {
      scales.forEach((s) => {
        s.value = withSpring(6);
      });
    }
  }, [isPlaying]);

  return (
    <View style={sStatic.waveformContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, gap: 8 }}>
        {scales.map((s, i) => {
          const barStyle = useAnimatedStyle(() => ({
            height: s.value,
          }));

          return (
            <Animated.View
              key={i}
              style={[
                {
                  width: 6,
                  borderRadius: 3,
                  backgroundColor: '#87C4FF',
                  opacity: isPlaying ? 0.85 : 0.3,
                },
                barStyle,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity } = useAppTheme();

  const {
    duration,
    timeRemaining,
    isActive,
    isPaused,
    timerMode,
    musicType,
    isPlaying,
    volume,
    stats,
    offlineSessions,
    syncing,
    recommendedDuration,
    setTimerMode,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    tick,
    setMusic,
    setVolume,
    syncOfflineSessions,
    loadOfflineCache,
    fetchFocusStats,
    cleanupAudio
  } = useFocusStore();

  const [soundPackPanelOpen, setSoundPackPanelOpen] = useState(false);

  // Breathing rings animation values
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.2);

  // Set up timer ticks and fetch initially
  useEffect(() => {
    fetchFocusStats();
    loadOfflineCache();

    // 1-second interval loop for Pomodoro tick
    const interval = setInterval(() => {
      if (isActive && !isPaused) {
        tick();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      cleanupAudio();
    };
  }, [isActive, isPaused]);

  // Breathing circle rings loop when active
  useEffect(() => {
    if (isActive && !isPaused) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.16, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      ringScale.value = withSpring(1.0);
      ringOpacity.value = withSpring(0.2);
    }
  }, [isActive, isPaused]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value
  }));

  const handleStartStop = () => {
    if (isActive) {
      // Prompt exit confirmation
      AlertExitFocus();
    } else {
      startSession();
    }
  };

  const AlertExitFocus = () => {
    fireHaptic('medium');
    completeSession(false);
  };

  // ─── STYLESHEET ───
  const s = React.useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: P.bg },
    scroll: { paddingHorizontal: 22 },
    
    // Header
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
    pageTitle: { fontSize: 30, fontWeight: '800', color: P.white, letterSpacing: -0.5 },
    pageSub:   { fontSize: 13, color: P.dimmer, fontWeight: '500', marginTop: 3 },
    syncAlertBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,123,0,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,123,0,0.25)' },
    syncAlertTxt: { fontSize: 11, color: '#FF7B00', fontWeight: '700' },

    // Ambient Breathing Ring Circle
    ringContainer: { height: 260, alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
    outerRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(135,196,255,0.2)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
    glowRing: { position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: '#87C4FF', shadowColor: '#87C4FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 30 },
    timerText: { fontSize: 44, fontWeight: '900', color: P.white, letterSpacing: -1 },
    timerModeTag: { fontSize: 10, fontWeight: '800', color: P.dim, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },

    // Primary Interactive Control Button
    controlBtn: { width: ACTUAL_W - 44, height: 56, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
    controlBtnActive: { borderColor: 'rgba(255,0,80,0.25)' },
    controlBtnTxt: { fontSize: 16, fontWeight: '800', color: P.white, letterSpacing: 0.5 },

    // Pause Resume Skip Row
    controlRow: { flexDirection: 'row', gap: 12, width: ACTUAL_W - 44, marginBottom: 20 },
    subBtn: { flex: 1, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.03)' },
    subBtnTxt: { fontSize: 14, fontWeight: '700', color: P.white },

    // Pomodoro Mode Selectors
    modeCard: { borderRadius: 24, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.45)', overflow: 'hidden' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: P.white, marginBottom: 14 },
    modeRow: { flexDirection: 'row', gap: 8 },
    modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' },
    modeBtnActive: { backgroundColor: 'rgba(135,196,255,0.15)', borderColor: '#87C4FF' },
    modeBtnTxt: { fontSize: 12.5, color: P.dim, fontWeight: '600' },
    modeBtnTxtActive: { color: '#87C4FF', fontWeight: '700' },

    // Music Pack cards
    musicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    musicCard: { width: (ACTUAL_W - 44 - 10) / 2, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)', flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
    musicCardActive: { borderColor: '#87C4FF', backgroundColor: 'rgba(135,196,255,0.08)' },
    musicIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
    musicName: { fontSize: 13, fontWeight: '700', color: P.white },
    musicNameActive: { color: '#87C4FF' },

    // AI suggestion card
    aiCard: { flexDirection: 'row', padding: 14, borderRadius: 18, backgroundColor: 'rgba(138,43,226,0.06)', borderWidth: 1, borderColor: 'rgba(138,43,226,0.22)', marginBottom: 20 },
    aiInfo: { flex: 1, marginLeft: 12 },
    aiTitle: { fontSize: 12.5, fontWeight: '700', color: P.white, marginBottom: 2 },
    aiTxt: { fontSize: 11.5, color: P.dim, lineHeight: 16 },

    // Volume Slider Box
    volumeBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)', marginBottom: 24 }
  }), [P]);

  return (
    <View style={s.root}>
      <CinematicBackground particleCount={15} showScanLine={false} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: 110, maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.pageTitle}>Deep Focus</Text>
              <Text style={s.pageSub}>Create your deep work sanctuary.</Text>
            </View>
            
            {/* Sync Alert for Cached Offline Sessions */}
            {offlineSessions.length > 0 && (
              <Pressable
                style={s.syncAlertBtn}
                onPress={() => {
                  fireHaptic('light');
                  syncOfflineSessions();
                }}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#FF7B00" />
                ) : (
                  <>
                    <Ionicons name="cloud-offline" size={14} color="#FF7B00" />
                    <Text style={s.syncAlertTxt}>Sync ({offlineSessions.length})</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── Sound Waveform Visualizer ── */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <WaveformVisualizer isPlaying={isPlaying} />
        </Animated.View>

        {/* ── Ambient Breathing Rings ── */}
        <View style={s.ringContainer}>
          <Animated.View style={[s.glowRing, animatedRingStyle]} pointerEvents="none" />
          <View style={s.outerRing}>
            <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={s.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={s.timerModeTag}>
              {isActive ? `${musicType} session` : `${timerMode} min focus`}
            </Text>
          </View>
        </View>

        {/* ── Interactive AI Suggestion Box ── */}
        {!isActive && (
          <Animated.View entering={FadeInDown.delay(200)} style={s.aiCard}>
            <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="sparkles" size={18} color="#8a2be2" style={{ marginTop: 2 }} />
            <View style={s.aiInfo}>
              <Text style={s.aiTitle}>AI Focus Suggestion</Text>
              <Text style={s.aiTxt}>
                Completing a {Math.round(recommendedDuration / 60)}-minute session today maintains your consistency multipliers. Tap target below! ⚡
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Primary Action Control Button ── */}
        <Animated.View entering={FadeInDown.delay(220)}>
          <Pressable
            style={[s.controlBtn, isActive && s.controlBtnActive]}
            onPress={handleStartStop}
          >
            <BlurView intensity={getBlurIntensity(40)} tint="dark" style={StyleSheet.absoluteFill} />
            {isActive ? (
              <LinearGradient colors={['rgba(255,0,80,0.18)', 'rgba(255,0,80,0.08)']} style={StyleSheet.absoluteFill} />
            ) : (
              <LinearGradient colors={['rgba(135,196,255,0.22)', 'rgba(43,107,255,0.12)']} style={StyleSheet.absoluteFill} />
            )}
            <Text style={s.controlBtnTxt}>
              {isActive ? 'EXIT DEEP FOCUS 🛑' : 'ENTER FOCUS SANCTUARY 🧘‍♂️'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Active Session Sub Controls ── */}
        {isActive && (
          <Animated.View entering={FadeInDown} style={s.controlRow}>
            {isPaused ? (
              <Pressable style={s.subBtn} onPress={resumeSession}>
                <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={s.subBtnTxt}>Resume ▶️</Text>
              </Pressable>
            ) : (
              <Pressable style={s.subBtn} onPress={pauseSession}>
                <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={s.subBtnTxt}>Pause ⏸️</Text>
              </Pressable>
            )}
            <Pressable
              style={s.subBtn}
              onPress={() => {
                fireHaptic('heavy');
                completeSession(true); // force early success completion trigger
              }}
            >
              <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={[s.subBtnTxt, { color: '#4CAF50' }]}>Complete Goal 🏆</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Pomodoro Duration Selectors ── */}
        {!isActive && (
          <Animated.View entering={FadeInDown.delay(240)} style={s.modeCard}>
            <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
            <Text style={s.cardTitle}>Set Focus Duration Target</Text>
            <View style={s.modeRow}>
              {['25', '50', '90'].map((mode) => (
                <Pressable
                  key={mode}
                  style={[s.modeBtn, timerMode === mode && s.modeBtnActive]}
                  onPress={() => setTimerMode(mode)}
                >
                  <Text style={[s.modeBtnTxt, timerMode === mode && s.modeBtnTxtActive]}>
                    {mode} Mins
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Ambient Track Selector Cards ── */}
        <Animated.View entering={FadeInDown.delay(260)} style={s.modeCard}>
          <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={s.cardTitle}>Select Ambient Soundscapes</Text>
          <View style={s.musicGrid}>
            {[
              { id: 'lofi',        label: 'Lofi Ambient',  icon: 'musical-notes' },
              { id: 'rain',        label: 'Deep Rain',     icon: 'rainy'         },
              { id: 'forest',      label: 'Forest Birds',  icon: 'leaf'          },
              { id: 'brown-noise', label: 'Brown Noise',   icon: 'radio'         },
              { id: 'ocean',       label: 'Ocean Waves',   icon: 'water'         },
              { id: 'piano',       label: 'Soft Piano',    icon: 'apps'          },
              { id: 'deep-space',  label: 'Deep Space',    icon: 'planet'        }
            ].map((pack) => {
              const active = musicType === pack.id;
              return (
                <Pressable
                  key={pack.id}
                  style={[s.musicCard, active && s.musicCardActive]}
                  onPress={() => setMusic(pack.id)}
                >
                  <View style={s.musicIconBox}>
                    <Ionicons name={pack.icon as any} size={15} color={active ? '#87C4FF' : 'rgba(255,255,255,0.4)'} />
                  </View>
                  <Text style={[s.musicName, active && s.musicNameActive]} numberOfLines={1}>
                    {pack.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Segmented Volume Presets Selector ── */}
        {isActive && (
          <Animated.View entering={FadeInDown} style={s.volumeBox}>
            <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name={volume === 0 ? "volume-mute" : "volume-medium"} size={16} color="#87C4FF" />
            <Text style={{ fontSize: 13, color: P.white, fontWeight: '700', marginRight: 4 }}>Volume:</Text>
            <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
              {[
                { val: 0.0, label: 'Mute' },
                { val: 0.25, label: '25%' },
                { val: 0.6, label: '60%' },
                { val: 1.0, label: 'Max' }
              ].map((volPreset) => {
                const isSelected = Math.abs(volume - volPreset.val) < 0.05;
                return (
                  <Pressable
                    key={volPreset.val}
                    style={[{
                      flex: 1,
                      paddingVertical: 6,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isSelected ? '#87C4FF' : 'rgba(255,255,255,0.05)',
                      backgroundColor: isSelected ? 'rgba(135,196,255,0.12)' : 'rgba(255,255,255,0.02)'
                    }]}
                    onPress={() => {
                      fireHaptic('light');
                      setVolume(volPreset.val);
                    }}
                  >
                    <Text style={{
                      fontSize: 11,
                      color: isSelected ? '#87C4FF' : P.dim,
                      fontWeight: isSelected ? '700' : '500'
                    }}>
                      {volPreset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const sStatic = StyleSheet.create({
  waveformContainer: { alignItems: 'center', justifyContent: 'center', height: 60, marginTop: 10 },
});
