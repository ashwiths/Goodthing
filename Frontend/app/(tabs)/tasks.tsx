/**
 * app/(tabs)/tasks.tsx  ·  To|Do — Premium Tasks Page
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SectionList, Pressable,
  Dimensions, StatusBar, Platform, ScrollView, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  withDelay, withSpring, useAnimatedProps,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import { CinematicBackground } from '../../components/CinematicBackground';
import { useAppTheme } from '../../hooks/useAppTheme';
import { fireHaptic, fireSuccessHaptic } from '../../utils/haptics';
import { useTaskStore } from '../../src/store/taskStore';
import { ActivityIndicator } from 'react-native';

const { width: W } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Data ────────────────────────────────────────────────────────────────────
type Priority = 'High' | 'Medium' | 'Low';

type TaskItem = {
  id: string; title: string; desc: string; time: string; priority: Priority; completed: boolean;
};

type TaskSection = {
  title: string; data: TaskItem[];
};



const FILTERS = ['All', 'Pending', 'Completed', 'High Priority'];

// ─── FadeUp wrapper ───────────────────────────────────────────────────────────
function FadeUp({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(22);
  useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Progress Ring Card ───────────────────────────────────────────────────────
function ProgressRingCard({ total, completed }: { total: number; completed: number }) {
  const { P, getBlurIntensity } = useAppTheme();
  const pr = React.useMemo(() => StyleSheet.create({
    card: {
      borderRadius: 24, padding: 22, marginBottom: 24, overflow: 'hidden',
      borderWidth: 1, borderColor: P.border,
      backgroundColor: 'rgba(14,7,28,0.4)',
    },
    glowBg: {
      position: 'absolute', top: -40, right: -40, width: 140, height: 140,
      borderRadius: 70, backgroundColor: P.blue, opacity: 0.12,
    },
    content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    textCol: { flex: 1, paddingRight: 20 },
    title: { fontSize: 28, fontWeight: '800', color: P.white, letterSpacing: -0.5, marginBottom: 6 },
    sub: { fontSize: 13, color: P.dimmer, fontWeight: '500' },
    ringWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
    ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  }), [P]);

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const progressVal = useSharedValue(0);
  
  useEffect(() => {
    progressVal.value = withDelay(400, withSpring(pct / 100, { damping: 15, stiffness: 60 }));
  }, [pct]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - progressVal.value * circumference;
    return { strokeDashoffset };
  });

  return (
    <View style={pr.card}>
      <BlurView intensity={getBlurIntensity(35)} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={pr.glowBg} />
      
      <View style={pr.content}>
        <View style={pr.textCol}>
          <Text style={pr.title}>{pct}% Complete</Text>
          <Text style={pr.sub}>{completed} of {total} tasks done</Text>
        </View>
        
        <View style={pr.ringWrap}>
          <Svg width={size} height={size}>
            <Defs>
              <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={P.blue} stopOpacity="1" />
                <Stop offset="1" stopColor={P.blue2} stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Circle stroke="rgba(255,255,255,0.06)" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
            <AnimatedCircle
              stroke="url(#grad)" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
              strokeDasharray={circumference} animatedProps={animatedProps}
              strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={pr.ringCenter}>
            <Ionicons name="trophy" size={26} color={P.blue} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Task Item ────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete }: { task: TaskItem; onToggle: () => void; onDelete: () => void }) {
  const { P, getBlurIntensity, getGlowStyles } = useAppTheme();
  
  const getPriColor = (pri: Priority) => {
    if (pri === 'High') return P.high;
    if (pri === 'Medium') return P.medium;
    return P.low;
  };

  const tr = React.useMemo(() => StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, marginBottom: 14,
      borderWidth: 1, borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)',
    },
    cbx: {
      width: 28, height: 28, borderRadius: 9, borderWidth: 1.5, borderColor: P.dimmer,
      alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: 'rgba(255,255,255,0.02)',
    },
    info: { flex: 1, gap: 5 },
    title: { fontSize: 16, fontWeight: '700', color: P.white, letterSpacing: -0.2 },
    desc:  { fontSize: 13, color: P.dim, lineHeight: 18 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    metaWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaTxt: { fontSize: 12, fontWeight: '600', color: P.dimmer },
    priDot: { width: 6, height: 6, borderRadius: 3 },
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

  const priColor = getPriColor(task.priority);

  return (
    <Animated.View style={animCard}>
      <View style={tr.card}>
        <BlurView intensity={getBlurIntensity(25)} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Left priority bar indicator */}
        <View style={[{ position: 'absolute', left: 0, top: 20, bottom: 20, width: 3, borderRadius: 2, backgroundColor: priColor, opacity: task.completed ? 0.3 : 1 }]} />

        {/* Task description & Checkbox Pressable */}
        <Pressable 
          onPressIn={onPressIn} 
          onPressOut={onPressOut} 
          onPress={handlePress} 
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={tr.cbx}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: P.blue, borderRadius: 7, ...getGlowStyles(0.3, 10) }, animCheck]} />
            <Animated.View style={animCheck}>
              <Ionicons name="checkmark" size={18} color={P.bg} />
            </Animated.View>
          </View>

          <View style={[tr.info, { paddingRight: 8 }]}>
            <Text style={[tr.title, task.completed && { textDecorationLine: 'line-through', color: P.dim }]}>{task.title}</Text>
            <Text style={tr.desc} numberOfLines={2}>{task.desc}</Text>
            <View style={tr.bottomRow}>
              <View style={tr.metaWrap}>
                <Ionicons name="time-outline" size={13} color={P.dimmer} />
                <Text style={tr.metaTxt}>{task.time}</Text>
              </View>
              <View style={tr.metaWrap}>
                <View style={[tr.priDot, { backgroundColor: priColor }]} />
                <Text style={tr.metaTxt}>{task.priority}</Text>
              </View>
            </View>
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
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
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

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity, minimalMode } = useAppTheme();
  const { tasks, fetchTasks, loading, updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const [filter, setFilter]     = useState('All');

  const s = React.useMemo(() => StyleSheet.create({
    root:   { flex: 1, backgroundColor: P.bg },
    scroll: { paddingHorizontal: 22 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    pageTitle: { fontSize: 32, fontWeight: '800', color: P.white, letterSpacing: -0.5 },
    pageSub:   { fontSize: 14, color: P.dimmer, fontWeight: '500', marginTop: 4 },
    addBtn: {
      width: 44, height: 44, borderRadius: 14, overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: P.borderSub,
      backgroundColor: 'rgba(255,255,255,0.04)'
    },
    filterActive: {
      paddingHorizontal: 16,
      paddingVertical: 8,
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
    filterBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden'
    },
    filterTxtActive: { fontSize: 13, fontWeight: '700', color: P.white },
    filterTxt:       { fontSize: 13, fontWeight: '600', color: P.dimmer },
    secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 10 },
    secTitle:  { fontSize: 16, fontWeight: '700', color: P.white, letterSpacing: 0.3 },
    secLine:   { flex: 1, height: 1, backgroundColor: P.borderSub },
  }), [P]);

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t: any) => t._id === taskId);
    if (task) {
      fireHaptic('light');
      await updateTask(task._id, { completed: !task.completed });
    }
  };

  const handleDeleteTask = async (id: string) => {
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

  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter((t: any) => t.completed).length;

  // Group tasks dynamically
  const grouped = tasks.reduce((acc: any, t: any) => {
    const cat = t.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({
      id: t._id,
      title: t.title,
      desc: t.description || 'No description',
      time: t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Today',
      priority: t.priority || 'Medium',
      completed: t.completed,
    });
    return acc;
  }, {});

  const dynamicSections: TaskSection[] = Object.keys(grouped).map(key => ({
    title: key,
    data: grouped[key]
  }));

  // Apply filters
  const filteredSections = dynamicSections.map(sec => {
    const filteredData = sec.data.filter((t: any) => {
      if (filter === 'Pending') return !t.completed;
      if (filter === 'Completed') return t.completed;
      if (filter === 'High Priority') return t.priority === 'High';
      return true; // 'All'
    });
    return { ...sec, data: filteredData };
  }).filter(sec => sec.data.length > 0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <CinematicBackground particleCount={30} showScanLine={false} />

      <SectionList
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: 100 }]}
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        
        ListHeaderComponent={
          <>
            <FadeUp delay={100}>
              <View style={s.header}>
                <View>
                  <Text style={s.pageTitle}>Tasks</Text>
                  <Text style={s.pageSub}>Organize your day.</Text>
                </View>
                <Pressable style={s.addBtn} onPress={() => { fireHaptic('medium'); router.push('/add-task'); }}>
                  <BlurView intensity={getBlurIntensity(40)} tint="dark" style={StyleSheet.absoluteFill} />
                  <Ionicons name="add" size={22} color={P.blue} />
                </Pressable>
              </View>
            </FadeUp>

            {!minimalMode && (
              <FadeUp delay={150}>
                <ProgressRingCard total={totalTasks} completed={doneTasks} />
              </FadeUp>
            )}

            <FadeUp delay={200}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28, overflow: 'visible' }}>
                {FILTERS.map(f => {
                  const active = filter === f;
                  return (
                    <Pressable key={f} onPress={() => { fireHaptic('light'); setFilter(f); }} style={{ marginRight: 10 }}>
                      <View style={active ? s.filterActive : s.filterBtn}>
                        {active && <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />}
                        {active && <LinearGradient colors={[P.blue + '30', 'transparent']} style={StyleSheet.absoluteFill} />}
                        <Text style={active ? s.filterTxtActive : s.filterTxt}>{f}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </FadeUp>
          </>
        }

        renderSectionHeader={({ section }) => (
          <FadeUp delay={250}>
            <View style={s.secHeader}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: P.blue }} />
              <Text style={s.secTitle}>{section.title}</Text>
              <View style={s.secLine} />
            </View>
          </FadeUp>
        )}

        renderItem={({ item, index }) => (
          <FadeUp delay={300 + (index * 50)}>
            <TaskRow task={item} onToggle={() => toggleTask(item.id)} onDelete={() => handleDeleteTask(item.id)} />
          </FadeUp>
        )}
        ListEmptyComponent={loading ? <LoadingState /> : <EmptyState />}
      />
    </View>
  );
}
