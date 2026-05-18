import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { C } from '../constants/colors';
import { registerForPushNotificationsAsync, scheduleDeepModeActiveNotification } from '../src/services/notificationService';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { AchievementModal } from '../components/AchievementModal';
import { performIntegrityCheck } from '../src/services/integrityCheck';

// ─── Global Production Logging Shield ───
if (!__DEV__) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

if (Platform.OS === 'web') {
  try {
    const { StyleSheet: CSSInteropStyleSheet } = require('react-native-css-interop');
    CSSInteropStyleSheet.setFlag('darkMode', 'class');
  } catch (e) {}
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    // ── Ensure notification handler is always registered first ──
    // This must run before any notification can be displayed,
    // including after hot reloads in Expo Go.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    loadUser();

    // Run enterprise-grade device integrity validation
    performIntegrityCheck().then(report => {
      console.log('🔒 [Security Integrity Report]:', report);
      if (report.threatLevel === 'high') {
        console.warn('⚠️ [Security Warning] High threat environment detected:', report.violations.join(', '));
      }
    }).catch(err => {
      console.error('🔒 [Security Integrity Error]:', err);
    });

    registerForPushNotificationsAsync().catch(err => {
      console.warn("Notification permission setup skipped or failed:", err);
    });
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      // 1. Notify user when app is closed / sent to background with deep focus enabled
      if (nextAppState === 'background') {
        const isDeepActive = useSettingsStore.getState().deepWorkZone;
        if (isDeepActive) {
          scheduleDeepModeActiveNotification();
        }
      }

      // 2. Redirect straight back to Focus tab upon re-entering foreground
      if (nextAppState === 'active') {
        const isDeepActive = useSettingsStore.getState().deepWorkZone;
        if (isDeepActive) {
          setTimeout(() => {
            router.replace('/(tabs)/focus' as any);
          }, 200);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // 3. Handle initial cold boot redirect to Focus sanctuary if deep mode is active
    const isDeepActive = useSettingsStore.getState().deepWorkZone;
    if (isDeepActive) {
      setTimeout(() => {
        router.replace('/(tabs)/focus' as any);
      }, 500);
    }

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Hide splash after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor={C.void} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="entry" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="character-select" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      </Stack>
      <AchievementModal />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.void },
});
