import { useEffect, useRef, useCallback } from 'react';
import { useFocusStore } from '../stores/focusStore';
import { useUserStore } from '../stores/userStore';
import { XP_REWARDS } from '../utils/xpUtils';

export function useFocusTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { timerState, startTimer, pauseTimer, resetTimer, tickTimer, nextPhase } = useFocusStore();
  const addXP      = useUserStore((s) => s.addXP);
  const updateStats = useUserStore((s) => s.updateStats);

  // Tick every second when running
  useEffect(() => {
    if (timerState.status === 'running') {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState.status]);

  // Award XP when a focus session completes
  const prevPhase = useRef(timerState.phase);
  useEffect(() => {
    if (prevPhase.current === 'focus' && timerState.phase !== 'focus') {
      addXP(XP_REWARDS.focusSession25);
      updateStats({ focusSessions: 1, focusMinutes: timerState.settings.focusDuration });
    }
    prevPhase.current = timerState.phase;
  }, [timerState.phase]);

  const start  = useCallback(() => startTimer(),  []);
  const pause  = useCallback(() => pauseTimer(),  []);
  const reset  = useCallback(() => resetTimer(),  []);

  return {
    phase:         timerState.phase,
    status:        timerState.status,
    timeRemaining: timerState.timeRemaining,
    currentSession:timerState.currentSession,
    settings:      timerState.settings,
    start, pause, reset,
  };
}
