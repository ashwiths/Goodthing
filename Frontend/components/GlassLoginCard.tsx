/**
 * GlassLoginCard.tsx
 * Full glassmorphism login UI — BlurView + gradient border + glow inputs.
 * All animation is internal (card slides up, inputs glow on focus).
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator,
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
import { fireHaptic, fireSuccessHaptic } from '../utils/haptics';

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

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [forgotCode, setForgotCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const { login, signup, forgotPassword, resetPassword, loading } = useAuthStore();

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const handleForgotPassword = async () => {
    if (forgotLoading || cooldown > 0) return;

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotError('Please enter your email address.');
      fireHaptic('medium');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setForgotError('Please enter a valid email address.');
      fireHaptic('medium');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    fireHaptic('light');

    const result = await forgotPassword(trimmedEmail);
    setForgotLoading(false);

    if (result.success) {
      setForgotSuccess(true);
      fireSuccessHaptic();
      setCooldown(30);
    } else {
      fireHaptic('heavy');
      setForgotError(result.message);
    }
  };

  const handleConfirmReset = async () => {
    if (forgotLoading) return;

    const trimmedCode = forgotCode.trim();
    const trimmedPassword = newResetPassword.trim();

    if (!trimmedCode || !trimmedPassword) {
      setForgotError('Please enter both the reset code and your new password.');
      fireHaptic('medium');
      return;
    }

    if (trimmedCode.length !== 6) {
      setForgotError('Verification code must be exactly 6 characters.');
      fireHaptic('medium');
      return;
    }

    if (trimmedPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      fireHaptic('medium');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    fireHaptic('light');

    const result = await resetPassword(forgotEmail.trim(), trimmedCode, trimmedPassword);
    setForgotLoading(false);

    if (result.success) {
      fireSuccessHaptic();
      Alert.alert(
        'Password Reset Success! 🎉',
        'Your password has been updated. You can now log in with your new password.',
        [
          {
            text: 'Back to Login',
            onPress: () => {
              setIsForgotPassword(false);
              setForgotEmail('');
              setForgotCode('');
              setNewResetPassword('');
              setForgotSuccess(false);
              setForgotError('');
            }
          }
        ]
      );
    } else {
      fireHaptic('heavy');
      setForgotError(result.message);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Sign-In', 'Google Sign-In is coming soon with pure MongoDB support!');
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

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setAuthError('Please enter both your email and password.');
      fireHaptic('medium');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address.');
      fireHaptic('medium');
      return;
    }

    setAuthError('');
    fireHaptic('light');

    const result = await login(trimmedEmail, trimmedPassword);
    if (result.success) {
      router.replace('/character-select' as any);
    } else {
      setAuthError(result.message);
      fireHaptic('heavy');
    }
  };

  const handleSignup = async () => {
    if (loading) return;

    console.log({
      name,
      email,
      password
    });

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      setAuthError('Please provide all required fields');
      fireHaptic('medium');
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address.');
      fireHaptic('medium');
      return;
    }

    if (trimmedPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      fireHaptic('medium');
      return;
    }

    setAuthError('');
    fireHaptic('light');

    const result = await signup(trimmedName, trimmedEmail, trimmedPassword);
    if (result.success) {
      router.replace('/character-select' as any);
    } else {
      setAuthError(result.message);
      fireHaptic('heavy');
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

        {isForgotPassword ? (
          <>
            {!forgotSuccess ? (
              <>
                {/* Heading */}
                <Text style={styles.heading}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email to receive a password reset verification code.
                </Text>

                <View style={{ height: 24 }} />

                <GlowInput
                  value={forgotEmail}
                  onChangeText={(txt) => {
                    setForgotEmail(txt);
                    setForgotError('');
                  }}
                  placeholder="Email address"
                  keyboardType="email-address"
                  delay={100}
                />

                {forgotError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                    <Text style={styles.errorText}>{forgotError}</Text>
                  </View>
                ) : null}

                <View style={{ height: 22 }} />

                {/* Action Button */}
                <ScaleBtn onPress={handleForgotPassword} delay={180} disabled={forgotLoading || cooldown > 0}>
                  <LinearGradient
                    colors={forgotLoading || cooldown > 0 ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)'] : [C.blue500, C.blue700]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.loginBtn, (forgotLoading || cooldown > 0) && { opacity: 0.6 }]}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color={C.white} size="small" />
                    ) : (
                      <Text style={styles.loginBtnText}>
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Reset Code'}
                      </Text>
                    )}
                  </LinearGradient>
                </ScaleBtn>
              </>
            ) : (
              <>
                {/* Heading */}
                <Text style={styles.heading}>Confirm Reset</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-character code sent to your email and your new password.
                </Text>

                <View style={{ height: 24 }} />

                <GlowInput
                  value={forgotCode}
                  onChangeText={(txt) => {
                    setForgotCode(txt);
                    setForgotError('');
                  }}
                  placeholder="Verification Code"
                  delay={100}
                />
                <View style={{ height: 12 }} />
                <GlowInput
                  value={newResetPassword}
                  onChangeText={(txt) => {
                    setNewResetPassword(txt);
                    setForgotError('');
                  }}
                  placeholder="New Password"
                  secure
                  delay={150}
                />

                {forgotError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                    <Text style={styles.errorText}>{forgotError}</Text>
                  </View>
                ) : null}

                <View style={{ height: 22 }} />

                {/* Confirm Action Button */}
                <ScaleBtn onPress={handleConfirmReset} delay={180} disabled={forgotLoading}>
                  <LinearGradient
                    colors={[C.blue500, C.blue700]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.loginBtn}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color={C.white} size="small" />
                    ) : (
                      <Text style={styles.loginBtnText}>Reset Password</Text>
                    )}
                  </LinearGradient>
                </ScaleBtn>

                <View style={{ height: 12 }} />

                {/* Resend button */}
                <Pressable
                  onPress={handleForgotPassword}
                  disabled={cooldown > 0 || forgotLoading}
                  style={({ pressed }) => [
                    { alignSelf: 'center', opacity: (cooldown > 0 || pressed) ? 0.5 : 1 }
                  ]}
                >
                  <Text style={[styles.forgotText, { color: C.text70, alignSelf: 'center' }]}>
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Verification Code'}
                  </Text>
                </Pressable>
              </>
            )}

            <View style={{ height: 20 }} />

            {/* Toggle Mode Link */}
            <Pressable 
              style={styles.toggleModeRow} 
              onPress={() => {
                fireHaptic('light');
                setIsForgotPassword(false);
                setForgotEmail('');
                setForgotCode('');
                setNewResetPassword('');
                setForgotError('');
                setForgotSuccess(false);
              }}
            >
              <Text style={styles.toggleModeText}>Back to Login</Text>
            </Pressable>
          </>
        ) : (
          <>
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
                  onChangeText={(txt) => {
                    setName(txt);
                    setAuthError('');
                  }}
                  placeholder="Full name"
                  delay={BASE - 40}
                />
                <View style={{ height: 12 }} />
              </>
            )}

            <GlowInput
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                setAuthError('');
              }}
              placeholder="Email address"
              keyboardType="email-address"
              delay={BASE}
            />
            <View style={{ height: 12 }} />
            <GlowInput
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                setAuthError('');
              }}
              placeholder="Password"
              secure
              delay={BASE + 80}
            />

            {authError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Forgot */}
            {!isSignup && (
              <Pressable
                style={styles.forgotRow}
                onPress={() => {
                  fireHaptic('light');
                  setIsForgotPassword(true);
                  setForgotEmail('');
                  setForgotError('');
                  setForgotSuccess(false);
                  setAuthError('');
                }}
              >
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
                {loading ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>
                    {isSignup ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
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
                setAuthError('');
              }}
            >
              <Text style={styles.toggleModeText}>
                {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </Pressable>
          </>
        )}
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.18)',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.18)',
  },
  successText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
