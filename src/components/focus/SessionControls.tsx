import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NeonButton } from '../ui/NeonButton';
import { SessionStatus } from '../../types/focus.types';
import { useTheme } from '../../hooks/useTheme';

interface SessionControlsProps {
  status:  SessionStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onNext:  () => void;
}

export function SessionControls({ status, onStart, onPause, onReset, onNext }: SessionControlsProps) {
  const { primary } = useTheme();
  const isRunning = status === 'running';
  const isIdle    = status === 'idle';

  return (
    <View style={styles.row}>
      <NeonButton
        label="↺"
        onPress={onReset}
        variant="ghost"
        size="md"
        style={styles.sideBtn}
        textStyle={{ fontSize: 22 }}
      />

      {isRunning ? (
        <NeonButton
          label="⏸  PAUSE"
          onPress={onPause}
          size="lg"
          style={styles.mainBtn}
          fullWidth
        />
      ) : (
        <NeonButton
          label={isIdle ? "▶  START" : "▶  RESUME"}
          onPress={onStart}
          size="lg"
          style={styles.mainBtn}
          fullWidth
        />
      )}

      <NeonButton
        label="⏭"
        onPress={onNext}
        variant="ghost"
        size="md"
        style={styles.sideBtn}
        textStyle={{ fontSize: 22 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  sideBtn: { width: 52, height: 52 },
  mainBtn: { flex: 1 },
});
