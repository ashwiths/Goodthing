/**
 * app/(tabs)/settings.tsx  ·  To|Do — Premium Control Center
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { CinematicBackground } from '../../components/CinematicBackground';

import { useSettingsStore } from '../../store/settingsStore';
import { useAppTheme, ACCENT_COLORS } from '../../hooks/useAppTheme';
import { fireHaptic } from '../../utils/haptics';

const { width: W } = Dimensions.get('window');
const MAX_W = 600;
const ACTUAL_W = Math.min(W, MAX_W);

// ─── Custom Glass Switch ──────────────────────────────────────────────────────
function GlassSwitch({ value, onValueChange, activeColor }: { value: boolean, onValueChange: (v: boolean) => void, activeColor?: string }) {
  const { P } = useAppTheme();
  const actCol = activeColor || P.blue;
  return (
    <Pressable onPress={() => { fireHaptic('light'); onValueChange(!value); }} style={[sw.track, { borderColor: P.borderSub }, value && { backgroundColor: actCol + '40', borderColor: actCol }]}>
      <BlurView intensity={value ? 40 : 20} tint="dark" style={StyleSheet.absoluteFill} />
      <Animated.View style={[sw.thumb, value ? { transform: [{ translateX: 20 }], backgroundColor: P.white, shadowColor: actCol } : { backgroundColor: P.dim }]} />
    </Pressable>
  );
}

const sw = StyleSheet.create({
  track: { width: 48, height: 28, borderRadius: 14, padding: 2, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
  thumb: { width: 22, height: 22, borderRadius: 11, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
});

// ─── Setting Row Component ────────────────────────────────────────────────────
function SettingRow({ icon, title, type = 'toggle', color, isLast = false, state, setState, options }: any) {
  const { P } = useAppTheme();
  const actCol = color || P.blue;

  return (
    <View style={[sr.wrap, !isLast && { borderBottomWidth: 1, borderBottomColor: P.borderSub }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: type === 'segment' ? 12 : 0 }}>
        <View style={[sr.iconBox, { backgroundColor: actCol + '20' }]}>
          <Ionicons name={icon} size={16} color={actCol} />
        </View>
        <Text style={[sr.title, { color: P.white }]}>{title}</Text>
        {type === 'toggle' && (
          <GlassSwitch value={state} onValueChange={setState} activeColor={actCol} />
        )}
      </View>
      {type === 'segment' && (
        <View style={sr.segmentWrap}>
          {options.map((opt: any) => (
            <Pressable key={opt.value} onPress={() => { fireHaptic('light'); setState(opt.value); }} style={[sr.segmentBtn, state === opt.value && { backgroundColor: actCol + '40' }]}>
              <Text style={[sr.segmentTxt, state === opt.value ? { color: P.white, fontWeight: '700' } : { color: P.dim }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const sr = StyleSheet.create({
  wrap: { paddingVertical: 14, paddingHorizontal: 18, justifyContent: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  title: { flex: 1, fontSize: 15, fontWeight: '500' },
  segmentWrap: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginTop: 4 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentTxt: { fontSize: 13, fontWeight: '500' },
});

// ─── Hero Pulse Avatar ────────────────────────────────────────────────────────
function HeroAvatar() {
  const { P } = useAppTheme();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
    ), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value }));

  return (
    <View style={av.wrap}>
      <Animated.View style={[av.glow1, { backgroundColor: P.blue }, animStyle]} />
      <Animated.View style={[av.glow2, { backgroundColor: P.purple }, animStyle]} />
      <View style={[av.core, { borderColor: P.white }]}>
        <LinearGradient colors={[P.blue, P.purple]} style={StyleSheet.absoluteFill} />
        <Text style={[av.txt, { color: P.white }]}>A</Text>
      </View>
      <View style={[av.badge, { backgroundColor: P.medium, borderColor: P.bg }]}>
        <Ionicons name="flash" size={12} color={P.bg} />
      </View>
    </View>
  );
}

const av = StyleSheet.create({
  wrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  core: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, zIndex: 2 },
  txt: { fontSize: 36, fontWeight: '800' },
  glow1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.4 },
  glow2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, opacity: 0.2 },
  badge: { position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 3, borderWidth: 2 },
});

// ─── Animated Wave ────────────────────────────────────────────────────────────
function FocusWave() {
  const { P } = useAppTheme();
  return (
    <View style={{ height: 60, marginVertical: 10 }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
        <Path d="M 0,20 Q 12.5,0 25,20 T 50,20 T 75,20 T 100,20" fill="none" stroke={P.purple} strokeWidth="2" opacity="0.4" />
        <Path d="M 0,20 Q 15,30 30,20 T 60,20 T 90,20 T 100,20" fill="none" stroke={P.blue} strokeWidth="3" opacity="0.8" />
        <Path d="M 0,20 Q 20,5 40,20 T 80,20 T 100,20" fill="none" stroke={P.white} strokeWidth="1.5" opacity="0.5" />
      </Svg>
    </View>
  );
}

// ─── Storage Indicator ────────────────────────────────────────────────────────
function StorageRing({ percent, color }: { percent: number, color: string }) {
  const size = 60;
  const strokeW = 6;
  const radius = (size - strokeW) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * percent) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} fill="none" />
        <Circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke={color} strokeWidth={strokeW} 
          strokeDasharray={circ} strokeDashoffset={offset} 
          strokeLinecap="round" fill="none" 
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject} style={[{ alignItems: 'center', justifyContent: 'center' }, StyleSheet.absoluteFill]}>
        <Ionicons name="cloud-done" size={16} color={color} />
      </View>
    </View>
  );
}

// ─── Main Settings Screen ─────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity } = useAppTheme();
  
  const { 
    theme, setTheme, accentColor, setAccentColor, glowIntensity, setGlowIntensity,
    smartAlerts, setSmartAlerts, soundEffects, setSoundEffects, focusReminders, setFocusReminders,
    hapticsLevel, setHapticsLevel, blurQuality, setBlurQuality, minimalMode, setMinimalMode,
    deepWorkZone, setDeepWorkZone
  } = useSettingsStore();

  return (
    <View style={[s.root, { backgroundColor: P.bg }]}>
      <CinematicBackground particleCount={40} showScanLine={true} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: 140, maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Profile ── */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={s.hero}>
          <HeroAvatar />
          <Text style={[s.heroName, { color: P.white }]}>Ashil</Text>
          <View style={[s.heroStatusBadge, { backgroundColor: P.blue + '1A', borderColor: P.border }]}>
            <View style={[s.heroStatusDot, { backgroundColor: P.blue, shadowColor: P.blue }]} />
            <Text style={[s.heroStatusTxt, { color: P.blue }]}>Focused Mode Active</Text>
          </View>
        </Animated.View>

        {/* ── Focus Environment Showcase ── */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={s.module}>
          <Text style={[s.modTitle, { color: P.dim }]}>Focus Environment</Text>
          <View style={[s.card, { borderColor: P.purple + '40', backgroundColor: 'rgba(255,255,255,0.02)' }]}>
            <BlurView intensity={getBlurIntensity(70)} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient colors={[P.purple + '20', 'transparent']} style={StyleSheet.absoluteFill} />
            
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={[s.focusTitle, { color: P.white }]}>Deep Work Zone</Text>
                  <Text style={[s.focusSub, { color: P.dimmer }]}>Ambient sound • Distraction free</Text>
                </View>
                <GlassSwitch value={deepWorkZone} onValueChange={setDeepWorkZone} activeColor={P.purple} />
              </View>
              <FocusWave />
              <View style={s.focusControls}>
                <Ionicons name="volume-medium" size={18} color={P.dim} />
                <View style={s.focusBar}><View style={[s.focusBarFill, { width: '60%', backgroundColor: P.purple }]} /></View>
                <Ionicons name="headset" size={18} color={P.white} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Productivity DNA ── */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={s.module}>
          <Text style={[s.modTitle, { color: P.dim }]}>Productivity DNA</Text>
          <View style={[s.card, { flexDirection: 'row', padding: 20, borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.02)' }]}>
            <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={{ flex: 1, gap: 12 }}>
              <View>
                <Text style={[s.dnaLbl, { color: P.dim }]}>Peak Energy</Text>
                <Text style={[s.dnaVal, { color: P.white }]}>10:00 AM - 1:00 PM</Text>
              </View>
              <View>
                <Text style={[s.dnaLbl, { color: P.dim }]}>Flow State</Text>
                <Text style={[s.dnaVal, { color: P.white }]}>High Consistency</Text>
              </View>
            </View>
            <View style={s.dnaRingWrap}>
              <Ionicons name="finger-print" size={32} color={P.blue} style={{ position: 'absolute', opacity: 0.3 }} />
              <StorageRing percent={88} color={P.blue} />
              <Text style={[s.dnaScore, { color: P.white }]}>88</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Accent Colors Inline Picker ── */}
        <Animated.View entering={FadeInUp.delay(350).springify()} style={s.module}>
          <Text style={[s.modTitle, { color: P.dim }]}>Accent Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingLeft: 4, paddingVertical: 4 }}>
            {ACCENT_COLORS.map(c => (
              <Pressable 
                key={c.hex} 
                onPress={() => { fireHaptic('medium'); setAccentColor(c.hex); }}
                style={[s.colorCircle, { backgroundColor: c.hex }, accentColor === c.hex && { borderWidth: 3, borderColor: P.white, transform: [{ scale: 1.1 }] }]}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Modules Grid ── */}
        
        {/* Appearance */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={s.module}>
          <Text style={[s.modTitle, { color: P.dim }]}>Appearance</Text>
          <View style={[s.card, { borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.02)' }]}>
            <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
            <SettingRow 
              icon="moon" title="Cinematic Dark Mode" color={P.purple} 
              type="toggle" state={theme === 'cinematic'} 
              setState={(val: boolean) => setTheme(val ? 'cinematic' : 'minimalDark')} 
            />
            <SettingRow 
              icon="sunny" title="UI Glow Intensity" color={P.medium} isLast 
              type="segment" state={glowIntensity} setState={setGlowIntensity}
              options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'Ultra', value: 'ultra' }]}
            />
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={s.module}>
          <Text style={[s.modTitle, { color: P.dim }]}>Notifications</Text>
          <View style={[s.card, { borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.02)' }]}>
            <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
            <SettingRow icon="notifications" title="Smart Alerts" state={smartAlerts} setState={setSmartAlerts} color={P.blue} />
            <SettingRow icon="musical-notes" title="Sound Effects" state={soundEffects} setState={setSoundEffects} color={P.low} />
            <SettingRow icon="time" title="Focus Reminders" state={focusReminders} setState={setFocusReminders} color={P.medium} isLast />
          </View>
        </Animated.View>

        {/* App Experience */}
        <Animated.View entering={FadeInUp.delay(600).springify()} style={s.module}>
          <Text style={[s.modTitle, { color: P.dim }]}>App Experience</Text>
          <View style={[s.card, { borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.02)' }]}>
            <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
            <SettingRow 
              icon="hardware-chip" title="Haptics Engine" color={P.purple} 
              type="segment" state={hapticsLevel} setState={setHapticsLevel}
              options={[{ label: 'Off', value: 'off' }, { label: 'Soft', value: 'soft' }, { label: 'Med', value: 'medium' }, { label: 'Strong', value: 'strong' }]}
            />
            <SettingRow 
              icon="layers" title="Glassmorphism Blur" color={P.blue} 
              type="segment" state={blurQuality} setState={setBlurQuality}
              options={[{ label: 'Minimal', value: 'minimal' }, { label: 'Balanced', value: 'balanced' }, { label: 'Ultra', value: 'ultra' }]}
            />
            <SettingRow icon="leaf" title="Minimal Mode" state={minimalMode} setState={setMinimalMode} color={P.low} isLast />
          </View>
        </Animated.View>

        {/* Storage & Sync */}
        <Animated.View entering={FadeInUp.delay(700).springify()} style={s.module}>
          <Text style={[s.modTitle, { color: P.dim }]}>Storage & Cloud</Text>
          <View style={[s.card, { padding: 20, borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.02)' }]}>
            <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <StorageRing percent={64} color={P.medium} />
                <View>
                  <Text style={[s.storageTitle, { color: P.white }]}>Cloud Backup Sync</Text>
                  <Text style={[s.storageSub, { color: P.dim }]}>Last synced 2m ago</Text>
                </View>
              </View>
              <Pressable style={s.syncBtn} onPress={() => fireHaptic('medium')}>
                <Ionicons name="sync" size={16} color={P.white} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ── Motivational Quote ── */}
        <Animated.View entering={FadeInUp.delay(800).springify()} style={[s.quoteCard, { borderColor: P.medium + '33', backgroundColor: P.medium + '0A' }]}>
          <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="sparkles" size={18} color={P.medium} style={{ marginBottom: 10 }} />
          <Text style={[s.quoteTxt, { color: P.white }]}>"Small progress is still progress."</Text>
          <Text style={[s.quoteSub, { color: P.medium }]}>Stay consistent today.</Text>
        </Animated.View>

        {/* ── Logout Button ── */}
        <Animated.View entering={FadeInUp.delay(900).springify()}>
          <Pressable style={[s.logoutBtn, { borderColor: P.red + '4D', backgroundColor: P.red + '0D' }]} onPress={() => fireHaptic('heavy')}>
            <BlurView intensity={getBlurIntensity(20)} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="log-out-outline" size={18} color={P.red} />
            <Text style={[s.logoutTxt, { color: P.red }]}>Disconnect Profile</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 22 },

  // Hero
  hero: { alignItems: 'center', marginBottom: 40 },
  heroName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  heroStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  heroStatusDot: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 1, shadowRadius: 6 },
  heroStatusTxt: { fontSize: 13, fontWeight: '600' },

  // Accent Colors
  colorCircle: { width: 36, height: 36, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },

  // Modules
  module: { marginBottom: 28 },
  modTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingLeft: 6 },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },

  // Focus Environment
  focusTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  focusSub: { fontSize: 13 },
  focusControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  focusBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  focusBarFill: { height: '100%' },

  // DNA
  dnaLbl: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  dnaVal: { fontSize: 16, fontWeight: '600' },
  dnaRingWrap: { alignItems: 'center', justifyContent: 'center' },
  dnaScore: { position: 'absolute', fontSize: 16, fontWeight: '800', marginTop: 2 },

  // Storage
  storageTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  storageSub: { fontSize: 13 },
  syncBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  // Quote
  quoteCard: { borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 40, overflow: 'hidden' },
  quoteTxt: { fontSize: 18, fontStyle: 'italic', fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  quoteSub: { fontSize: 13, fontWeight: '600' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  logoutTxt: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
