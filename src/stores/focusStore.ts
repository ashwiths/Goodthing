import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import { uid } from '../utils/formatters';
import {
  FocusSession, FocusState, FocusStats, PomodoroSettings,
  DEFAULT_POMODORO, SessionPhase, SessionStatus,
} from '../types/focus.types';
import { TODAY } from '../utils/dateUtils';
import { XP_REWARDS } from '../utils/xpUtils';

interface FocusStoreState {
  timerState:  FocusState;
  sessions:    FocusSession[];

  // Queries
  getTodayStats:  () => { sessions: number; minutes: number };
  getAllStats:     () => FocusStats;

  // Timer Actions
  startTimer:     () => void;
  pauseTimer:     () => void;
  resetTimer:     () => void;
  tickTimer:      () => void;   // call every second when running
  nextPhase:      () => void;
  updateSettings: (s: Partial<PomodoroSettings>) => void;
}

function durationForPhase(phase: SessionPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case 'focus':      return settings.focusDuration      * 60;
    case 'shortBreak': return settings.shortBreakDuration * 60;
    case 'longBreak':  return settings.longBreakDuration  * 60;
  }
}

export const useFocusStore = create<FocusStoreState>()(
  persist(
    (set, get) => ({
      timerState: {
        phase:          'focus',
        status:         'idle',
        timeRemaining:  DEFAULT_POMODORO.focusDuration * 60,
        currentSession: 1,
        settings:       DEFAULT_POMODORO,
      },
      sessions: [],

      getTodayStats: () => {
        const today = TODAY();
        const todaySessions = get().sessions.filter(
          (s) => s.completed && s.startedAt.startsWith(today)
        );
        return {
          sessions: todaySessions.length,
          minutes:  todaySessions.reduce((acc, s) => acc + s.duration, 0),
        };
      },

      getAllStats: () => {
        const all = get().sessions.filter((s) => s.completed);
        const today = TODAY();
        const todayS = all.filter((s) => s.startedAt.startsWith(today));
        return {
          todaySessions:  todayS.length,
          todayMinutes:   todayS.reduce((a, s) => a + s.duration, 0),
          weekSessions:   0,
          weekMinutes:    0,
          totalSessions:  all.length,
          totalMinutes:   all.reduce((a, s) => a + s.duration, 0),
          longestStreak:  0,
        };
      },

      startTimer: () =>
        set((s) => ({
          timerState: { ...s.timerState, status: 'running' },
        })),

      pauseTimer: () =>
        set((s) => ({
          timerState: { ...s.timerState, status: 'paused' },
        })),

      resetTimer: () =>
        set((s) => ({
          timerState: {
            ...s.timerState,
            status:        'idle',
            timeRemaining: durationForPhase(s.timerState.phase, s.timerState.settings),
          },
        })),

      tickTimer: () => {
        const { timerState } = get();
        if (timerState.status !== 'running') return;
        if (timerState.timeRemaining <= 1) {
          get().nextPhase();
        } else {
          set((s) => ({
            timerState: {
              ...s.timerState,
              timeRemaining: s.timerState.timeRemaining - 1,
            },
          }));
        }
      },

      nextPhase: () =>
        set((s) => {
          const { timerState, sessions } = s;
          const isFocus = timerState.phase === 'focus';

          // Record completed session
          if (isFocus) {
            const session: FocusSession = {
              id:        uid(),
              phase:     'focus',
              status:    'completed',
              startedAt: new Date().toISOString(),
              duration:  timerState.settings.focusDuration,
              completed: true,
              xpEarned:  XP_REWARDS.focusSession25,
            };
            sessions.push(session);
          }

          // Determine next phase
          const nextSession = isFocus ? timerState.currentSession + 1 : timerState.currentSession;
          const nextPhase: SessionPhase = isFocus
            ? nextSession % timerState.settings.sessionsBeforeLong === 0
              ? 'longBreak'
              : 'shortBreak'
            : 'focus';

          return {
            sessions: [...sessions],
            timerState: {
              ...timerState,
              phase:          nextPhase,
              status:         'idle',
              currentSession: nextSession,
              timeRemaining:  durationForPhase(nextPhase, timerState.settings),
            },
          };
        }),

      updateSettings: (s) =>
        set((state) => {
          const settings = { ...state.timerState.settings, ...s };
          return {
            timerState: {
              ...state.timerState,
              settings,
              timeRemaining: durationForPhase(state.timerState.phase, settings),
            },
          };
        }),
    }),
    {
      name:    'zenforge_focus',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
