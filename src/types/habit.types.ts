// ─── Habit Types ─────────────────────────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly' | 'custom';
export type HabitCategory  = 'health' | 'mind' | 'fitness' | 'learn' | 'social' | 'custom';

export interface Habit {
  id:          string;
  title:       string;
  description: string;
  icon:        string;          // emoji
  color:       string;          // hex
  category:    HabitCategory;
  frequency:   HabitFrequency;
  targetDays:  number[];        // 0=Sun … 6=Sat for weekly; [] means every day
  xpReward:    number;
  createdAt:   string;          // ISO date string
  archivedAt?: string;
}

export interface HabitCompletion {
  habitId:     string;
  completedAt: string;          // ISO date string (YYYY-MM-DD)
}

export interface HabitStreak {
  habitId:        string;
  currentStreak:  number;
  longestStreak:  number;
  lastCompleted?: string;       // ISO date string
}

export interface HabitWithStats extends Habit {
  streak:        HabitStreak;
  completedToday: boolean;
}
