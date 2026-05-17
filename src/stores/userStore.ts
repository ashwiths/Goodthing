import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import { uid } from '../utils/formatters';
import { TODAY } from '../utils/dateUtils';
import { getXPProgress, getLevelTitle, XP_REWARDS } from '../utils/xpUtils';
import {
  UserProfile, UserXP, UserStreak, UserStats,
  UserPreferences, DailyMission,
} from '../types/user.types';

interface UserState {
  profile:     UserProfile;
  xp:          UserXP;
  streak:      UserStreak;
  stats:       UserStats;
  prefs:       UserPreferences;
  missions:    DailyMission[];
  lastActiveDate: string;

  // Actions
  updateProfile:    (p: Partial<UserProfile>)      => void;
  addXP:            (amount: number)               => void;
  updateStreak:     ()                             => void;
  updateStats:      (delta: Partial<UserStats>)    => void;
  updatePrefs:      (p: Partial<UserPreferences>)  => void;
  completeMission:  (id: string)                   => void;
  refreshMissions:  ()                             => void;
  getLevelTitle:    ()                             => string;
}

const DEFAULT_PROFILE: UserProfile = {
  id:          uid(),
  username:    'ZenForge User',
  avatarEmoji: '🧘',
  bio:         'Forge your zen, one habit at a time.',
  joinedAt:    new Date().toISOString(),
};

const DEFAULT_PREFS: UserPreferences = {
  notifications:     true,
  haptics:           true,
  soundEnabled:      true,
  appLockEnabled:    false,
  biometricsEnabled: false,
  dailyReminder:     '08:00',
};

const DEFAULT_STATS: UserStats = {
  habitsCompleted: 0,
  focusSessions:   0,
  focusMinutes:    0,
  journalEntries:  0,
  moodLogs:        0,
  achievements:    0,
};

function generateMissions(): DailyMission[] {
  return [
    { id: uid(), title: 'Complete 3 Habits',    description: 'Stay consistent',       icon: '✅', xpReward: 30, completed: false, type: 'habit'   },
    { id: uid(), title: '25-min Focus Session', description: 'Deep work mode',         icon: '🎯', xpReward: 20, completed: false, type: 'focus'   },
    { id: uid(), title: 'Log Your Mood',        description: 'Emotional awareness',    icon: '💭', xpReward: 5,  completed: false, type: 'mood'    },
    { id: uid(), title: 'Write Journal Entry',  description: 'Reflect and grow',       icon: '📝', xpReward: 15, completed: false, type: 'journal' },
    { id: uid(), title: 'Bonus: 5-min Walk',    description: 'Micro-movement break',   icon: '🚶', xpReward: 25, completed: false, type: 'bonus'   },
  ];
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile:        DEFAULT_PROFILE,
      xp:             { current: 0, total: 0, level: 1, toNext: 100 },
      streak:         { current: 0, longest: 0, lastDate: '' },
      stats:          DEFAULT_STATS,
      prefs:          DEFAULT_PREFS,
      missions:       generateMissions(),
      lastActiveDate: '',

      updateProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),

      addXP: (amount) =>
        set((s) => {
          const newTotal = s.xp.total + amount;
          const prog = getXPProgress(newTotal);
          return {
            xp: {
              total:   newTotal,
              current: prog.current,
              level:   prog.level,
              toNext:  prog.toNext,
            },
          };
        }),

      updateStreak: () =>
        set((s) => {
          const today = TODAY();
          const { streak } = s;
          if (streak.lastDate === today) return {};
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yStr = yesterday.toISOString().split('T')[0];
          const newCurrent =
            streak.lastDate === yStr ? streak.current + 1 : 1;
          return {
            streak: {
              current:  newCurrent,
              longest:  Math.max(streak.longest, newCurrent),
              lastDate: today,
            },
          };
        }),

      updateStats: (delta) =>
        set((s) => ({
          stats: {
            habitsCompleted: s.stats.habitsCompleted + (delta.habitsCompleted ?? 0),
            focusSessions:   s.stats.focusSessions   + (delta.focusSessions   ?? 0),
            focusMinutes:    s.stats.focusMinutes     + (delta.focusMinutes    ?? 0),
            journalEntries:  s.stats.journalEntries   + (delta.journalEntries  ?? 0),
            moodLogs:        s.stats.moodLogs         + (delta.moodLogs        ?? 0),
            achievements:    s.stats.achievements     + (delta.achievements    ?? 0),
          },
        })),

      updatePrefs: (p) =>
        set((s) => ({ prefs: { ...s.prefs, ...p } })),

      completeMission: (id) =>
        set((s) => {
          const missions = s.missions.map((m) =>
            m.id === id && !m.completed ? { ...m, completed: true } : m
          );
          const completed = missions.find((m) => m.id === id);
          if (completed?.completed) {
            setTimeout(() => get().addXP(completed.xpReward), 0);
          }
          return { missions };
        }),

      refreshMissions: () => set({ missions: generateMissions() }),

      getLevelTitle: () => getLevelTitle(get().xp.level),
    }),
    {
      name:    'zenforge_user',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
