import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useTheme } from '../../src/hooks/useTheme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { DARK, TEXT } from '../../src/constants/colors';
import { NeonButton } from '../../src/components/ui/NeonButton';

const PIN_LENGTH = 4;

export default function AppLockScreen() {
  const { primary } = useTheme();
  const { error: hapticError, success } = useHaptics();
  const { verifyPin, unlock } = useAuthStore();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        if (verifyPin(next)) {
          success();
          unlock();
          router.replace('/(tabs)');
        } else {
          hapticError();
          setShake(true);
          setPin('');
          setTimeout(() => setShake(false), 500);
        }
      }, 100);
    }
  };

  const handleDelete = () => setPin((p) => p.slice(0, -1));

  const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[DARK.bg, DARK.surface]} style={StyleSheet.absoluteFill} />

      <Animated.View entering={FadeInUp.delay(100)} style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>

        {/* Dots */}
        <View style={[styles.dotsRow, shake && styles.shake]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                { borderColor: primary },
                i < pin.length && { backgroundColor: primary },
              ]}
            />
          ))}
        </View>

        {/* Numpad */}
        <View style={styles.numpad}>
          {DIGITS.map((d, i) => (
            <Pressable
              key={i}
              onPress={() => d === '⌫' ? handleDelete() : d ? handleDigit(d) : undefined}
              style={({ pressed }) => [
                styles.key,
                d && { borderColor: 'rgba(255,255,255,0.1)' },
                pressed && d && { backgroundColor: primary + '22' },
              ]}
              accessibilityLabel={d === '⌫' ? 'Delete' : d}
            >
              <Text style={[styles.keyText, d === '⌫' && { color: primary }]}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <NeonButton label="Use Biometrics" variant="ghost" onPress={() => Alert.alert('Biometrics', 'Configure in Settings')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 24,
  },
  icon:     { fontSize: 48 },
  title:    { color: TEXT.primary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: TEXT.muted, fontSize: 15 },
  dotsRow:  { flexDirection: 'row', gap: 16 },
  shake:    { transform: [{ translateX: 8 }] },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2,
  },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 0 },
  key: {
    width: 80, height: 72, alignItems: 'center', justifyContent: 'center',
    borderWidth: 0,
  },
  keyText: { color: TEXT.primary, fontSize: 24, fontWeight: '500' },
});
