import { create } from 'zustand';
import API from '../api/api.js';

export const useAnalyticsStore = create((set) => ({
  productivityPercentage: 0,
  totalFocusHours: 0,
  todayFocusMinutes: 0,
  weeklyProductivityTrend: [],
  weeklyFocusTrend: [],
  loading: false,

  fetchProgressAnalytics: async () => {
    set({ loading: true });
    try {
      // Send timezone offset header to keep calculations aligned with user local time
      const offset = new Date().getTimezoneOffset();
      const response = await API.get('/analytics/progress', {
        headers: {
          'x-timezone-offset': offset.toString(),
        },
      });

      set({
        productivityPercentage: response.data.productivityPercentage || 0,
        totalFocusHours: response.data.totalFocusHours || 0,
        todayFocusMinutes: response.data.todayFocusMinutes || 0,
        weeklyProductivityTrend: response.data.weeklyProductivityTrend || [],
        weeklyFocusTrend: response.data.weeklyFocusTrend || [],
        loading: false,
      });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      const message = error.response?.data?.error || error.message || 'Failed to fetch analytics';
      console.warn('[Analytics Store] Fetch error:', message);
      return { success: false, message };
    }
  }
}));
