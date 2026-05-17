import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { TEXT, DARK } from '../../constants/colors';
import { DURATION } from '../../constants/animations';
import { formatXP } from '../../utils/formatters';
import { getLevelTitle } from '../../utils/xpUtils';

interface XPBarProps {
  level:   number;
  current: number;
  toNext:  number;
  percent: number; // 0–1
}

export function XPBar({ level, current, toNext, percent }: XPBarProps) {
  const { primary, secondary } = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percent, { duration: DURATION.slower });
  }, [percent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.level, { color: primary }]}>LVL {level}</Text>
          <Text style={styles.title}>{getLevelTitle(level)}</Text>
        </View>
        <Text style={styles.xpText}>
          {formatXP(current)} / {formatXP(current + toNext)} XP
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]}>
          <LinearGradient
            colors={[primary, secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[styles.glow, { backgroundColor: primary }]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
  },
  level: {
    fontSize:     11,
    fontWeight:   '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color:      TEXT.primary,
    fontSize:   15,
    fontWeight: '700',
  },
  xpText: {
    color:    TEXT.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  track: {
    height:          6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius:    3,
    overflow:        'hidden',
  },
  fill: {
    height:       '100%',
    borderRadius:  3,
    overflow:      'hidden',
  },
  glow: {
    position:      'absolute',
    right:         0,
    top:           -4,
    width:         12,
    height:        14,
    borderRadius:   6,
    opacity:       0.8,
  },
});
