import { create } from 'zustand';
import API from '../api/api.js';

export const useGamificationStore = create((set, get) => ({
  streak: null,          // { currentStreak, longestStreak, lastCompletedDate, streakFreezeActive }
  achievements: [],     // Array of achievements mapped with unlocked status
  badges: [],           // Unlocked badges
  scoreDetails: null,   // { productivityScore, level, levelProgress, rank, historyLogs }
  loading: false,
  newlyUnlockedBadge: null, // holds definition of newly unlocked badge to display popup

  // Clear active unlock popup modal
  clearUnlockedBadgePopup: () => {
    set({ newlyUnlockedBadge: null });
  },

  // Set unlock badge manually (e.g., for mock/local triggers or manual check results)
  setUnlockedBadgePopup: (badge) => {
    set({ newlyUnlockedBadge: badge });
  },

  // Fetch all gamification statistics simultaneously
  fetchGamificationStats: async () => {
    set({ loading: true });
    try {
      const [streakRes, achievementsRes, scoreRes, badgesRes] = await Promise.all([
        API.get('/gamification/streak'),
        API.get('/gamification/achievements'),
        API.get('/gamification/productivity-score'),
        API.get('/gamification/badges')
      ]);

      set({
        streak: streakRes.data,
        achievements: achievementsRes.data,
        scoreDetails: scoreRes.data,
        badges: badgesRes.data,
        loading: false
      });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to fetch gamification stats';
      console.warn('[Gamification Store] Fetch error:', message);
      return { success: false, message };
    }
  },

  // Purchase Duolingo-style Streak Shield
  purchaseStreakFreeze: async () => {
    set({ loading: true });
    try {
      const response = await API.post('/gamification/streak/update', { buyFreeze: true });
      
      // Re-fetch all stats to update score and shield state in the UI
      await get().fetchGamificationStats();
      
      set({ loading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to purchase streak freeze';
      return { success: false, message };
    }
  }
}));
