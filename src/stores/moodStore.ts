import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import { uid } from '../utils/formatters';
import { TODAY, getLast7Days } from '../utils/dateUtils';
import { MoodLog, MoodLevel, MoodStats } from '../types/mood.types';

interface MoodState {
  logs: MoodLog[];

  // Queries
  getTodayLog:  () => MoodLog | null;
  getLast7:     () => MoodLog[];
  getStats:     () => MoodStats;

  // Mutations
  logMood:      (level: MoodLevel, note?: string) => MoodLog;
  deleteMoodLog:(id: string)                       => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      logs: [],

      getTodayLog: () => {
        const today = TODAY();
        return get().logs.find((l) => l.loggedAt === today) ?? null;
      },

      getLast7: () => {
        const days = getLast7Days();
        return days
          .map((d) => get().logs.find((l) => l.loggedAt === d))
          .filter((l): l is MoodLog => !!l);
      },

      getStats: () => {
        const { logs } = get();
        if (logs.length === 0)
          return { averageMood: 0, totalLogs: 0, moodTrend: 'stable', weekHistory: [] };

        const last7 = get().getLast7();
        const avg = last7.length
          ? last7.reduce((a, l) => a + l.level, 0) / last7.length
          : 0;

        const recent3 = logs.slice(-3).map((l) => l.level);
        const trend =
          recent3.length < 2
            ? 'stable'
            : recent3[recent3.length - 1] > recent3[0]
            ? 'up'
            : recent3[recent3.length - 1] < recent3[0]
            ? 'down'
            : 'stable';

        return {
          averageMood:  avg,
          totalLogs:    logs.length,
          moodTrend:    trend as 'up' | 'down' | 'stable',
          weekHistory:  last7,
        };
      },

      logMood: (level, note) => {
        const today = TODAY();
        const existing = get().logs.find((l) => l.loggedAt === today);
        if (existing) {
          const updated = { ...existing, level, note };
          set((s) => ({
            logs: s.logs.map((l) => (l.id === existing.id ? updated : l)),
          }));
          return updated;
        }
        const log: MoodLog = {
          id:        uid(),
          level,
          note,
          tags:      [],
          loggedAt:  today,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ logs: [...s.logs, log] }));
        return log;
      },

      deleteMoodLog: (id) =>
        set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
    }),
    {
      name:    'zenforge_mood',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
