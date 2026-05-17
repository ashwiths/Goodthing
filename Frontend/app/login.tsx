/**
 * app/login.tsx  — Cinematic login screen (no image assets)
 */
import React from 'react';
import {
  View, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { CinematicBackground } from '../components/CinematicBackground';
import { GlassLoginCard } from '../components/GlassLoginCard';
import { C } from '../constants/colors';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Same animated environment — seamless transition from entry */}
      <CinematicBackground particleCount={28} showScanLine={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassLoginCard entryDelay={200} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.void,
  },
  kav: { flex: 1 },
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: 20,
    paddingTop:        60,
    paddingBottom:     20,
  },
});
