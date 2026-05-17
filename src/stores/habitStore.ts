import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import { uid } from '../utils/formatters';
import { TODAY, isToday, isYesterday } from '../utils/dateUtils';
import { Habit, HabitCompletion, HabitStreak, HabitWithStats } from '../types/habit.types';

interface HabitState {
  habits:      Habit[];
  completions: HabitCompletion[];
  streaks:     HabitStreak[];

  // Queries
  getHabitsWithStats:    ()             => HabitWithStats[];
  isCompletedToday:      (id: string)   => boolean;
  getStreak:             (id: string)   => HabitStreak;

  // Mutations
  addHabit:              (h: Omit<Habit, 'id' | 'createdAt'>) => Habit;
  updateHabit:           (id: string, h: Partial<Habit>)      => void;
  deleteHabit:           (id: string)                         => void;
  toggleCompletion:      (id: string)                         => { wasCompleted: boolean; xpEarned: number };
}

function computeStreak(completions: HabitCompletion[], habitId: string): HabitStreak {
  const dates = completions
    .filter((c) => c.habitId === habitId)
    .map((c) => c.completedAt)
    .sort()
    .reverse();

  if (dates.length === 0)
    return { habitId, currentStreak: 0, longestStreak: 0 };

  let current = 0;
  let longest = 0;
  let streak  = 0;
  let prev    = TODAY();

  for (const d of dates) {
    if (d === prev) {
      streak++;
    } else if (isYesterday(d) || (prev !== TODAY() && /* gap */ false)) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak  = 1;
    }
    prev = d;
  }
  longest = Math.max(longest, streak);

  // Current streak: starts from today or yesterday
  current = isToday(dates[0]) || isYesterday(dates[0]) ? streak : 0;

  return {
    habitId,
    currentStreak:  current,
    longestStreak:  longest,
    lastCompleted:  dates[0],
  };
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits:      [],
      completions: [],
      streaks:     [],

      getHabitsWithStats: () => {
        const { habits, completions } = get();
        return habits
          .filter((h) => !h.archivedAt)
          .map((h) => ({
            ...h,
            streak:         computeStreak(completions, h.id),
            completedToday: get().isCompletedToday(h.id),
          }));
      },

      isCompletedToday: (id) => {
        const today = TODAY();
        return get().completions.some(
          (c) => c.habitId === id && c.completedAt === today
        );
      },

      getStreak: (id) => computeStreak(get().completions, id),

      addHabit: (h) => {
        const habit: Habit = { ...h, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ habits: [...s.habits, habit] }));
        return habit;
      },

      updateHabit: (id, h) =>
        set((s) => ({
          habits: s.habits.map((x) => (x.id === id ? { ...x, ...h } : x)),
        })),

      deleteHabit: (id) =>
        set((s) => ({
          habits:      s.habits.filter((h) => h.id !== id),
          completions: s.completions.filter((c) => c.habitId !== id),
          streaks:     s.streaks.filter((st) => st.habitId !== id),
        })),

      toggleCompletion: (id) => {
        const wasCompleted = get().isCompletedToday(id);
        if (wasCompleted) {
          set((s) => ({
            completions: s.completions.filter(
              (c) => !(c.habitId === id && c.completedAt === TODAY())
            ),
          }));
          return { wasCompleted: true, xpEarned: 0 };
        } else {
          const completion: HabitCompletion = {
            habitId:     id,
            completedAt: TODAY(),
          };
          set((s) => ({ completions: [...s.completions, completion] }));
          const habit = get().habits.find((h) => h.id === id);
          return { wasCompleted: false, xpEarned: habit?.xpReward ?? 10 };
        }
      },
    }),
    {
      name:    'zenforge_habits',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
