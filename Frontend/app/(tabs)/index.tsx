/**
 * app/(tabs)/index.tsx  ·  To|Do Home — Premium Redesign
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Dimensions, StatusBar, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withDelay, withSpring, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CinematicBackground } from '../../components/CinematicBackground';
import { useAppTheme } from '../../hooks/useAppTheme';
import { fireHaptic, fireSuccessHaptic } from '../../utils/haptics';
import { useTaskStore } from '../../src/store/taskStore';
import { ActivityIndicator } from 'react-native';

const { width: W } = Dimensions.get('window');

// ─── Data ────────────────────────────────────────────────────────────────────
const CHIPS = ['Study', 'Health', 'Focus', 'Personal'];

type Task = {
  id: string; title: string; time: string;
  accent: string; completed: boolean; tag: string;
};

// ─── FadeUp wrapper ───────────────────────────────────────────────────────────
function FadeUp({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(22);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  return <Animated.View style={s}>{children}</Animated.View>;
}

// ─── Glow Button (animated pulse) ────────────────────────────────────────────
function GlowBtn({ onPress }: { onPress: () => void }) {
  const { P } = useAppTheme();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0,  { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ), -1, true,
    );
  }, []);
  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35 + (pulse.value - 1) * 1.5,
  }));

  const addBtn = StyleSheet.create({
    halo: {
      position: 'absolute', width: 54, height: 54, borderRadius: 27,
      backgroundColor: P.purple,
    },
    btn: {
      width: 42, height: 42, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: P.purple, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.7, shadowRadius: 14, elevation: 12,
    },
  });

  return (
    <Pressable onPress={onPress}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[addBtn.halo, glow]} />
        <LinearGradient colors={[P.purple, P.purple2]} style={addBtn.btn}>
          <Ionicons name="add" size={22} color="#fff" />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function Bars({ data, color }: { data: number[]; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 26, marginLeft: 10, marginTop: 10 }}>
      {data.map((val, i) => {
        const h = val / 100;
        return (
          <View key={i} style={{
            width: 5, height: Math.max(4, 26 * h), borderRadius: 3,
            backgroundColor: color, opacity: 0.3 + h * 0.65,
          }} />
        );
      })}
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, chart }: {
  label: string; value: string; color: string; chart: number[];
}) {
  const { P, getBlurIntensity } = useAppTheme();
  const sc = React.useMemo(() => StyleSheet.create({
    card: {
      flex: 1, borderRadius: 22, padding: 16, minHeight: 118, overflow: 'hidden',
      borderWidth: 1, borderColor: P.borderSub,
      backgroundColor: 'rgba(10,18,34,0.4)',
    },
    topLine: { position: 'absolute', left: 0, top: 18, bottom: 18, width: 3, borderRadius: 2 },
    glow:    { position: 'absolute', top: -24, right: -24, width: 72, height: 72, borderRadius: 36, opacity: 0.12 },
    label:   { fontSize: 10, color: P.dimmer, fontWeight: '600', letterSpacing: 0.8, marginLeft: 10 },
    val:     { fontSize: 30, fontWeight: '800', marginLeft: 10, marginTop: 4, letterSpacing: -1 },
  }), [P]);

  return (
    <View style={sc.card}>
      <BlurView intensity={getBlurIntensity(28)} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[sc.topLine, { backgroundColor: color }]} />
      <View style={[sc.glow, { backgroundColor: color }]} />
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.val, { color }]}>{value}</Text>
      <View style={{ flexGrow: 1 }} />
      <Bars data={chart} color={color} />
    </View>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const { P, getBlurIntensity, getGlowStyles } = useAppTheme();
  const tc = React.useMemo(() => StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12,
      borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)',
    },
    cbx: {
      width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, borderColor: P.dimmer,
      alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: 'rgba(255,255,255,0.02)',
    },
    title: { fontSize: 15, fontWeight: '600', color: P.white, marginBottom: 4 },
    time:  { fontSize: 13, color: P.dim, fontWeight: '500' },
  }), [P]);

  const checkSc   = useSharedValue(task.completed ? 1 : 0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    checkSc.value = withSpring(task.completed ? 1 : 0, { mass: 0.5, damping: 12 });
  }, [task.completed]);

  const onPressIn = () => { cardScale.value = withTiming(0.97, { duration: 100 }); };
  const onPressOut = () => { cardScale.value = withTiming(1, { duration: 150 }); };
  const handlePress = () => {
    if (!task.completed) fireSuccessHaptic();
    else fireHaptic('light');
    onToggle();
  };

  const animCard = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: task.completed ? 0.6 : 1,
  }));

  const animCheck = useAnimatedStyle(() => ({
    transform: [{ scale: checkSc.value }],
    opacity: checkSc.value,
  }));

  return (
    <Animated.View style={animCard}>
      <View style={tc.card}>
        <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Checkbox and Text fields */}
        <Pressable 
          onPressIn={onPressIn} 
          onPressOut={onPressOut} 
          onPress={handlePress} 
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={tc.cbx}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: P.blue, borderRadius: 6, ...getGlowStyles(0.3, 10) }, animCheck]} />
            <Animated.View style={animCheck}>
              <Ionicons name="checkmark" size={16} color={P.bg} />
            </Animated.View>
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[tc.title, task.completed && { textDecorationLine: 'line-through', color: P.dim }]}>
              {task.title}
            </Text>
            <Text style={tc.time}>{task.time}</Text>
          </View>
        </Pressable>

        {/* Cinematic trash button */}
        <Pressable 
          onPress={onDelete}
          style={({ pressed }) => [
            {
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255, 75, 75, 0.22)' : 'rgba(255, 75, 75, 0.06)',
              borderWidth: 1,
              borderColor: pressed ? 'rgba(255, 75, 75, 0.40)' : 'rgba(255, 75, 75, 0.14)',
              shadowColor: '#FF4B4B',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: pressed ? 0.5 : 0.15,
              shadowRadius: pressed ? 6 : 3,
            }
          ]}
        >
          <Ionicons name="trash-outline" size={15} color="#FF6B6B" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function EmptyState() {
  const { P } = useAppTheme();
  return (
    <FadeUp delay={100}>
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: P.blue + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: P.blue + '40' }}>
          <Ionicons name="sparkles" size={32} color={P.blue} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: P.white, letterSpacing: -0.5 }}>No tasks yet</Text>
        <Text style={{ fontSize: 14, color: P.dim, textAlign: 'center', paddingHorizontal: 40 }}>Your day is clear. Take a breath or start planning your next move.</Text>
        <Pressable onPress={() => router.push('/add-task' as any)} style={{ marginTop: 10, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, backgroundColor: P.blue, shadowColor: P.blue, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }}>
          <Text style={{ color: P.bg, fontWeight: '700', fontSize: 14 }}>Create Your First Task</Text>
        </Pressable>
      </View>
    </FadeUp>
  );
}

function LoadingState() {
  const { P } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
      <ActivityIndicator size="large" color={P.blue} />
      <Text style={{ marginTop: 16, color: P.dim, fontWeight: '600' }}>Syncing Tasks...</Text>
    </View>
  );
}

// ─── Main Home Screen ─────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity, getGlowStyles, minimalMode } = useAppTheme();
  const { tasks, fetchTasks, loading, updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const s = React.useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: P.bg },
    content: { paddingHorizontal: 22 },
    radial:  { position: 'absolute', borderRadius: 999 },
  
    // Header
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    greet:  { fontSize: 13, color: P.dim, fontWeight: '500' },
    hero:   { fontSize: 30, fontWeight: '800', color: P.white, lineHeight: 36, letterSpacing: -0.8 },
    heroSub:{ fontSize: 12, color: P.dimmer, fontWeight: '400', marginTop: 2 },
    iconBtn:{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    notifDot:{ position:'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B6B', borderWidth: 1, borderColor: P.bg },
    avatar: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { fontSize: 15, fontWeight: '800', color: P.white },
  
    // Pending pill
    pendingPill: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 20, paddingHorizontal: 2 },
    pendingDot:  { width: 7, height: 7, borderRadius: 4 },
    pendingTxt:  { fontSize: 12, color: P.dim, fontWeight: '500' },
  
    // Input
    inputWrap: {
      borderRadius: 20, overflow: 'hidden', marginBottom: 18,
      borderWidth: 1, borderColor: P.border,
      backgroundColor: 'rgba(10,18,34,0.5)',
      ...getGlowStyles(0.18, 24)
    },
    inputTopShine: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    input: { flex: 1, fontSize: 14, color: P.white, fontWeight: '500' },
  
    // Chips
    chipActive:   { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18 },
    chip:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: P.borderSub },
    chipTxtActive:{ fontSize: 13, fontWeight: '700', color: P.white },
    chipTxt:      { fontSize: 13, fontWeight: '500', color: P.dimmer },
  
    // Stats
    sectionLabel: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
    sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
    statsRow:     { flexDirection: 'row', marginBottom: 12 },
    countBadge:   { width: 24, height: 24, borderRadius: 8, backgroundColor: P.blue + '20', borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center' },
    countTxt:     { fontSize: 11, fontWeight: '800', color: P.blue },
  
    // Progress bar
    progressCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 16, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 14, marginBottom: 28,
      borderWidth: 1, borderColor: P.borderSub,
      backgroundColor: 'rgba(12,6,24,0.4)',
    },
    progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
    progressFill:  { height: '100%', borderRadius: 3 },
    progressPct:   { fontSize: 13, fontWeight: '800', color: P.blue, minWidth: 38, textAlign: 'right' },
  }), [P, getGlowStyles]);

  const [activeChip, setChip]     = useState('Focus');

  const done    = tasks.filter((t: any) => t.completed).length;
  const pending = tasks.filter((t: any) => !t.completed).length;
  const total   = tasks.length;
  const pct     = total === 0 ? 0 : Math.round((done / total) * 100);

  const toggle = async (id: string) => {
    const task = tasks.find((t: any) => t._id === id);
    if (task) {
      fireHaptic('light');
      await updateTask(task._id, { completed: !task.completed });
    }
  };

  const handleDelete = async (id: string) => {
    fireHaptic('medium');
    Alert.alert(
      "Delete Task",
      "Are you sure you want to remove this task?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            fireSuccessHaptic();
            await deleteTask(id);
          }
        }
      ]
    );
  };

  const displayTasks = tasks.map((t: any) => ({
    id: t._id,
    title: t.title,
    time: t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Today',
    accent: t.priority === 'High' ? '#FF6B6B' : (t.priority === 'Medium' ? '#F7DC6F' : '#4ECDC4'),
    completed: t.completed,
    tag: t.category || 'General',
  }));

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background ────────────────────────────────────── */}
      <CinematicBackground particleCount={28} showScanLine={false} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 20, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ──────────────────────────────────────── */}
        <FadeUp delay={0}>
          <View style={s.header}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.greet}>Good evening, Ashil 👋</Text>
              <Text style={s.hero}>Own your{'\n'}tomorrow.</Text>
              <Text style={s.heroSub}>Stay focused and finish strong.</Text>
            </View>
            <View style={{ gap: 10, alignItems: 'center' }}>
              <Pressable style={s.iconBtn}>
                <Ionicons name="notifications-outline" size={19} color={P.dim} />
                <View style={s.notifDot} />
              </Pressable>
              <LinearGradient colors={[P.blue, P.blue2]} style={s.avatar}>
                <Text style={s.avatarTxt}>A</Text>
              </LinearGradient>
            </View>
          </View>
        </FadeUp>

        {/* Pending summary pill */}
        <FadeUp delay={60}>
          <View style={s.pendingPill}>
            <View style={[s.pendingDot, { backgroundColor: pending > 0 ? '#FF6B6B' : '#4ECDC4' }]} />
            <Text style={s.pendingTxt}>{pending} task{pending !== 1 ? 's' : ''} pending today</Text>
          </View>
        </FadeUp>

        {/* ── Input ───────────────────────────────────────── */}
        <FadeUp delay={120}>
          <Pressable style={s.inputWrap} onPress={() => { fireHaptic('medium'); router.push('/add-task' as any); }}>
            <BlurView intensity={getBlurIntensity(65)} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={s.inputTopShine} />
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 }}>
              <Ionicons name="search" size={20} color={P.dim} />
              <Text style={s.input}>Search tasks or create new...</Text>
              <Ionicons name="add-circle" size={22} color={P.blue} />
            </View>
          </Pressable>
        </FadeUp>

        {/* ── Chips ───────────────────────────────────────── */}
        <FadeUp delay={180}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
              {CHIPS.map((c, i) => {
                const active = i === 0;
                return (
                  <Pressable key={c} onPress={() => fireHaptic('light')}>
                    <View style={active ? s.chipActive : s.chip}>
                      {active && <BlurView intensity={getBlurIntensity(40)} tint="dark" style={StyleSheet.absoluteFill} />}
                      {active && <LinearGradient colors={[P.blue, P.blue2]} style={StyleSheet.absoluteFill} />}
                      <Text style={active ? s.chipTxtActive : s.chipTxt}>{c}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
        </FadeUp>

        {/* ── Progress section label ───────────────────────── */}
        <FadeUp delay={230}>
          <Text style={s.sectionLabel}>Progress</Text>
        </FadeUp>

        {/* ── Stats row ───────────────────────────────────── */}
        <FadeUp delay={270}>
          {!minimalMode && (
            <View style={s.statsRow}>
              <StatCard label="PRODUCTIVITY" value="82%" color={P.blue} chart={[40, 60, 50, 80, 100, 70, 90]} />
              <View style={{ width: 14 }} />
              <StatCard label="FOCUS TIME" value="4h" color={P.purple} chart={[20, 30, 40, 35, 60, 45, 55]} />
            </View>
          )}
        </FadeUp>

        {/* Progress bar */}
        <FadeUp delay={310}>
          <View style={s.progressCard}>
            <BlurView intensity={getBlurIntensity(22)} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={s.progressTrack}>
                <LinearGradient
                  colors={[P.blue2, P.blue]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${pct}%` as any }]}
                />
              </View>
            </View>
            <Text style={s.progressPct}>{pct}%</Text>
          </View>
        </FadeUp>

        {/* ── Tasks ───────────────────────────────────────── */}
        <FadeUp delay={360}>
          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>Your Tasks</Text>
            <View style={s.countBadge}>
              <Text style={s.countTxt}>{displayTasks.length}</Text>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={420}>
          {loading && displayTasks.length === 0 ? (
            <LoadingState />
          ) : displayTasks.length === 0 ? (
            <EmptyState />
          ) : (
            displayTasks.map((t: any) => (
              <TaskCard key={t.id} task={t as any} onToggle={() => toggle(t.id)} onDelete={() => handleDelete(t.id)} />
            ))
          )}
        </FadeUp>

      </ScrollView>
    </View>
  );
}


