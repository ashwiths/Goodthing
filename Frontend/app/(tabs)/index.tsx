/**
 * app/(tabs)/index.tsx  ·  To|Do Home — Premium Redesign
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Dimensions, StatusBar, Alert, Modal, Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
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
import { useAuthStore } from '../../src/store/authStore';
import { secureStorage } from '../../src/utils/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalyticsStore } from '../../src/store/analyticsStore';
import { useFocusStore } from '../../src/store/focusStore';
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

function AnimatedCounter({ value, suffix = '', style, isFloat = false }: {
  value: number; suffix?: string; style: any; isFloat?: boolean;
}) {
  const [displayVal, setDisplayVal] = useState(0);
  const sharedVal = useSharedValue(0);

  useEffect(() => {
    sharedVal.value = withTiming(value, {
      duration: 800,
      easing: Easing.out(Easing.quad)
    });
  }, [value]);

  useEffect(() => {
    let active = true;
    const update = () => {
      if (!active) return;
      setDisplayVal(sharedVal.value);
      requestAnimationFrame(update);
    };
    update();
    return () => {
      active = false;
    };
  }, [sharedVal]);

  const formatted = isFloat 
    ? displayVal.toFixed(1)
    : Math.round(displayVal).toString();

  return <Text style={style}>{formatted}{suffix}</Text>;
}

function AnimatedBar({ value, color }: { value: number; color: string }) {
  const heightVal = useSharedValue(4);

  useEffect(() => {
    const h = (value / 100) * 26;
    heightVal.value = withTiming(Math.max(4, h), { duration: 600, easing: Easing.out(Easing.quad) });
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    height: heightVal.value,
  }));

  const h = value / 100;

  return (
    <Animated.View style={[{
      width: 5,
      borderRadius: 3,
      backgroundColor: color,
      opacity: 0.3 + h * 0.65,
    }, animStyle]} />
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function Bars({ data, color }: { data: number[]; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 26, marginLeft: 10, marginTop: 10 }}>
      {data.map((val, i) => (
        <AnimatedBar key={i} value={val} color={color} />
      ))}
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, subValue, color, chart, isFloat = false }: {
  label: string; value: number; subValue?: string; color: string; chart: number[]; isFloat?: boolean;
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
    subVal:  { fontSize: 11, color: P.dim, fontWeight: '600', marginLeft: 10, marginTop: 2 }
  }), [P]);

  return (
    <View style={sc.card}>
      <BlurView intensity={getBlurIntensity(28)} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[sc.topLine, { backgroundColor: color }]} />
      <View style={[sc.glow, { backgroundColor: color }]} />
      <Text style={sc.label}>{label}</Text>
      <AnimatedCounter value={value} suffix={isFloat ? 'h' : '%'} style={[sc.val, { color }]} isFloat={isFloat} />
      {subValue ? <Text style={sc.subVal}>{subValue}</Text> : null}
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
  const { user, savedPassword, logout } = useAuthStore();

  const {
    productivityPercentage,
    totalFocusHours,
    todayFocusMinutes,
    weeklyProductivityTrend,
    weeklyFocusTrend,
    fetchProgressAnalytics
  } = useAnalyticsStore();

  const { restoreSession } = useFocusStore();

  const productivityVal = useSharedValue(0);

  useEffect(() => {
    productivityVal.value = withTiming(productivityPercentage, {
      duration: 800,
      easing: Easing.out(Easing.quad)
    });
  }, [productivityPercentage]);

  const animProgressStyle = useAnimatedStyle(() => ({
    width: `${productivityVal.value}%`,
  }));

  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (productivityPercentage === 100) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.2, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0);
    }
  }, [productivityPercentage]);

  const animGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  };

  useEffect(() => {
    fetchTasks();
    fetchProgressAnalytics();
    restoreSession();
  }, [fetchTasks]);

  const s = React.useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: P.bg },
    content: { paddingHorizontal: 22 },
    radial:  { position: 'absolute', borderRadius: 999 },
  
    // Header
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    greet:  { fontSize: 13, color: P.dim, fontWeight: '500' },
    hero:   { fontSize: 30, fontWeight: '800', color: P.white, lineHeight: 36, letterSpacing: -0.8 },
    heroSub:{ fontSize: 12, color: P.dimmer, fontWeight: '400', marginTop: 2 },
    iconBtn:{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    notifDot:{ position:'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B6B', borderWidth: 1, borderColor: P.bg },
    avatar: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { fontSize: 15, fontWeight: '800', color: P.white },
  
    // Pending pill
    pendingPill: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 26, paddingHorizontal: 2 },
    pendingDot:  { width: 7, height: 7, borderRadius: 4 },
    pendingTxt:  { fontSize: 12, color: P.dim, fontWeight: '500' },
  
    // Input
    inputWrap: {
      borderRadius: 20, overflow: 'hidden', marginBottom: 26,
      borderWidth: 1, borderColor: P.border,
      backgroundColor: 'rgba(10,18,34,0.5)',
      ...getGlowStyles(0.18, 24)
    },
    inputTopShine: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    input: { flex: 1, fontSize: 14, color: P.white, fontWeight: '500' },
  
    // Chips
    chipActive: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      shadowColor: P.blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
      elevation: 6
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden'
    },
    chipTxtActive: { fontSize: 13, fontWeight: '700', color: P.white },
    chipTxt:       { fontSize: 13, fontWeight: '500', color: P.dimmer },
  
    // Stats
    sectionLabel: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
    sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 14 },
    statsRow:     { flexDirection: 'row', marginBottom: 16 },
    countBadge:   { width: 24, height: 24, borderRadius: 8, backgroundColor: P.blue + '20', borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center' },
    countTxt:     { fontSize: 11, fontWeight: '800', color: P.blue },
  
    // Progress bar
    progressCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 16, overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 14, marginBottom: 32,
      borderWidth: 1, borderColor: P.borderSub,
      backgroundColor: 'rgba(12,6,24,0.4)',
    },
    progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
    progressFill:  { height: '100%', borderRadius: 3 },
    progressPct:   { fontSize: 13, fontWeight: '800', color: P.blue, minWidth: 38, textAlign: 'right' },

    // Modal Overlay and Sheet
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
      height: 520,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      backgroundColor: 'rgba(10,18,34,0.7)',
      overflow: 'hidden'
    },
    modalHeader: { alignItems: 'center', paddingVertical: 10 },
    modalHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
    modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: P.white, letterSpacing: -0.5 },
    modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    modalScroll: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 50 },
    statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: 'rgba(78,205,196,0.06)', borderWidth: 1, borderColor: 'rgba(78,205,196,0.18)', marginBottom: 20 },
    statusBannerTxt: { fontSize: 11, color: '#4ECDC4', fontWeight: '500', flex: 1, lineHeight: 15 },
    emptyNotifCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.01)', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    emptyNotifTitle: { fontSize: 14, fontWeight: '700', color: P.white, marginTop: 12, marginBottom: 4 },
    emptyNotifSub: { fontSize: 11.5, color: P.dimmer, textAlign: 'center', lineHeight: 16 },
    notifCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
    notifCardIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,107,107,0.08)', alignItems: 'center', justifyContent: 'center' },
    notifCardTitle: { fontSize: 13, fontWeight: '700', color: P.white, marginBottom: 2 },
    notifCardBody: { fontSize: 11.5, color: P.dim, lineHeight: 15 },
    notifCardMeta: { fontSize: 10, fontWeight: '600', color: P.dimmer, marginTop: 4 },
    testBtn: { height: 50, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: 'rgba(135,196,255,0.2)' },
    testBtnTxt: { fontSize: 13.5, fontWeight: '700', color: '#87C4FF' },
    clearBtn: { height: 50, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: 'rgba(255,107,107,0.15)', backgroundColor: 'rgba(255,107,107,0.02)' },
    clearBtnTxt: { fontSize: 13.5, fontWeight: '700', color: '#FF6B6B' },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    detailLabel: {
      fontSize: 13.5,
      color: P.dim,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      color: P.white,
      fontWeight: '600',
    },
    logoutBtn: {
      height: 50,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,107,107,0.2)',
      backgroundColor: 'rgba(255,107,107,0.04)',
      marginTop: 18,
    },
    logoutBtnTxt: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FF6B6B',
    },
  }), [P, getGlowStyles]);

  const [activeChip, setChip]     = useState('Focus');
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [scheduledNotifs, setScheduledNotifs] = useState<any[]>([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dbPassword, setDbPassword] = useState<string | null>(null);

  useEffect(() => {
    if (profileModalOpen) {
      const loadPasswordDirectly = async () => {
        try {
          let pass = await secureStorage.getItem('savedPassword');
          if (!pass) {
            pass = await AsyncStorage.getItem('async_saved_password');
          }
          console.log("👁️ [Profile Modal Direct Read] Password from storage:", pass);
          if (pass) {
            setDbPassword(pass);
          } else if (savedPassword) {
            setDbPassword(savedPassword);
          }
        } catch (e) {
          console.warn("[Profile] Error reading password directly:", e);
          if (savedPassword) {
            setDbPassword(savedPassword);
          }
        }
      };
      loadPasswordDirectly();
    }
  }, [profileModalOpen, savedPassword]);

  const fetchScheduledNotifications = async () => {
    try {
      if (Platform.OS !== 'web') {
        const list = await Notifications.getAllScheduledNotificationsAsync();
        setScheduledNotifs(list);
      }
    } catch (e) {
      console.warn("Failed to fetch scheduled notifications:", e);
    }
  };

  useEffect(() => {
    if (notifModalOpen) {
      fetchScheduledNotifications();
    }
  }, [notifModalOpen]);

  const handleTestAlert = async () => {
    fireHaptic('medium');
    if (Platform.OS === 'web') {
      Alert.alert("Web Platform", "Notifications are skipped on Web.");
      return;
    }
    // Schedule a notification in 2 seconds
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Smart Alert ⚡",
        body: "Your ZenForge Notification system is working flawlessly!",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
    Alert.alert("Success 🎉", "Test notification scheduled! Close the app or stay on this page; it will trigger in 2 seconds.");
    setTimeout(fetchScheduledNotifications, 2500); // refresh list
  };

  const handleClearNotifications = async () => {
    fireHaptic('heavy');
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert("Success 🗑️", "All scheduled notifications cancelled successfully.");
    fetchScheduledNotifications();
  };

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

  const displayTasks = tasks
    .filter((t: any) => {
      if (activeChip === 'Focus') return true; // Focus acts as the default 'Show All' view
      return (t.category || 'General').toLowerCase() === activeChip.toLowerCase();
    })
    .map((t: any) => ({
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
              <Text style={s.greet}>{getGreeting()}, {user?.fullName || 'Productivity Warrior'} 👋🏽</Text>
              <Text style={s.hero}>Hello,</Text>
              <Text style={s.heroSub}>Stay focused and finish strong.</Text>
            </View>
            <View style={{ gap: 10, alignItems: 'center' }}>
              <Pressable style={s.iconBtn} onPress={() => { fireHaptic('medium'); setNotifModalOpen(true); }}>
                <Ionicons name="notifications-outline" size={19} color={P.dim} />
                <View style={s.notifDot} />
              </Pressable>
              <Pressable onPress={() => { fireHaptic('medium'); setProfileModalOpen(true); setShowPassword(false); }}>
                <LinearGradient colors={[P.blue, P.blue2]} style={s.avatar}>
                  <Text style={s.avatarTxt}>
                    {user?.fullName ? user.fullName.trim()[0].toUpperCase() : 'P'}
                  </Text>
                </LinearGradient>
              </Pressable>
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
          <View style={{ marginBottom: 26 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
              {CHIPS.map((c, i) => {
                const active = c === activeChip;
                return (
                  <Pressable key={c} onPress={() => { fireHaptic('medium'); setChip(c); }}>
                    <View style={active ? s.chipActive : s.chip}>
                      {active && <BlurView intensity={getBlurIntensity(40)} tint="dark" style={StyleSheet.absoluteFill} />}
                      {active && <LinearGradient colors={[P.blue, P.blue2]} style={StyleSheet.absoluteFill} />}
                      <Text style={active ? s.chipTxtActive : s.chipTxt}>{c}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </FadeUp>

        {/* ── Progress section label ───────────────────────── */}
        <FadeUp delay={230}>
          <Text style={s.sectionLabel}>Progress</Text>
        </FadeUp>

        {/* ── Stats row ───────────────────────────────────── */}
        <FadeUp delay={270}>
          {!minimalMode && (
            <View style={s.statsRow}>
              <StatCard
                label="PRODUCTIVITY"
                value={productivityPercentage}
                color={P.blue}
                chart={weeklyProductivityTrend}
              />
              <View style={{ width: 14 }} />
              <StatCard
                label="FOCUS TIME"
                value={totalFocusHours}
                subValue={`Today: ${todayFocusMinutes}m`}
                color={P.purple}
                chart={weeklyFocusTrend}
                isFloat={true}
              />
            </View>
          )}
        </FadeUp>

        {/* Progress bar */}
        <FadeUp delay={310}>
          <View style={s.progressCard}>
            <BlurView intensity={getBlurIntensity(22)} tint="dark" style={StyleSheet.absoluteFill} />
            
            {productivityPercentage === 100 && (
              <Animated.View style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: P.blue,
                  shadowColor: P.blue,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                },
                animGlowStyle
              ]} pointerEvents="none" />
            )}

            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={s.progressTrack}>
                <Animated.View style={[{ height: '100%' }, animProgressStyle]}>
                  <LinearGradient
                    colors={[P.blue2, P.blue]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </View>
            <AnimatedCounter value={productivityPercentage} suffix="%" style={s.progressPct} />
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

      {/* ── Notification Center Modal ── */}
      <Modal
        visible={notifModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotifModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setNotifModalOpen(false)}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>

          <View style={s.modalSheet}>
            <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={s.modalHeader}>
              <View style={s.modalHandle} />
            </View>

            <View style={s.modalTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="notifications" size={24} color="#87C4FF" />
                <Text style={s.modalTitle}>Notification Center</Text>
              </View>
              <Pressable style={s.modalCloseBtn} onPress={() => setNotifModalOpen(false)}>
                <Ionicons name="close" size={20} color={P.white} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Notification Status Banner */}
              <View style={s.statusBanner}>
                <Ionicons name="sparkles" size={16} color="#4ECDC4" style={{ marginTop: 1 }} />
                <Text style={s.statusBannerTxt}>
                  Showing active system alarms & scheduled task alerts synced with Apple/Android OS.
                </Text>
              </View>

              <Text style={s.sectionLabel}>Active Reminders ({scheduledNotifs.length})</Text>

              {scheduledNotifs.length === 0 ? (
                <View style={s.emptyNotifCard}>
                  <Ionicons name="notifications-off-outline" size={32} color={P.dimmer} />
                  <Text style={s.emptyNotifTitle}>Quiet Sanctuary</Text>
                  <Text style={s.emptyNotifSub}>No repeating alarms are scheduled right now. Add tasks with high or medium priority to trigger reminders!</Text>
                </View>
              ) : (
                scheduledNotifs.map((n, idx) => {
                  const title = n.content?.title || "System Alert";
                  const body = n.content?.body || "";
                  const seconds = n.trigger?.seconds;
                  
                  return (
                    <View key={n.identifier || idx} style={s.notifCard}>
                      <View style={s.notifCardIcon}>
                        <Ionicons name="alarm-outline" size={18} color="#FF6B6B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.notifCardTitle}>{title}</Text>
                        <Text style={s.notifCardBody}>{body}</Text>
                        {seconds && (
                          <Text style={s.notifCardMeta}>
                            Interval: Every {seconds >= 3600 ? `${seconds / 3600} hours` : `${seconds / 60} mins`}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              {/* Action row */}
              <View style={{ gap: 12, marginTop: 24 }}>
                <Pressable style={s.testBtn} onPress={handleTestAlert}>
                  <LinearGradient colors={['rgba(135,196,255,0.22)', 'rgba(43,107,255,0.12)']} style={StyleSheet.absoluteFill} />
                  <Ionicons name="flash" size={16} color="#87C4FF" />
                  <Text style={s.testBtnTxt}>Trigger 2s Test Smart Alert ⚡</Text>
                </Pressable>

                {scheduledNotifs.length > 0 && (
                  <Pressable style={s.clearBtn} onPress={handleClearNotifications}>
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    <Text style={s.clearBtnTxt}>Cancel All Scheduled Reminders</Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Profile Modal Sheet ───────────────────────────── */}
      <Modal
        transparent
        visible={profileModalOpen}
        animationType="slide"
        onRequestClose={() => setProfileModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setProfileModalOpen(false)}>
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>
          <Animated.View style={[s.modalSheet, { height: 420 }]}>
            <BlurView intensity={getBlurIntensity(80)} tint="dark" style={StyleSheet.absoluteFill} />
            
            {/* Handle */}
            <View style={s.modalHeader}>
              <View style={s.modalHandle} />
            </View>

            {/* Title */}
            <View style={s.modalTitleRow}>
              <Text style={s.modalTitle}>User Profile</Text>
              <Pressable style={s.modalCloseBtn} onPress={() => setProfileModalOpen(false)}>
                <Ionicons name="close" size={18} color={P.white} />
              </Pressable>
            </View>

            <View style={s.modalScroll}>
              {/* Big Avatar */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <LinearGradient colors={[P.blue, P.blue2]} style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 28, fontWeight: '800', color: P.white }}>
                    {user?.fullName ? user.fullName.trim()[0].toUpperCase() : 'P'}
                  </Text>
                </LinearGradient>
                <Text style={{ fontSize: 20, fontWeight: '800', color: P.white }}>{user?.fullName || 'Productivity Warrior'}</Text>
                <Text style={{ fontSize: 13, color: P.dim, marginTop: 4 }}>{user?.email || 'No email'}</Text>
              </View>

              {/* Details */}
              <View style={{ gap: 14, marginBottom: 28 }}>
                {/* Name Row */}
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Full Name</Text>
                  <Text style={s.detailValue}>{user?.fullName || 'Productivity Warrior'}</Text>
                </View>

                {/* Email Row */}
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Email Address</Text>
                  <Text style={s.detailValue}>{user?.email || ''}</Text>
                </View>

                {/* Password Row */}
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Password</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={s.detailValue}>
                      {showPassword ? (dbPassword || savedPassword || 'Log in again to view') : '••••••••'}
                    </Text>
                    <Pressable onPress={() => { 
                      fireHaptic('light'); 
                      const next = !showPassword;
                      console.log("👁️ [Profile Modal] Toggle pressed. Next state:", next, "savedPassword value:", savedPassword, "dbPassword:", dbPassword);
                      setShowPassword(next); 
                    }}>
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={18} 
                        color={P.blue} 
                      />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Logout Button */}
              <Pressable 
                onPress={async () => {
                  fireHaptic('heavy');
                  setProfileModalOpen(false);
                  setDbPassword(null);
                  await logout();
                }}
                style={s.logoutBtn}
              >
                <Ionicons name="log-out-outline" size={16} color="#FF6B6B" />
                <Text style={s.logoutBtnTxt}>Sign Out</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}


