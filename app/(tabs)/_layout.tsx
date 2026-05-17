import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/hooks/useTheme';
import { DARK } from '../../src/constants/colors';

function TabIcon({ icon, label, focused, color }: {
  icon: string; label: string; focused: boolean; color: string;
}) {
  return (
    <View style={[styles.tabItem, focused && { gap: 2 }]}>
      <Text style={[styles.tabIcon, focused && { textShadowColor: color, textShadowRadius: 10 }]}>
        {icon}
      </Text>
      {focused && (
        <View style={[styles.activeDot, { backgroundColor: color }]} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { primary } = useTheme();

  const TAB_CONFIG = [
    { name: 'index',   icon: '🏠', label: 'Home'    },
    { name: 'habits',  icon: '✅', label: 'Habits'  },
    { name: 'focus',   icon: '🎯', label: 'Focus'   },
    { name: 'mood',    icon: '💭', label: 'Mood'    },
    { name: 'profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle:    styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor:   primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <TabIcon icon={tab.icon} label={tab.label} focused={focused} color={color} />
            ),
          }}
        />
      ))}
      {/* Hide non-tab screens from tab bar */}
      <Tabs.Screen name="journal"  options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position:        'absolute',
    borderTopWidth:   1,
    borderTopColor:  'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(10,10,20,0.8)',
    height:           70,
    paddingBottom:    10,
    elevation:        0,
  },
  tabItem: {
    alignItems: 'center', justifyContent: 'center', gap: 0,
  },
  tabIcon: {
    fontSize: 24,
  },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
  },
});
