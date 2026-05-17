// ─── Mood Types ───────────────────────────────────────────────────────────────

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodOption {
  level:       MoodLevel;
  emoji:       string;
  label:       string;
  color:       string;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { level: 1, emoji: '😞', label: 'Terrible',  color: '#FF2D55', description: 'Really struggling today' },
  { level: 2, emoji: '😔', label: 'Low',        color: '#FF6B35', description: 'Not feeling great'        },
  { level: 3, emoji: '😐', label: 'Neutral',    color: '#FFB703', description: 'Feeling okay'             },
  { level: 4, emoji: '🙂', label: 'Good',       color: '#39FF14', description: 'Pretty good day'          },
  { level: 5, emoji: '😄', label: 'Excellent',  color: '#00F5FF', description: 'Absolutely crushing it!'  },
];

export interface MoodLog {
  id:        string;
  level:     MoodLevel;
  note?:     string;
  tags?:     string[];
  loggedAt:  string;    // ISO date string (YYYY-MM-DD)
  createdAt: string;    // full ISO timestamp
}

export interface MoodStats {
  averageMood:  number;
  totalLogs:    number;
  moodTrend:    'up' | 'down' | 'stable';
  weekHistory:  MoodLog[];
}
