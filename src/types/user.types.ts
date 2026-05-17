// ─── User Types ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id:          string;
  username:    string;
  avatarEmoji: string;         // emoji avatar
  bio:         string;
  joinedAt:    string;         // ISO timestamp
}

export interface UserXP {
  current: number;
  total:   number;
  level:   number;
  toNext:  number;             // XP needed for next level
}

export interface UserStreak {
  current:  number;            // days
  longest:  number;
  lastDate: string;            // ISO date (YYYY-MM-DD)
}

export interface UserStats {
  habitsCompleted:  number;
  focusSessions:    number;
  focusMinutes:     number;
  journalEntries:   number;
  moodLogs:         number;
  achievements:     number;
}

export interface UserPreferences {
  notifications:    boolean;
  haptics:          boolean;
  soundEnabled:     boolean;
  appLockEnabled:   boolean;
  biometricsEnabled:boolean;
  dailyReminder:    string;    // "HH:MM"
}

export interface DailyMission {
  id:          string;
  title:       string;
  description: string;
  icon:        string;         // emoji
  xpReward:    number;
  completed:   boolean;
  type:        'habit' | 'focus' | 'mood' | 'journal' | 'bonus';
}
