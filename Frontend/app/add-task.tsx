/**
 * app/add-task.tsx  ·  To|Do — Premium Add Task Flow
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  interpolateColor, interpolate, Easing, withRepeat, withSequence, FadeInUp
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CinematicBackground } from '../components/CinematicBackground';

import { useAppTheme } from '../hooks/useAppTheme';
import { fireHaptic, fireSuccessHaptic } from '../utils/haptics';
import { useTaskStore } from '../src/store/taskStore';
import { scheduleTaskReminderOneShot } from '../src/services/notificationService';

const CATEGORIES = ['Study', 'Health', 'Personal', 'Work', 'Focus'];
const PRIORITIES = ['Low', 'Medium', 'High'] as const;
type Priority = typeof PRIORITIES[number];

// ─── Animated Toggle ─────────────────────────────────────────────────────────
function GlassToggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { P } = useAppTheme();
  const progress = useSharedValue(value ? 1 : 0);
  
  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 14, stiffness: 90 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(255,255,255,0.1)', P.blue + '4D']),
    borderColor: interpolateColor(progress.value, [0, 1], ['rgba(255,255,255,0.15)', P.blue]),
  }));
  
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [2, 22]) }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [P.dim, P.white]),
  }));

  return (
    <Pressable onPress={() => { fireHaptic('light'); onValueChange(!value); }}>
      <Animated.View style={[tog.track, trackStyle]}>
        <Animated.View style={[tog.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const tog = StyleSheet.create({
  track: { width: 48, height: 28, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
});

// ─── Input with Focus Animation ─────────────────────────────────────────────
function GlassInput({
  value, onChangeText, placeholder, multiline = false, height = 64, autoFocus = false
}: {
  value: string; onChangeText: (s: string) => void; placeholder: string; multiline?: boolean; height?: number; autoFocus?: boolean;
}) {
  const { P, getBlurIntensity, getGlowStyles } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusVal = useSharedValue(0);

  useEffect(() => {
    focusVal.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
  }, [isFocused]);

  const wrapStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusVal.value, [0, 1], [P.border, P.blue]),
    shadowOpacity: interpolate(focusVal.value, [0, 1], [0.1, 0.4]),
  }));

  return (
    <Animated.View style={[inp.wrap, { height, backgroundColor: 'rgba(10,18,34,0.4)', shadowColor: P.blue, elevation: 6 }, wrapStyle]}>
      <BlurView intensity={getBlurIntensity(65)} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={inp.shine} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
        style={[inp.input, { color: P.white }, multiline && inp.multiline]}
        multiline={multiline}
        autoFocus={autoFocus}
        keyboardAppearance="dark"
      />
    </Animated.View>
  );
}

const inp = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  shine: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, fontSize: 16, fontWeight: '500', paddingHorizontal: 20 },
  multiline: { paddingTop: 20, paddingBottom: 20, textAlignVertical: 'top' },
});

// ─── Live Preview Card ────────────────────────────────────────────────────────
function LivePreviewCard({ title, category, priority }: { title: string; category: string; priority: Priority }) {
  const { P, getBlurIntensity } = useAppTheme();
  const badgeColor = priority === 'High' ? P.high : priority === 'Medium' ? P.medium : P.low;

  return (
    <View style={[tc.card, { borderColor: P.borderSub, backgroundColor: 'rgba(10,18,34,0.4)' }]}>
      <BlurView intensity={getBlurIntensity(55)} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[tc.accentBar, { backgroundColor: P.blue }]} />

      <View style={[tc.circle, { borderColor: P.dimmer, backgroundColor: 'rgba(255,255,255,0.04)' }]}>
        <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.1)" />
      </View>

      <View style={tc.body}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={[tc.title, { color: P.white }, !title && { color: P.dimmer }]} numberOfLines={1}>
            {title || 'Task preview...'}
          </Text>
          <View style={[tc.badge, { backgroundColor: badgeColor + '20', borderColor: badgeColor + '40' }]}>
            <Text style={[tc.badgeTxt, { color: badgeColor }]}>{priority}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="calendar-outline" size={12} color={P.dim} />
            <Text style={[tc.subTxt, { color: P.dim }]}>Today</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="folder-outline" size={12} color={P.dim} />
            <Text style={[tc.subTxt, { color: P.dim }]}>{category}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const tc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, overflow: 'hidden', borderWidth: 1, marginBottom: 20 },
  accentBar: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: 2 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginRight: 14 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  subTxt: { fontSize: 12, fontWeight: '500' },
});

// ─── Floating Create Button ───────────────────────────────────────────────────
function CreateButton({ onPress, disabled, loading }: { onPress: () => void; disabled: boolean; loading: boolean }) {
  const { P, getBlurIntensity, getGlowStyles } = useAppTheme();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!disabled && !loading) {
      pulse.value = withRepeat(withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ), -1, true);
    } else {
      pulse.value = withTiming(1);
    }
  }, [disabled, loading]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: (disabled || loading) ? 0.5 : 1,
  }));

  return (
    <Animated.View style={[cb.wrap, style]}>
      <Pressable onPress={onPress} disabled={disabled || loading} style={[cb.btn, { backgroundColor: P.blue, ...getGlowStyles(0.5, 20) }]}>
        <Text style={[cb.txt, { color: P.bg }]}>{loading ? "Creating Task..." : "Create Task"}</Text>
        {!loading && <Ionicons name="arrow-forward" size={18} color={P.bg} style={{ marginLeft: 6 }} />}
      </Pressable>
    </Animated.View>
  );
}

const cb = StyleSheet.create({
  wrap: { marginTop: 40, marginBottom: 40, alignItems: 'center' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 28, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  txt: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const { P, getBlurIntensity } = useAppTheme();
  const { createTask, loading } = useTaskStore();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [reminder, setReminder] = useState(true);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Task title cannot be empty.');
      return;
    }

    let reminderTime = undefined;
    let dueDate = undefined;

    if (reminder) {
      // Set default reminderTime to tomorrow at 9:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      reminderTime = tomorrow;

      // Set default dueDate to tomorrow at 11:59 PM
      const endOfTomorrow = new Date();
      endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
      endOfTomorrow.setHours(23, 59, 59, 999);
      dueDate = endOfTomorrow;
    }

    const taskData = {
      title: title.trim(),
      description: desc.trim(),
      priority,
      category,
      reminderTime,
      dueDate,
    };

    const res = await createTask(taskData);
    if (res.success) {
      if (reminder) {
        // Trigger an instant notification immediately to confirm everything is working!
        await scheduleTaskReminderOneShot(
          "Task Created 🚀",
          `Smart reminder is active for: ${title.trim()}`,
          1
        );
      }
      fireSuccessHaptic();
      router.back();
    } else {
      Alert.alert('Error', res.message || 'Failed to create task.');
    }
  };

  const s = React.useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: P.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 24, zIndex: 10 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: P.borderSub },
    headerTitle: { fontSize: 16, fontWeight: '700', color: P.white, letterSpacing: 0.5 },
    scroll: { paddingHorizontal: 22 },
  
    // Section
    section: { marginBottom: 32 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: P.dim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  
    // Chips
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: P.borderSub },
    chipActive: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: P.blue },
    chipTxt: { fontSize: 14, fontWeight: '600', color: P.dimmer },
    chipTxtActive: { fontSize: 14, fontWeight: '700', color: P.white },
  
    // Options Row
    optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: P.borderSub },
    optLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    optTitle: { fontSize: 16, fontWeight: '600', color: P.white },
    optSub: { fontSize: 13, color: P.dim, marginTop: 2 },
  }), [P]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <CinematicBackground particleCount={15} showScanLine={false} />

      {/* Header */}
      <View style={[s.header, { marginTop: insets.top + 10 }]}>
        <Pressable style={s.closeBtn} onPress={() => { fireHaptic('light'); router.back(); }}>
          <BlurView intensity={getBlurIntensity(20)} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="close" size={20} color={P.white} />
        </Pressable>
        <Text style={s.headerTitle}>New Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Preview */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <Text style={s.sectionLabel}>Live Preview</Text>
          <LivePreviewCard title={title} category={category} priority={priority} />
        </Animated.View>

        {/* Input Details */}
        <Animated.View entering={FadeInUp.delay(150).springify()} style={s.section}>
          <Text style={s.sectionLabel}>Task Details</Text>
          <View style={{ gap: 16 }}>
            <GlassInput value={title} onChangeText={setTitle} placeholder="What needs to be done?" autoFocus />
            <GlassInput value={desc} onChangeText={setDesc} placeholder="Add a note or description..." multiline height={100} />
          </View>
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={s.section}>
          <Text style={s.sectionLabel}>Category</Text>
          <View style={s.chipsWrap}>
            {CATEGORIES.map(c => {
              const active = category === c;
              return (
                <Pressable key={c} onPress={() => { fireHaptic('light'); setCategory(c); }}>
                  <View style={active ? s.chipActive : s.chip}>
                    {active && <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />}
                    {active && <LinearGradient colors={[P.blue + '40', 'transparent']} style={StyleSheet.absoluteFill} />}
                    <Text style={active ? s.chipTxtActive : s.chipTxt}>{c}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Priority */}
        <Animated.View entering={FadeInUp.delay(250).springify()} style={s.section}>
          <Text style={s.sectionLabel}>Priority</Text>
          <View style={s.chipsWrap}>
            {PRIORITIES.map(p => {
              const active = priority === p;
              const color = p === 'High' ? P.high : p === 'Medium' ? P.medium : P.low;
              return (
                <Pressable key={p} onPress={() => { fireHaptic('light'); setPriority(p); }}>
                  <View style={[active ? s.chipActive : s.chip, active && { borderColor: color }]}>
                    {active && <BlurView intensity={getBlurIntensity(30)} tint="dark" style={StyleSheet.absoluteFill} />}
                    {active && <LinearGradient colors={[color + '40', 'transparent']} style={StyleSheet.absoluteFill} />}
                    <Text style={[active ? s.chipTxtActive : s.chipTxt, active && { color }]}>{p}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Reminder Toggle */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={s.section}>
          <View style={s.optRow}>
            <View style={s.optLeft}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: P.purple + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="notifications" size={20} color={P.purple} />
              </View>
              <View>
                <Text style={s.optTitle}>Smart Reminder</Text>
                <Text style={s.optSub}>Notify me when it's time</Text>
              </View>
            </View>
            <GlassToggle value={reminder} onValueChange={setReminder} />
          </View>
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInUp.delay(350).springify()}>
          <CreateButton onPress={handleCreate} disabled={!title.trim()} loading={loading} />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
