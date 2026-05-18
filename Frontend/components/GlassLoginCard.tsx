/**
 * GlassLoginCard.tsx
 * Full glassmorphism login UI — BlurView + gradient border + glow inputs.
 * All animation is internal (card slides up, inputs glow on focus).
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
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
import { AnimatedLogo } from './AnimatedLogo';
import { C } from '../constants/colors';
import { useAuthStore } from '../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { secureStorage } from '../src/utils/secureStorage.js';
// @ts-ignore
import { useGoogleAuth } from '../src/services/googleAuth';

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
  onPress, children, delay = 0, disabled = false,
}: { onPress: () => void; children: React.ReactNode; delay?: number; disabled?: boolean }) {
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
      onPressIn={()  => { if (!disabled) s.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { if (!disabled) s.value = withSpring(1.00, { damping: 15 }); }}
      onPress={() => { if (!disabled) onPress(); }}
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
  const [isSignup, setIsSignup] = useState(false);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const { login, signup, loading } = useAuthStore();

  const { handleGoogleSignIn } = useGoogleAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const user = await handleGoogleSignIn();

      if (user) {
        console.log('✅ FIREBASE GOOGLE LOGIN SUCCESS');
        console.log(user);

        // Map Firebase user object to application's standardized user interface
        const localUser = {
          uid: user.uid,
          fullName: user.displayName || user.email?.split('@')[0] || 'Productivity Warrior',
          email: user.email || '',
          avatar: user.photoURL || '',
          provider: 'google',
        };

        // Persist session securely
        await secureStorage.setItem('token', 'firebase-google-auth-token');
        await secureStorage.setItem('user', JSON.stringify(localUser));

        // Update Zustand global store state
        useAuthStore.setState({
          token: 'firebase-google-auth-token',
          user: localUser,
        });

        Alert.alert(
          'Google Sign-In Success! 🎉',
          `Welcome, ${localUser.fullName}!\n\nEmail: ${localUser.email}`
        );

        // Redirect to Home Tabs screen
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('🔥 GOOGLE LOGIN ERROR:', err);
      Alert.alert(
        'Sign-In Failed ❌',
        err.message || 'An error occurred during Google authentication.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

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

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    
    const result = await login(email.trim(), password.trim());
    if (result.success) {
      router.replace('/character-select' as any);
    } else {
      Alert.alert('Authentication Failed ❌', result.message);
    }
  };

  const handleSignup = async () => {
    if (loading) return;

    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your name, email, and password.');
      return;
    }

    const result = await signup(name.trim(), email.trim(), password.trim());
    if (result.success) {
      router.replace('/character-select' as any);
    } else {
      Alert.alert('Signup Failed ❌', result.message);
    }
  };

  const handleGuest = () => {
    Alert.alert('Guest Mode', 'Continuing in offline guest mode.');
    router.replace('/character-select' as any);
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
          <AnimatedLogo size="small" showSlogan={false} animated={false} />
        </View>

        {/* Heading */}
        <Text style={styles.heading}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {isSignup ? 'Start your productivity journey with To|Do.' : 'Continue your productivity journey.'}
        </Text>

        <View style={{ height: 24 }} />

        {/* Inputs */}
        {isSignup && (
          <>
            <GlowInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              delay={BASE - 40}
            />
            <View style={{ height: 12 }} />
          </>
        )}

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
        {!isSignup && (
          <Pressable style={styles.forgotRow} onPress={() => Alert.alert('Reset Password', 'Password reset instructions sent!')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        )}

        <View style={{ height: 22 }} />

        {/* Action Button */}
        <ScaleBtn onPress={isSignup ? handleSignup : handleLogin} delay={BASE + 180} disabled={loading}>
          <LinearGradient
            colors={[C.blue500, C.blue700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
          >
            <Text style={styles.loginBtnText}>
              {isSignup 
                ? (loading ? 'Creating Account...' : 'Create Account') 
                : (loading ? 'Signing In...' : 'Sign In')}
            </Text>
          </LinearGradient>
        </ScaleBtn>

        {/* Divider */}
        <View style={styles.divRow}>
          <View style={styles.divLine} />
          <Text style={styles.divLabel}>or</Text>
          <View style={styles.divLine} />
        </View>

        {/* Continue with Google */}
        <ScaleBtn onPress={() => {}} delay={BASE + 220} disabled={true}>
          <View style={[styles.googleBtn, { opacity: 0.5 }]}>
            <Ionicons name="logo-google" size={18} color={C.white} />
            <Text style={styles.googleText}>Continue with Google</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>
          </View>
        </ScaleBtn>



        <View style={{ height: 20 }} />

        {/* Toggle Mode Link */}
        <Pressable 
          style={styles.toggleModeRow} 
          onPress={() => {
            setIsSignup(!isSignup);
            setName('');
            setEmail('');
            setPassword('');
          }}
        >
          <Text style={styles.toggleModeText}>
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </Pressable>
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
  googleBtn: {
    height:          52,
    borderRadius:    14,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor:     C.blue400,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.25,
    shadowRadius:    15,
    elevation:       5,
    gap:             10,
  },
  googleText: {
    color:       C.white,
    fontSize:    15,
    fontWeight:  '600',
    letterSpacing: 0.2,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor:     'rgba(59, 130, 246, 0.3)',
    borderWidth:     1,
    borderRadius:    6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft:      4,
  },
  comingSoonText: {
    fontSize:      9,
    fontWeight:    '700',
    color:         C.blue400,
    letterSpacing: 0.5,
  },
  toggleModeRow: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  toggleModeText: {
    color: C.textBlue,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
