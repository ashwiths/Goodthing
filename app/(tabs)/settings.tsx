import React from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '../../src/stores/userStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useTheme } from '../../src/hooks/useTheme';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientHeader } from '../../src/components/ui/GradientHeader';
import { SettingsRow } from '../../src/components/settings/SettingsRow';
import { Toggle } from '../../src/components/ui/Toggle';
import { ThemePicker } from '../../src/components/settings/ThemePicker';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { ParticleBackground } from '../../src/components/particles/ParticleBackground';
import { DARK, TEXT } from '../../src/constants/colors';
import { storageClear } from '../../src/utils/storage';

export default function SettingsScreen() {
  const { primary } = useTheme();
  const { prefs, updatePrefs, refreshMissions } = useUserStore();
  const { appLockEnabled, enableAppLock, disableAppLock, completeOnboarding } = useAuthStore();

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will erase all your habits, journal entries, focus sessions, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await storageClear();
            Alert.alert('Data Reset', 'All data has been cleared. Please restart the app.');
          },
        },
      ]
    );
  };

  const handleAppLock = () => {
    if (appLockEnabled) {
      disableAppLock();
    } else {
      Alert.prompt(
        'Set PIN', 'Enter a 4-digit PIN:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set', onPress: (pin?: string) => {
            if (pin && pin.length === 4 && /^\d{4}$/.test(pin)) {
              enableAppLock(pin);
              updatePrefs({ appLockEnabled: true });
            } else {
              Alert.alert('Invalid PIN', 'Please enter exactly 4 digits.');
            }
          }},
        ],
        'secure-text'
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface, DARK.bg]} style={StyleSheet.absoluteFill} />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <GradientHeader title="Settings" />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Appearance */}
          <Animated.View entering={FadeInDown.delay(0)}>
            <Text style={styles.sectionLabel}>APPEARANCE</Text>
            <GlassCard gradient padding={16}>
              <ThemePicker />
            </GlassCard>
          </Animated.View>

          {/* Preferences */}
          <Animated.View entering={FadeInDown.delay(60)}>
            <Text style={styles.sectionLabel}>PREFERENCES</Text>
            <GlassCard padding={4}>
              <SettingsRow
                icon="🔔" label="Notifications"
                right={<Toggle value={prefs.notifications} onChange={(v) => updatePrefs({ notifications: v })} />}
              />
              <SettingsRow
                icon="📳" label="Haptic Feedback"
                right={<Toggle value={prefs.haptics} onChange={(v) => updatePrefs({ haptics: v })} />}
              />
              <SettingsRow
                icon="🔊" label="Sound Effects"
                right={<Toggle value={prefs.soundEnabled} onChange={(v) => updatePrefs({ soundEnabled: v })} />}
              />
            </GlassCard>
          </Animated.View>

          {/* Focus settings */}
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={styles.sectionLabel}>FOCUS TIMER</Text>
            <GlassCard padding={4}>
              <SettingsRow icon="⏱"  label="Focus Duration"     value="25 min" onPress={() => Alert.alert('Coming Soon', 'Custom durations in Phase 2')} />
              <SettingsRow icon="☕" label="Short Break"         value="5 min"  onPress={() => Alert.alert('Coming Soon', 'Custom durations in Phase 2')} />
              <SettingsRow icon="🌙" label="Long Break"          value="15 min" onPress={() => Alert.alert('Coming Soon', 'Custom durations in Phase 2')} />
              <SettingsRow icon="🔄" label="Sessions Before Long" value="4"    onPress={() => Alert.alert('Coming Soon', 'Custom durations in Phase 2')} />
            </GlassCard>
          </Animated.View>

          {/* Security */}
          <Animated.View entering={FadeInDown.delay(140)}>
            <Text style={styles.sectionLabel}>SECURITY</Text>
            <GlassCard padding={4}>
              <SettingsRow
                icon="🔐" label="App Lock"
                right={<Toggle value={appLockEnabled} onChange={handleAppLock} />}
              />
              <SettingsRow
                icon="🧬" label="Biometrics"
                right={<Toggle value={prefs.biometricsEnabled} onChange={(v) => updatePrefs({ biometricsEnabled: v })} />}
              />
            </GlassCard>
          </Animated.View>

          {/* Data */}
          <Animated.View entering={FadeInDown.delay(180)}>
            <Text style={styles.sectionLabel}>DATA</Text>
            <GlassCard padding={4}>
              <SettingsRow icon="♻️" label="Refresh Daily Missions" onPress={refreshMissions} />
              <SettingsRow icon="📤" label="Export Data (Phase 2)"  onPress={() => Alert.alert('Coming Soon', 'Export in Phase 2')} />
              <SettingsRow icon="📥" label="Restore Backup"         onPress={() => Alert.alert('Coming Soon', 'Restore in Phase 2')} />
            </GlassCard>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <GlassCard padding={4}>
              <SettingsRow icon="⚡" label="ZenForge"          value="v1.0.0" />
              <SettingsRow icon="📖" label="Expo SDK"          value="54"     />
              <SettingsRow icon="🌐" label="zenforge.app"      onPress={() => Alert.alert('ZenForge', 'Your Productivity Universe.')} />
            </GlassCard>
          </Animated.View>

          {/* Danger zone */}
          <Animated.View entering={FadeInDown.delay(240)}>
            <NeonButton
              label="🗑  Reset All Data"
              onPress={handleResetData}
              variant="danger"
              fullWidth
            />
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: DARK.bg },
  safe:         { flex: 1 },
  content:      { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  sectionLabel: { color: TEXT.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4, marginTop: 4 },
});
