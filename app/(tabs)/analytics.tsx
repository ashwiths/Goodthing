/**
 * app/(tabs)/analytics.tsx  ·  To|Do — Premium Stats & Analytics
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Svg, { Path, Circle as SvgCircle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { CinematicBackground } from '../../components/CinematicBackground';

import { useAppTheme } from '../../hooks/useAppTheme';
import { fireHaptic } from '../../utils/haptics';

const { width: W } = Dimensions.get('window');
const MAX_W = 600;
const ACTUAL_W = Math.min(W, MAX_W);

// ─── Dummy Data ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Study', percent: 85, colorKey: 'blue' },
  { name: 'Health', percent: 60, colorKey: 'low' },
  { name: 'Work', percent: 92, colorKey: 'purple' },
  { name: 'Personal', percent: 45, colorKey: 'medium' },
];

const ACHIEVEMENTS = [
  { title: '7 Day Streak 🔥', sub: 'Consistent', color: '#FF9F43' },
  { title: 'Early Planner 🌙', sub: 'Prepared', colorKey: 'purple' },
  { title: 'Task Master ⚡', sub: '100+ Done', colorKey: 'blue' },
  { title: 'Focus Champ 🎯', sub: 'Deep Work', colorKey: 'low' },
];

const INSIGHTS = [
  "You complete 40% more tasks before 11 AM. Keep up the morning momentum! 🌅",
  "Health category is your most consistent. You rarely miss a workout! 💪",
  "Focus time improved 18% this week. Deep work sessions are paying off. 🧠"
];

// ─── Components ──────────────────────────────────────────────────────────────

// Weekly Line Chart SVG
function WeeklyLineChart() {
  const { P } = useAppTheme();
  const chartHeight = 100;
  // Smooth curve through points representing Mon-Sun
  const pathData = "M 0,80 C 20,80 30,40 50,50 C 70,60 80,10 100,20";
  
  return (
    <View style={sStatic.chartWrap}>
      <Svg width="100%" height={chartHeight} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={P.blue} stopOpacity="0.4" />
            <Stop offset="1" stopColor={P.blue} stopOpacity="0.0" />
          </SvgGradient>
        </Defs>
        <Path d={`${pathData} L 100,100 L 0,100 Z`} fill="url(#grad)" />
        <Path d={pathData} fill="none" stroke={P.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Plot dots */}
        <SvgCircle cx="0" cy="80" r="3" fill={P.bg} stroke={P.blue} strokeWidth="1.5" />
        <SvgCircle cx="50" cy="50" r="3" fill={P.bg} stroke={P.blue} strokeWidth="1.5" />
        <SvgCircle cx="100" cy="20" r="3" fill={P.bg} stroke={P.white} strokeWidth="2" />
      </Svg>
      <View style={sStatic.chartLabels}>
        {['M','T','W','T','F','S','S'].map((day, i) => (
          <Text key={i} style={[sStatic.chartLbl, { color: P.dim }, i === 6 && { color: P.white, fontWeight: '700' }]}>{day}</Text>
        ))}
      </View>
    </View>
  );
}

// Hero Circular Progress Ring
function HeroRing({ percent }: { percent: number }) {
  const { P } = useAppTheme();
  const size = 160;
  const strokeW = 16;
  const radius = (size - strokeW) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * percent) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={P.blue} />
            <Stop offset="100%" stopColor={P.purple} />
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
        <Text style={[sStatic.heroPercent, { color: P.white }]}>{percent}%</Text>
        <Text style={[sStatic.heroPercentLbl, { color: P.dimmer }]}>Productivity</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity, getGlowStyles, minimalMode } = useAppTheme();

  const STATS = [
    { label: 'Completed', val: '128', icon: 'checkmark-circle', color: P.blue },
    { label: 'Pending', val: '12', icon: 'time', color: P.medium },
    { label: 'Streak', val: '14🔥', icon: 'flame', color: '#FF9F43' },
    { label: 'Focus', val: '32h', icon: 'bulb', color: P.purple },
  ];

  const s = React.useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: P.bg },
    scroll: { paddingHorizontal: 22 },
    
    // Header
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
    pageTitle: { fontSize: 32, fontWeight: '800', color: P.white, letterSpacing: -0.5 },
    pageSub:   { fontSize: 14, color: P.dimmer, fontWeight: '500', marginTop: 4 },
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(255,255,255,0.04)' },
    actionTxt: { fontSize: 13, fontWeight: '600', color: P.white },
  
    // Hero Ring Wrap
    heroWrap: { alignItems: 'center', marginBottom: 32 },
  
    // Grid Stats
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 32 },
    statBox: { width: (ACTUAL_W - 44 - 14) / 2, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)', overflow: 'hidden' },
    statIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statVal: { fontSize: 26, fontWeight: '800', color: P.white, letterSpacing: -0.5, marginBottom: 2 },
    statLbl: { fontSize: 13, color: P.dimmer, fontWeight: '600' },
  
    // Card General
    card: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)', overflow: 'hidden' },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: P.white },
    
    // Categories
    catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    catInfo: { flex: 1 },
    catName: { fontSize: 14, fontWeight: '600', color: P.white, marginBottom: 6 },
    catBarBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
    catBarFill: { height: '100%', borderRadius: 3 },
    catVal: { fontSize: 13, fontWeight: '700', color: P.white, marginLeft: 14, minWidth: 32, textAlign: 'right' },
  
    // Achievements
    achBadge: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: P.borderSub, marginBottom: 10 },
    achIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    achTitle: { fontSize: 15, fontWeight: '700', color: P.white, marginBottom: 2 },
    achSub: { fontSize: 12, color: P.dimmer },
  
    // Insights
    insightCard: { flexDirection: 'row', padding: 16, borderRadius: 18, backgroundColor: P.purple + '1A', borderWidth: 1, borderColor: P.purple + '4D', marginBottom: 12 },
    insightTxt: { flex: 1, fontSize: 13, color: P.white, lineHeight: 20, marginLeft: 12, fontWeight: '500' },
  }), [P]);

  return (
    <View style={s.root}>
      <CinematicBackground particleCount={25} showScanLine={false} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: 100, maxWidth: MAX_W, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.pageTitle}>Your Progress</Text>
              <Text style={s.pageSub}>Consistency builds momentum.</Text>
            </View>
            <View style={s.actionRow}>
              <Pressable style={s.actionBtn} onPress={() => fireHaptic('light')}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="cloud-download-outline" size={16} color={P.dim} />
              </Pressable>
              <Pressable style={s.actionBtn} onPress={() => fireHaptic('light')}>
                <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="share-outline" size={16} color={P.white} />
                <Text style={s.actionTxt}>Export</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ── Hero Ring ── */}
        {!minimalMode && (
          <Animated.View entering={FadeInUp.delay(150)}>
            <View style={s.heroWrap}>
              <HeroRing percent={82} />
            </View>
          </Animated.View>
        )}

        {/* ── Top Stats Grid ── */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <View style={s.grid}>
            {STATS.map((st, i) => (
              <View key={i} style={s.statBox}>
                <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[s.statIconBox, { backgroundColor: st.color + '20' }]}>
                  <Ionicons name={st.icon as any} size={18} color={st.color} />
                </View>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLbl}>{st.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Weekly Trend ── */}
        <Animated.View entering={FadeInUp.delay(250)}>
          <View style={s.card}>
            <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={s.cardTitleRow}>
              <Text style={s.cardTitle}>Weekly Activity</Text>
              <Ionicons name="analytics" size={20} color={P.blue} />
            </View>
            <WeeklyLineChart />
          </View>
        </Animated.View>

        {/* ── Categories ── */}
        {!minimalMode && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <View style={s.card}>
              <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={s.cardTitleRow}>
                <Text style={s.cardTitle}>Distribution</Text>
                <Ionicons name="pie-chart" size={20} color={P.purple} />
              </View>
              {CATEGORIES.map((c, i) => {
                const color = (P as any)[c.colorKey] || P.blue;
                return (
                  <View key={i} style={s.catRow}>
                    <View style={s.catInfo}>
                      <Text style={s.catName}>{c.name}</Text>
                      <View style={s.catBarBg}>
                        <View style={[s.catBarFill, { width: `${c.percent}%`, backgroundColor: color }]} />
                      </View>
                    </View>
                    <Text style={s.catVal}>{c.percent}%</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── AI Insights ── */}
        <Animated.View entering={FadeInUp.delay(350)}>
          <Text style={[s.cardTitle, { marginBottom: 16 }]}>AI Insights</Text>
          {INSIGHTS.map((txt, i) => (
            <Animated.View key={i} entering={FadeIn.delay(400 + i * 100)}>
              <View style={s.insightCard}>
                <BlurView intensity={getBlurIntensity(40)} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="sparkles" size={18} color={P.purple} style={{ marginTop: 2 }} />
                <Text style={s.insightTxt}>{txt}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ── Achievements ── */}
        <Animated.View entering={FadeInUp.delay(450)}>
          <Text style={[s.cardTitle, { marginTop: 10, marginBottom: 16 }]}>Recent Badges</Text>
          {ACHIEVEMENTS.map((ach, i) => {
            const color = ach.color || (P as any)[ach.colorKey!] || P.blue;
            return (
              <View key={i} style={s.achBadge}>
                <BlurView intensity={getBlurIntensity(20)} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[s.achIcon, { backgroundColor: color + '20' }]}>
                  <Ionicons name="medal" size={20} color={color} />
                </View>
                <View>
                  <Text style={s.achTitle}>{ach.title}</Text>
                  <Text style={s.achSub}>{ach.sub}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const sStatic = StyleSheet.create({
  chartWrap: { height: 130, paddingTop: 10 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  chartLbl: { fontSize: 12, fontWeight: '500' },
  heroPercent: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  heroPercentLbl: { fontSize: 13, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
});
