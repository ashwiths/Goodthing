/**
 * GlassLoginCard.tsx
 * Full glassmorphism login UI — BlurView + gradient border + glow inputs.
 * All animation is internal (card slides up, inputs glow on focus).
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AnimatedLogo } from './AnimatedLogo';
import { C } from '../constants/colors';

// ── Glow Input ────────────────────────────────────────────────────────────────
interface GlowInputProps {
  value:          string;
  onChangeText:   (t: string) => void;
  placeholder:    string;
  secure?:        boolean;
  keyboardType?:  'email-address' | 'default';
  delay?:         number;
}

function GlowInput({
  value, onChangeText, placeholder, secure = false,
  keyboardType = 'default', delay = 0,
}: GlowInputProps) {
  const glow    = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY  = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    slideY.value  = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: slideY.value }],
    borderColor: interpolate(glow.value, [0, 1], [0.09, 0.70]) > 0.4
      ? C.borderFocus
      : C.border,
    shadowOpacity: interpolate(glow.value, [0, 1], [0, 0.45]),
    shadowRadius:  interpolate(glow.value, [0, 1], [0, 16]),
  }));

  return (
    <Animated.View style={[styles.inputWrap, wrapStyle]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.text25}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={styles.input}
        onFocus={()  => { glow.value = withTiming(1, { duration: 300 }); }}
        onBlur={()   => { glow.value = withTiming(0, { duration: 400 }); }}
      />
    </Animated.View>
  );
}

// ── Scale Button ──────────────────────────────────────────────────────────────
function ScaleBtn({
  onPress, children, delay = 0,
}: { onPress: () => void; children: React.ReactNode; delay?: number }) {
  const s       = useSharedValue(1);
  const opacity = useSharedValue(0);
  const slideY  = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    slideY.value  = withDelay(delay, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }, { translateY: slideY.value }],
    opacity:   opacity.value,
  }));

  return (
    <Pressable
      onPressIn={()  => { s.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { s.value = withSpring(1.00, { damping: 15 }); }}
      onPress={onPress}
    >
      <Animated.View style={style}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────
interface GlassLoginCardProps {
  entryDelay?: number;
}

export function GlassLoginCard({ entryDelay = 500 }: GlassLoginCardProps) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Card slide-up
  const cardOp = useSharedValue(0);
  const cardY  = useSharedValue(44);

  useEffect(() => {
    cardOp.value = withDelay(entryDelay, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    cardY.value  = withDelay(entryDelay, withSpring(0, { damping: 20, stiffness: 75 }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity:   cardOp.value,
    transform: [{ translateY: cardY.value }],
  }));

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    // TODO: connect to auth backend
    Alert.alert('Login', `Signing in as ${email.trim()}…`);
  };

  const handleGuest = () => {
    router.replace('/(tabs)' as any);
  };

  const BASE = entryDelay + 200;

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      {/* Blur layer */}
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Glass tint */}
      <LinearGradient
        colors={['rgba(15,28,62,0.70)', 'rgba(4,8,20,0.80)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Border shimmer */}
      <View style={styles.borderOverlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo small */}
        <View style={styles.logoRow}>
          <AnimatedLogo size="small" showSlogan={false} entryDelay={entryDelay + 100} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subtitle}>Continue your productivity journey.</Text>

        <View style={{ height: 24 }} />

        {/* Inputs */}
        <GlowInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          delay={BASE}
        />
        <View style={{ height: 12 }} />
        <GlowInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secure
          delay={BASE + 80}
        />

        {/* Forgot */}
        <Pressable style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <View style={{ height: 22 }} />

        {/* Login button */}
        <ScaleBtn onPress={handleLogin} delay={BASE + 180}>
          <LinearGradient
            colors={[C.blue500, C.blue700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </LinearGradient>
        </ScaleBtn>

        {/* Divider */}
        <View style={styles.divRow}>
          <View style={styles.divLine} />
          <Text style={styles.divLabel}>or</Text>
          <View style={styles.divLine} />
        </View>

        {/* Guest */}
        <ScaleBtn onPress={handleGuest} delay={BASE + 260}>
          <View style={styles.guestBtn}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </View>
        </ScaleBtn>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.blue500,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
    elevation: 20,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(76,142,245,0.18)',
  },
  content: {
    padding: 28,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize:   26,
    fontWeight: '700',
    color:      C.text100,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color:    C.text45,
    lineHeight: 20,
  },
  inputWrap: {
    borderRadius:    14,
    borderWidth:     1,
    backgroundColor: C.glass08,
    shadowColor:     C.blue400,
    shadowOffset:    { width: 0, height: 0 },
    overflow:        'visible',
  },
  input: {
    height:          52,
    paddingHorizontal: 16,
    color:           C.text100,
    fontSize:        15,
  },
  forgotRow: {
    alignSelf:  'flex-end',
    marginTop:   10,
  },
  forgotText: {
    color:      C.textBlue,
    fontSize:   13,
    fontWeight: '500',
  },
  loginBtn: {
    height:       52,
    borderRadius: 14,
    alignItems:   'center',
    justifyContent: 'center',
    shadowColor:  C.blue500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  loginBtnText: {
    color:       C.white,
    fontSize:    16,
    fontWeight:  '700',
    letterSpacing: 0.4,
  },
  divRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginVertical: 18,
    gap: 10,
  },
  divLine: {
    flex:            1,
    height:          1,
    backgroundColor: C.border,
  },
  divLabel: {
    color:    C.text25,
    fontSize: 12,
  },
  guestBtn: {
    height:          52,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     C.border,
    backgroundColor: C.glass08,
  },
  guestText: {
    color:       C.text70,
    fontSize:    15,
    fontWeight:  '500',
  },
});
