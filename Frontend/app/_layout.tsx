import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { C } from '../constants/colors';
import { registerForPushNotificationsAsync } from '../src/services/notificationService';
import { useAuthStore } from '../src/store/authStore';

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

    registerForPushNotificationsAsync().catch(err => {
      console.warn("Notification permission setup skipped or failed:", err);
    });
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.void },
});
