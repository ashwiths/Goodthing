import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, withRepeat,
  withSequence, Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { SessionPhase } from '../../types/focus.types';
import { formatTime } from '../../utils/dateUtils';
import { TEXT } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE    = 240;
const STROKE  = 10;
const R       = (SIZE - STROKE * 2) / 2;
const CIRCUM  = 2 * Math.PI * R;

interface TimerRingProps {
  timeRemaining: number;
  totalDuration: number;
  phase:         SessionPhase;
}

const PHASE_LABELS: Record<SessionPhase, string> = {
  focus:      '⚡ DEEP FOCUS',
  shortBreak: '☕ SHORT BREAK',
  longBreak:  '🌙 LONG BREAK',
};

export function TimerRing({ timeRemaining, totalDuration, phase }: TimerRingProps) {
  const { primary, secondary } = useTheme();
  const progress = useSharedValue(1);
  const glow     = useSharedValue(0.4);

  useEffect(() => {
    const pct = totalDuration > 0 ? timeRemaining / totalDuration : 0;
    progress.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.quad) });
  }, [timeRemaining, totalDuration]);

  // Pulse glow when running
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 }),
      ),
      -1
    );
  }, []);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUM * (1 - progress.value),
    strokeOpacity:    glow.value,
  }));

  const color = phase === 'focus' ? primary : secondary;

  return (
    <View style={styles.container}>
      {/* Outer glow ring */}
      <View style={[styles.glowRing, {
        shadowColor:   color,
        shadowOpacity: 0.6,
        shadowRadius:  40,
        borderColor:   color + '22',
      }]} />

      <Svg width={SIZE} height={SIZE}>
        {/* Track */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUM}
          animatedProps={animProps}
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
        <Text style={[styles.time, { color }]}>{formatTime(timeRemaining)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position:    'absolute',
    width:       SIZE + 20,
    height:      SIZE + 20,
    borderRadius:(SIZE + 20) / 2,
    borderWidth:  1,
    elevation:    20,
  },
  center: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    color:        TEXT.muted,
    fontSize:     11,
    fontWeight:   '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  time: {
    fontSize:      52,
    fontWeight:    '900',
    letterSpacing: -2,
    fontVariant:   ['tabular-nums'],
  },
});
