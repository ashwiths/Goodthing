/**
 * app/(tabs)/analytics.tsx  ·  To|Do — Premium Stats, Streaks & Achievements Hub
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import Svg, { Path, Circle as SvgCircle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { CinematicBackground } from '../../components/CinematicBackground';

import { useAppTheme } from '../../hooks/useAppTheme';
import { fireHaptic } from '../../utils/haptics';
import { useGamificationStore } from '../../src/store/gamificationStore';
import { useFocusStore } from '../../src/store/focusStore';
import { C } from '../../constants/colors';

const { width: W } = Dimensions.get('window');
const MAX_W = 600;
const ACTUAL_W = Math.min(W, MAX_W);

type TabType = 'analytics' | 'streaks' | 'badges';

const RARITY_COLORS = {
  common:    { glow: '#A0A0A0', bg: 'rgba(200,200,200,0.1)' },
  rare:      { glow: '#4CAF50', bg: 'rgba(76,175,80,0.1)' },
  epic:      { glow: '#00D2FF', bg: 'rgba(0,210,255,0.1)' },
  legendary: { glow: '#FFD700', bg: 'rgba(255,215,0,0.1)' }
};

// ─── SVG PROGRESS RING ───
function HeroProgressRing({ percent, score, level, rank }: { percent: number; score: number; level: number; rank: string }) {
  const { P } = useAppTheme();
  const size = 160;
  const strokeW = 14;
  const radius = (size - strokeW) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * (percent || 0)) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00D2FF" />
            <Stop offset="100%" stopColor="#8A2BE2" />
          </SvgGradient>
        </Defs>
        <SvgCircle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} fill="none" />
        <SvgCircle 
          cx={size/2} cy={size/2} r={radius} 
          stroke="url(#ringGrad)" strokeWidth={strokeW} 
          strokeDasharray={circ} strokeDashoffset={offset} 
          strokeLinecap="round" fill="none" 
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>
      <View style={[{ alignItems: 'center', justifyContent: 'center' }, StyleSheet.absoluteFill]}>
        <Text style={[sStatic.heroLevel, { color: P.white }]}>Lvl {level}</Text>
        <Text style={[sStatic.heroScore, { color: P.dim }]}>{score} XP</Text>
        <Text style={[sStatic.heroRank, { color: '#87C4FF' }]}>{rank.split(' ')[0]}</Text>
      </View>
    </View>
  );
}

// ─── SMOOTH SCORE TREND CHART ───
function SmoothScoreChart({ logs }: { logs: any[] }) {
  const { P } = useAppTheme();
  const chartHeight = 100;

  if (!logs || logs.length === 0) {
    return (
      <View style={[sStatic.chartWrap, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: P.dimmer, fontSize: 13 }}>No score logs logged yet.</Text>
      </View>
    );
  }

  // Map 7 logs to coordinates
  const scores = logs.map(l => l.score || 0);
  const minScore = Math.min(...scores, 0);
  const maxScore = Math.max(...scores, 100);
  const range = maxScore - minScore;

  const points = logs.map((log, index) => {
    const x = (index / (logs.length - 1)) * 100;
    const y = 80 - ((log.score - minScore) / range) * 60; // scale between 20 and 80
    return { x, y };
  });

  // Create smooth bezier path string
  let pathData = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathData += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p1.x},${p1.y}`;
  }

  return (
    <View style={sStatic.chartWrap}>
      <Svg width="100%" height={chartHeight} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00D2FF" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#8A2BE2" stopOpacity="0.0" />
          </SvgGradient>
        </Defs>
        <Path d={`${pathData} L 100,100 L 0,100 Z`} fill="url(#chartGrad)" />
        <Path d={pathData} fill="none" stroke="#00D2FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <SvgCircle key={i} cx={p.x} cy={p.y} r="2.5" fill={P.bg} stroke={i === points.length - 1 ? P.white : '#00D2FF'} strokeWidth="1.5" />
        ))}
      </Svg>
      <View style={sStatic.chartLabels}>
        {logs.map((log, i) => {
          const dateParts = log.date.split('-');
          const label = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : log.date;
          return (
            <Text key={i} style={[sStatic.chartLbl, { color: P.dim }, i === logs.length - 1 && { color: P.white, fontWeight: '700' }]}>
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity } = useAppTheme();

  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  const {
    streak,
    achievements,
    scoreDetails,
    fetchGamificationStats,
    purchaseStreakFreeze,
    loading
  } = useGamificationStore();

  const {
    stats: focusStats,
    fetchFocusStats
  } = useFocusStore();

  // Load metrics dynamically whenever this tab gains active focus!
  useFocusEffect(
    useCallback(() => {
      fetchGamificationStats();
      fetchFocusStats();
    }, [])
  );

  const handleTabChange = (tab: TabType) => {
    fireHaptic('light');
    setActiveTab(tab);
  };

  const handleBuyFreeze = () => {
    fireHaptic('medium');
    Alert.alert(
      'Purchase Streak Freeze ❄️',
      'Spend 150 points to activate a Streak Freeze Shield. It protects your daily completion streak if you miss a day!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Shield',
          onPress: async () => {
            const res = await purchaseStreakFreeze();
            if (res.success) {
              Alert.alert('Shield Active! ❄️', res.message);
            } else {
              Alert.alert('Failed Purchase', res.message);
            }
          }
        }
      ]
    );
  };

  // ─── STYLESHEET ───
  const s = React.useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: P.bg },
    scroll: { paddingHorizontal: 22 },
    
    // Header
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
    pageTitle: { fontSize: 30, fontWeight: '800', color: P.white, letterSpacing: -0.5 },
    pageSub:   { fontSize: 13, color: P.dimmer, fontWeight: '500', marginTop: 3 },
    refreshBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.04)' },

    // Segmented Tabs Control
    tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: P.borderSub, marginBottom: 24 },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
    tabTxt: { fontSize: 13, fontWeight: '600', color: P.dimmer },
    tabTxtActive: { color: P.white, fontWeight: '700' },

    // Content container
    contentWrap: { minHeight: 400 },

    // Cards
    card: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.45)', overflow: 'hidden' },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: P.white },

    // Grid Stats
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statBox: { width: (ACTUAL_W - 44 - 12) / 2, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)', overflow: 'hidden' },
    statIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statVal: { fontSize: 24, fontWeight: '800', color: P.white, letterSpacing: -0.5, marginBottom: 1 },
    statLbl: { fontSize: 12, color: P.dimmer, fontWeight: '600' },

    // Flame Streak Widget
    flameBox: { alignItems: 'center', paddingVertical: 24 },
    streakCount: { fontSize: 64, fontWeight: '900', color: '#FF7B00', marginTop: 10, letterSpacing: -1 },
    streakLbl: { fontSize: 14, color: P.dim, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

    // Mini Streak Calendar
    calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    calendarDay: { alignItems: 'center', gap: 6 },
    calendarDayCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    calendarDayCircleActive: { backgroundColor: '#FF7B00', borderColor: '#FF7B00' },
    calendarDayTxt: { fontSize: 11, color: P.dim, fontWeight: '600' },

    // Freeze Shield Store Section
    freezeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,210,255,0.25)', backgroundColor: 'rgba(0,210,255,0.04)', marginTop: 8 },
    freezeInfo: { flex: 1, marginRight: 12 },
    freezeTitle: { fontSize: 15, fontWeight: '700', color: P.white, marginBottom: 4 },
    freezeSub: { fontSize: 12, color: P.dim, lineHeight: 16 },
    freezeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#00D2FF', shadowColor: '#00D2FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    freezeBtnTxt: { color: C.white, fontSize: 12, fontWeight: '700' },

    // Badges / Achievements Grid
    badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    badgeCard: { width: (ACTUAL_W - 44 - 12) / 2, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)', alignItems: 'center', overflow: 'hidden' },
    badgeLocked: { opacity: 0.4 },
    badgeIconFrame: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    badgeTitle: { fontSize: 13, fontWeight: '800', color: P.white, textAlign: 'center', marginBottom: 4 },
    badgeSub: { fontSize: 10, color: P.dimmer, textAlign: 'center', lineHeight: 14, paddingHorizontal: 4 },

    // AI Insight
    insightCard: { flexDirection: 'row', padding: 14, borderRadius: 18, backgroundColor: P.purple + '12', borderWidth: 1, borderColor: P.purple + '35', marginBottom: 12 },
    insightTxt: { flex: 1, fontSize: 12.5, color: P.white, lineHeight: 18, marginLeft: 12, fontWeight: '500' }
  }), [P]);

  return (
    <View style={s.root}>
      <CinematicBackground particleCount={20} showScanLine={false} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: 100, maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.pageTitle}>Productivity Hub</Text>
              <Text style={s.pageSub}>Compete, unlock, and level up.</Text>
            </View>
            <Pressable
              style={s.refreshBtn}
              onPress={() => {
                fireHaptic('light');
                fetchGamificationStats();
                fetchFocusStats();
              }}
            >
              <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
              {loading ? (
                <ActivityIndicator size="small" color={P.white} />
              ) : (
                <Ionicons name="refresh" size={16} color={P.white} />
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Segmented Tabs ── */}
        <Animated.View entering={FadeInUp.delay(150)}>
          <View style={s.tabRow}>
            <BlurView intensity={getBlurIntensity(20)} tint="dark" style={StyleSheet.absoluteFill} />
            <Pressable
              style={[s.tabBtn, activeTab === 'analytics' && s.tabBtnActive]}
              onPress={() => handleTabChange('analytics')}
            >
              <Text style={[s.tabTxt, activeTab === 'analytics' && s.tabTxtActive]}>Analytics</Text>
            </Pressable>
            <Pressable
              style={[s.tabBtn, activeTab === 'streaks' && s.tabBtnActive]}
              onPress={() => handleTabChange('streaks')}
            >
              <Text style={[s.tabTxt, activeTab === 'streaks' && s.tabTxtActive]}>Streaks</Text>
            </Pressable>
            <Pressable
              style={[s.tabBtn, activeTab === 'badges' && s.tabBtnActive]}
              onPress={() => handleTabChange('badges')}
            >
              <Text style={[s.tabTxt, activeTab === 'badges' && s.tabTxtActive]}>Badges</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Tabs Content ── */}
        <View style={s.contentWrap}>
          {/* TAB 1: ANALYTICS & SCORING */}
          {activeTab === 'analytics' && (
            <Animated.View entering={FadeIn.duration(200)} layout={Layout.springify()}>
              {/* Circular Progress Ring */}
              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <HeroProgressRing
                  percent={scoreDetails?.levelProgress || 0}
                  score={scoreDetails?.productivityScore || 0}
                  level={scoreDetails?.level || 1}
                  rank={scoreDetails?.rank || 'Beginner 🌱'}
                />
              </View>

              {/* Stats Grid */}
              <View style={s.grid}>
                <View style={s.statBox}>
                  <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={[s.statIconBox, { backgroundColor: '#3b82f620' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                  </View>
                  <Text style={s.statVal}>{scoreDetails?.totalCompletedTasks || 0}</Text>
                  <Text style={s.statLbl}>Completions</Text>
                </View>
                <View style={s.statBox}>
                  <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={[s.statIconBox, { backgroundColor: '#8a2be220' }]}>
                    <Ionicons name="trending-up" size={16} color="#8a2be2" />
                  </View>
                  <Text style={s.statVal}>{scoreDetails?.totalHighPriorityCompleted || 0}</Text>
                  <Text style={s.statLbl}>High Priority</Text>
                </View>
              </View>

              {/* Deep Focus Summary Card */}
              <View style={s.card}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle}>Deep Focus Sanctum</Text>
                  <Ionicons name="timer-outline" size={16} color="#87C4FF" />
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#87C4FF' }}>
                      {(() => {
                        const totalMins = focusStats?.totalFocusMinutes || 0;
                        const hrs = Math.floor(totalMins / 60);
                        const mins = totalMins > 0 ? Math.max(1, Math.round(totalMins % 60)) : 0;
                        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                      })()}
                    </Text>
                    <Text style={{ fontSize: 11, color: P.dimmer, marginTop: 4, fontWeight: '600' }}>Focus Duration</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', height: '80%', alignSelf: 'center' }} />
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: P.white }}>
                      {focusStats?.longestFocusSession > 0 ? Math.max(1, Math.round(focusStats.longestFocusSession)) : 0}m
                    </Text>
                    <Text style={{ fontSize: 11, color: P.dimmer, marginTop: 4, fontWeight: '600' }}>Longest Session</Text>
                  </View>
                </View>
              </View>

              {/* Focus Ambience Listening Stats Card */}
              <View style={s.card}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle}>Ambience Listening Breakdown</Text>
                  <Ionicons name="headset-outline" size={16} color="#8A2BE2" />
                </View>

                <Text style={{ fontSize: 12, color: P.dimmer, lineHeight: 18, marginBottom: 16 }}>
                  Detailed tracking of the background frequencies you used to focus.
                </Text>

                <View style={{ gap: 14 }}>
                  {[
                    { id: 'piano', title: 'Piano Sanctuary', icon: 'musical-notes-outline', color: '#FFD700' },
                    { id: 'ocean', title: 'Ocean Waves', icon: 'water-outline', color: '#00D2FF' },
                    { id: 'forest', title: 'Forest Whispers', icon: 'leaf-outline', color: '#4CAF50' },
                    { id: 'rain', title: 'Cozy Rain', icon: 'rainy-outline', color: '#87C4FF' },
                    { id: 'thunder', title: 'Deep Thunder', icon: 'thunderstorm-outline', color: '#FF7B00' }
                  ].map((track) => {
                    const totalMinsForTrack = focusStats?.ambienceBreakdown?.[track.id] || 0;
                    const mins = totalMinsForTrack > 0 ? Math.max(1, Math.round(totalMinsForTrack)) : 0;

                    // Find max minutes to show relative progress bars beautifully!
                    const allMinutesList = [
                      focusStats?.ambienceBreakdown?.piano || 0,
                      focusStats?.ambienceBreakdown?.ocean || 0,
                      focusStats?.ambienceBreakdown?.forest || 0,
                      focusStats?.ambienceBreakdown?.rain || 0,
                      focusStats?.ambienceBreakdown?.thunder || 0
                    ];
                    const maxMinutes = Math.max(...allMinutesList, 1); // default to at least 1 min to prevent division by 0
                    const progressPercent = Math.max(3, (totalMinsForTrack / maxMinutes) * 100);

                    return (
                      <View key={track.id} style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name={track.icon as any} size={15} color={track.color} />
                            <Text style={{ fontSize: 13, color: P.white, fontWeight: '700' }}>{track.title}</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: track.color, fontWeight: '800' }}>
                            {mins} min
                          </Text>
                        </View>
                        
                        {/* Immersive Glassmorphic progress bar */}
                        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' }}>
                          <LinearGradient
                            colors={[track.color, `${track.color}50`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 3 }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Historical Curve Chart */}
              <View style={s.card}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle}>Productivity Score Trend</Text>
                  <Ionicons name="sparkles" size={16} color="#00D2FF" />
                </View>
                <SmoothScoreChart logs={scoreDetails?.historyLogs || []} />
              </View>

              {/* AI Recommendations Insights */}
              <Text style={[s.cardTitle, { marginBottom: 12, paddingLeft: 4 }]}>Smart Suggestions</Text>
              <View style={s.insightCard}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="bulb-outline" size={16} color="#8a2be2" style={{ marginTop: 2 }} />
                <Text style={s.insightTxt}>
                  Completing high priority tasks before 10 AM grants an automatic +10 bonus XP. Try targeting your most critical task first tomorrow! ⚡
                </Text>
              </View>
            </Animated.View>
          )}

          {/* TAB 2: DUOLINGO STREAKS */}
          {activeTab === 'streaks' && (
            <Animated.View entering={FadeIn.duration(200)} layout={Layout.springify()}>
              <View style={s.card}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={s.flameBox}>
                  <Ionicons name="flame" size={80} color="#FF7B00" style={{ shadowColor: '#FF7B00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15 }} />
                  <Text style={s.streakCount}>{streak?.currentStreak || 0}</Text>
                  <Text style={s.streakLbl}>Days Streak</Text>
                </View>

                {/* Longest streak marker */}
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 14 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 13, color: P.dim, fontWeight: '600' }}>Longest Streak Record:</Text>
                  <Text style={{ fontSize: 13, color: P.white, fontWeight: '700' }}>{streak?.longestStreak || 0} Days 🔥</Text>
                </View>
              </View>

              {/* Weekly Mini Flame Tracker Calendar Grid */}
              <View style={s.card}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={s.cardTitle}>Streak History (Mon - Sun)</Text>
                <View style={s.calendarRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                    const today = new Date();
                    const currentDayOffset = (today.getDay() + 6) % 7; // Mon is 0, Sun is 6
                    const isCompleted = index <= currentDayOffset && (streak?.currentStreak || 0) > (currentDayOffset - index);
                    
                    return (
                      <View key={index} style={s.calendarDay}>
                        <View style={[s.calendarDayCircle, isCompleted && s.calendarDayCircleActive]}>
                          <Ionicons name={isCompleted ? "flame" : "radio-button-off-outline"} size={14} color={isCompleted ? C.white : 'rgba(255,255,255,0.25)'} />
                        </View>
                        <Text style={s.calendarDayTxt}>{day}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Streak Freeze Shield Store Section */}
              <View style={s.freezeCard}>
                <BlurView intensity={getBlurIntensity(35)} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={s.freezeInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Ionicons name={streak?.streakFreezeActive ? "shield-checkmark" : "shield-outline"} size={16} color="#00D2FF" />
                    <Text style={s.freezeTitle}>
                      Streak Freeze Shield {streak?.streakFreezeActive ? '(ACTIVE)' : '(LOCKED)'}
                    </Text>
                  </View>
                  <Text style={s.freezeSub}>
                    {streak?.streakFreezeActive
                      ? 'You are currently protected! If you miss a task tomorrow, your streak will not reset.'
                      : 'Purchase a shield for 150 points to safeguard your consistency record.'}
                  </Text>
                </View>
                {!streak?.streakFreezeActive && (
                  <Pressable style={s.freezeBtn} onPress={handleBuyFreeze}>
                    <Text style={s.freezeBtnTxt}>Buy (150 XP)</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          {/* TAB 3: BADGES COLLECTION GRID */}
          {activeTab === 'badges' && (
            <Animated.View entering={FadeIn.duration(200)} layout={Layout.springify()}>
              <View style={s.badgesGrid}>
                {achievements.map((badge: any, i: number) => {
                  const colors = RARITY_COLORS[badge.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common;
                  return (
                    <Pressable
                      key={i}
                      style={[s.badgeCard, !badge.unlocked && s.badgeLocked]}
                      onPress={() => {
                        fireHaptic('light');
                        if (!badge.unlocked) {
                          Alert.alert(badge.title, `Locked! Target Goal: ${badge.sub}`);
                        } else {
                          Alert.alert(badge.title, `Unlocked! Complete on: ${new Date(badge.unlockedAt).toLocaleDateString()}`);
                        }
                      }}
                    >
                      <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
                      
                      <View style={[
                        s.badgeIconFrame,
                        {
                          borderColor: badge.unlocked ? colors.glow : 'rgba(255,255,255,0.1)',
                          backgroundColor: badge.unlocked ? colors.bg : 'rgba(255,255,255,0.02)',
                          shadowColor: colors.glow
                        }
                      ]}>
                        <Ionicons name={badge.icon as any} size={28} color={badge.unlocked ? colors.glow : 'rgba(255,255,255,0.2)'} />
                      </View>

                      <Text style={s.badgeTitle}>{badge.title}</Text>
                      <Text style={s.badgeSub}>{badge.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const sStatic = StyleSheet.create({
  chartWrap: { height: 130, paddingTop: 10, justifyContent: 'flex-end' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  chartLbl: { fontSize: 11, fontWeight: '500' },
  heroLevel: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  heroScore: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  heroRank: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
});
