// ─── Focus / Pomodoro Types ───────────────────────────────────────────────────

export type SessionPhase = 'focus' | 'shortBreak' | 'longBreak';
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface PomodoroSettings {
  focusDuration:      number;   // minutes
  shortBreakDuration: number;
  longBreakDuration:  number;
  sessionsBeforeLong: number;
}

export const DEFAULT_POMODORO: PomodoroSettings = {
  focusDuration:      25,
  shortBreakDuration: 5,
  longBreakDuration:  15,
  sessionsBeforeLong: 4,
};

export interface FocusSession {
  id:          string;
  phase:       SessionPhase;
  status:      SessionStatus;
  startedAt:   string;          // ISO timestamp
  endedAt?:    string;
  duration:    number;          // minutes
  completed:   boolean;
  ambientSoundId?: string;
  xpEarned:    number;
}

export interface FocusStats {
  todaySessions:  number;
  todayMinutes:   number;
  weekSessions:   number;
  weekMinutes:    number;
  totalSessions:  number;
  totalMinutes:   number;
  longestStreak:  number;       // consecutive focus days
}

export interface FocusState {
  phase:          SessionPhase;
  status:         SessionStatus;
  timeRemaining:  number;       // seconds
  currentSession: number;       // session index in cycle
  settings:       PomodoroSettings;
}
