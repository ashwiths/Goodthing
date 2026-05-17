import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { name: 'index',     label: 'Home',      icon: 'home-outline',      iconActive: 'home'      },
  { name: 'tasks',     label: 'Tasks',     icon: 'list-outline',      iconActive: 'list'      },
  { name: 'calendar',  label: 'Calendar',  icon: 'calendar-outline',  iconActive: 'calendar'  },
  { name: 'analytics', label: 'Stats',     icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { name: 'settings',  label: 'Settings',  icon: 'settings-outline',  iconActive: 'settings'  },
];

function TabButton({ tab, isFocused, onPress }: { tab: TabItem; isFocused: boolean; onPress: () => void }) {
  const sc = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));

  return (
    <Pressable
      onPressIn={() => { sc.value = withSpring(0.88, { damping: 12 }); }}
      onPressOut={() => { sc.value = withSpring(1.0, { damping: 12 }); }}
      onPress={onPress}
      style={tb.item}
    >
      <Animated.View style={[tb.inner, animated]}>
        {isFocused ? (
          <LinearGradient colors={['rgba(79,165,255,0.22)', 'rgba(43,107,255,0.12)']} style={tb.activeWrap}>
            <Ionicons name={tab.iconActive} size={21} color="#87C4FF" />
          </LinearGradient>
        ) : (
          <View style={tb.idleWrap}>
            <Ionicons name={tab.icon} size={21} color="rgba(255,255,255,0.28)" />
          </View>
        )}
        <Text style={[tb.label, isFocused && tb.labelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function FloatingTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tb.outerWrap, { paddingBottom: insets.bottom + 6 }]}>
      {/* Outer glow */}
      <View style={tb.outerGlow} />
      <BlurView intensity={55} tint="dark" style={tb.blur}>
        {/* Top shine line */}
        <View style={tb.shine} />
        <View style={tb.row}>
          {TABS.map((tab, i) => (
            <TabButton
              key={tab.name}
              tab={tab}
              isFocused={state.index === i}
              onPress={() => navigation.navigate(tab.name)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

const tb = StyleSheet.create({
  outerWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingTop: 10,
  },
  outerGlow: {
    position: 'absolute', bottom: 0, left: 40, right: 40, height: 1,
    backgroundColor: 'rgba(79,165,255,0.22)',
    shadowColor: '#4FA5FF', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4, shadowRadius: 20,
  },
  blur: {
    borderRadius: 30, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(79,165,255,0.16)',
    backgroundColor: 'rgba(6,4,16,0.45)',
  },
  shine: {
    position: 'absolute', top: 0, left: 32, right: 32, height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  row: { flexDirection: 'row', paddingTop: 10, paddingBottom: 6, paddingHorizontal: 4 },
  item: { flex: 1, alignItems: 'center' },
  inner: { alignItems: 'center', gap: 4 },
  activeWrap: { width: 44, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(79,165,255,0.25)' },
  idleWrap:   { width: 44, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label:      { fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
  labelActive:{ color: '#87C4FF', fontWeight: '700' },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
