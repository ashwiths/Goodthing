import React, { useState } from 'react';
import {
  TextInput, View, Text, StyleSheet, ViewStyle, TextInputProps,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { DURATION } from '../../constants/animations';
import { DARK, TEXT } from '../../constants/colors';

interface NeonInputProps extends TextInputProps {
  label?:       string;
  error?:       string;
  containerStyle?: ViewStyle;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
}

export function NeonInput({
  label, error, containerStyle, leftIcon, rightIcon, style, ...props
}: NeonInputProps) {
  const { primary } = useTheme();
  const [focused, setFocused] = useState(false);
  const glowOpacity = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        focused && { borderColor: primary },
        !!error && { borderColor: '#FF2D55' },
      ]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          {...props}
          style={[styles.input, style]}
          placeholderTextColor="rgba(255,255,255,0.3)"
          selectionColor={primary}
          onFocus={(e) => {
            setFocused(true);
            glowOpacity.value = withTiming(1, { duration: DURATION.normal });
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            glowOpacity.value = withTiming(0, { duration: DURATION.normal });
            props.onBlur?.(e);
          }}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.glow,
            { borderColor: primary },
            glowStyle,
          ]}
          pointerEvents="none"
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    color:        TEXT.secondary,
    fontSize:     12,
    fontWeight:   '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
    borderRadius:    14,
    overflow:        'hidden',
  },
  input: {
    flex:        1,
    color:       TEXT.primary,
    fontSize:    15,
    paddingVertical:   14,
    paddingHorizontal: 16,
  },
  icon: { paddingHorizontal: 12 },
  glow: {
    borderRadius: 14,
    borderWidth:  1.5,
    shadowColor:  'transparent',
  },
  error: {
    color:    '#FF2D55',
    fontSize: 12,
    marginTop: 4,
  },
});
