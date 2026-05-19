import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import API from '../api/api.js';
import { useGamificationStore } from './gamificationStore';
import { useAmbientSoundStore } from './ambientSoundStore';
import { useAnalyticsStore } from './analyticsStore';
import { fireSuccessHaptic, fireHaptic } from '../../utils/haptics';

const saveTimerState = async (state) => {
  try {
    const data = {
      duration: state.duration,
      isActive: state.isActive,
      isPaused: state.isPaused,
      sessionId: state.sessionId,
      sessionStartTime: state.sessionStartTime ? (typeof state.sessionStartTime === 'object' ? state.sessionStartTime.toISOString() : state.sessionStartTime) : null,
      musicType: state.musicType,
      ambientStats: state.ambientStats,
    };
    await AsyncStorage.setItem('@zenforge_timer_state', JSON.stringify(data));
  } catch (error) {
    console.warn('[Focus Store] Failed to save timer state:', error.message);
  }
};

const clearTimerState = async () => {
  try {
    await AsyncStorage.removeItem('@zenforge_timer_state');
  } catch (error) {
    console.warn('[Focus Store] Failed to clear timer state:', error.message);
  }
};

const AUDIO_MAP = {
  lofi: require('../../assets/audio/piano.mp3'),
  rain: require('../../assets/audio/rain.mp3'),
  forest: require('../../assets/audio/forest.mp3'),
  'brown-noise': require('../../assets/audio/rain.mp3'),
  ocean: require('../../assets/audio/ocean.mp3'),
  piano: require('../../assets/audio/piano.mp3'),
  'deep-space': require('../../assets/audio/ocean.mp3'),
};

export const useFocusStore = create((set, get) => ({
  // Timer States
  duration: 1500, // default 25 mins in seconds
  timeRemaining: 1500,
  isActive: false,
  isPaused: false,
  timerMode: '25', // '25' | '50' | '90' | 'custom'
  sessionId: null,
  sessionStartTime: null,

  // Audio States
  musicType: 'lofi',
  isPlaying: false,
  volume: 0.5,
  soundInstance: null,

  // Stats & history
  stats: {
    currentStreak: 0,
    longestStreak: 0,
    totalFocusHours: 0,
    longestSession: 0,
    streakHistory: []
  },
  history: [],
  analyticsLogs: [],
  ambientStats: {}, // maps soundId -> active duration in seconds during current session

  // Offline Caching & Sync States
  offlineSessions: [],
  syncing: false,

  // AI Adaptive States
  earlyExitsCount: 0, // tracks early exits to recommend shorter timers
  completionSuccessCount: 0, // tracks success sessions to award XP multipliers
  recommendedDuration: 1500, // AI suggested duration

  // ─── INITIALIZE & FETCH STATS ────────────────────────────────────────────────
  fetchFocusStats: async () => {
    try {
      const [statsRes, historyRes, analyticsRes] = await Promise.all([
        API.get('/focus/stats'),
        API.get('/focus/history'),
        API.get('/focus/analytics')
      ]);

      set({
        stats: statsRes.data,
        history: historyRes.data,
        analyticsLogs: analyticsRes.data
      });
    } catch (error) {
      console.warn('[Focus Store] Fetch focus stats error (offline or server error):', error.message);
      // Attempt load stats from local cache
      const cachedStats = await AsyncStorage.getItem('cached_focus_stats');
      if (cachedStats) {
        set({ stats: JSON.parse(cachedStats) });
      }
    }
  },

  restoreSession: async () => {
    try {
      const saved = await AsyncStorage.getItem('@zenforge_timer_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.isActive) {
          if (state.isPaused) {
            set({
              duration: state.duration,
              timeRemaining: state.timeRemaining,
              isActive: true,
              isPaused: true,
              sessionId: state.sessionId,
              sessionStartTime: state.sessionStartTime,
              musicType: state.musicType || 'lofi',
              ambientStats: state.ambientStats || {},
            });
          } else {
            const elapsedSeconds = Math.floor((Date.now() - new Date(state.sessionStartTime).getTime()) / 1000);
            const remaining = state.duration - elapsedSeconds;

            if (remaining <= 0) {
              // Completed in background!
              set({
                duration: state.duration,
                timeRemaining: 0,
                isActive: false,
                isPaused: false,
                sessionId: state.sessionId,
                sessionStartTime: state.sessionStartTime,
                musicType: state.musicType || 'lofi',
                ambientStats: state.ambientStats || {},
              });
              // Send completion details
              await get().completeSession(true);
            } else {
              set({
                duration: state.duration,
                timeRemaining: remaining,
                isActive: true,
                isPaused: false,
                sessionId: state.sessionId,
                sessionStartTime: state.sessionStartTime,
                musicType: state.musicType || 'lofi',
                ambientStats: state.ambientStats || {},
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Focus Store] Failed to restore session:', e.message);
    }
  },

  // ─── TIMER CONTROLS ─────────────────────────────────────────────────────────
  setTimerMode: (mode, customSeconds = 1500) => {
    fireHaptic('light');
    let seconds = 1500;
    if (mode === '50') seconds = 3000;
    else if (mode === '90') seconds = 5400;
    else if (mode === 'custom') seconds = customSeconds;

    set({
      timerMode: mode,
      duration: seconds,
      timeRemaining: seconds,
      isActive: false,
      isPaused: false
    });
  },

  startSession: async () => {
    const { duration, musicType } = get();
    fireHaptic('medium');

    const startedAt = new Date();
    let sessionId = `local-session-${Date.now()}`;

    // 1. Log start to backend
    try {
      const response = await API.post('/focus/start', {
        ambienceType: musicType,
        musicType,
        duration
      });
      sessionId = response.data._id;
    } catch (error) {
      console.log('[Focus Store] Offline or server start error, running locally:', error.message);
    }

    set({
      isActive: true,
      isPaused: false,
      timeRemaining: duration,
      sessionId,
      sessionStartTime: startedAt.toISOString(),
      ambientStats: {}
    });

    await saveTimerState(get());
  },

  pauseSession: async () => {
    fireHaptic('light');
    const { duration, sessionStartTime } = get();
    let elapsedSeconds = 0;
    if (sessionStartTime) {
      elapsedSeconds = Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 1000);
    }
    const remaining = Math.max(0, duration - elapsedSeconds);

    set({
      isPaused: true,
      isPlaying: false,
      timeRemaining: remaining
    });

    await saveTimerState(get());
  },

  resumeSession: async () => {
    fireHaptic('light');
    const { timeRemaining } = get();
    
    set({
      isPaused: false,
      isPlaying: true,
      duration: timeRemaining,
      sessionStartTime: new Date().toISOString()
    });

    await saveTimerState(get());
  },

  tick: () => {
    const { duration, isActive, isPaused, ambientStats, sessionStartTime } = get();
    if (!isActive || isPaused || !sessionStartTime) return;

    // Calculate actual elapsed seconds from the start timestamp
    const elapsedSeconds = Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 1000);
    const remaining = Math.max(0, duration - elapsedSeconds);

    // Dynamically increment active ambient sound listening duration in seconds
    const ambientState = useAmbientSoundStore.getState();
    if (ambientState?.isPlaying && ambientState?.currentSound) {
      const currentStats = { ...ambientStats };
      currentStats[ambientState.currentSound] = (currentStats[ambientState.currentSound] || 0) + 1;
      set({ ambientStats: currentStats });
    }

    set({ timeRemaining: remaining });

    if (remaining <= 0) {
      get().completeSession(true);
    }
  },

  completeSession: async (completed) => {
    const { sessionId, duration, timeRemaining, musicType, sessionStartTime, ambientStats } = get();
    
    // Exact duration calculations
    let elapsedSeconds = duration - timeRemaining;
    if (!completed && sessionStartTime) {
      elapsedSeconds = Math.min(duration, Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 1000));
    }
    const durationMinutes = Math.max(0, elapsedSeconds / 60);

    fireHaptic('heavy');
    set({ isActive: false, isPaused: false });
    await clearTimerState();

    if (completed) {
      // Confetti & Haptic celebration trigger
      fireSuccessHaptic();
      set((state) => ({
        completionSuccessCount: state.completionSuccessCount + 1,
        earlyExitsCount: 0 // reset early exits on success
      }));

      // Adaptive AI: If completed 3 sessions, increase recommended suggestion
      if (get().completionSuccessCount >= 3) {
        set({ recommendedDuration: Math.min(5400, get().duration + 900) });
      }

      // Record to backend
      try {
        const response = await API.post('/focus/end', {
          sessionId,
          completed: true,
          durationMinutes: duration / 60,
          ambientStats
        });

        if (response.data.success) {
          // Trigger global achievements modal from gamificationStore if any badge was unlocked
          if (response.data.newlyUnlocked && response.data.newlyUnlocked.length > 0) {
            // Display first newly unlocked focus achievements
            const badgeObj = {
              title: response.data.newlyUnlocked[0].replace(/_/g, ' '),
              sub: 'Deep Work Mastery Milestone reached!',
              icon: 'timer',
              rarity: 'epic',
              xp: 100
            };
            useGamificationStore.getState().setUnlockedBadgePopup(badgeObj);
          }
        }
      } catch (error) {
        console.log('[Focus Store] Complete Focus Offline - caching session locally:', error.message);
        // Offline cache
        const localCacheItem = {
          sessionId,
          musicType,
          duration,
          completed: true,
          startedAt: sessionStartTime,
          endedAt: new Date().toISOString(),
          xpEarned: 20,
          ambientStats
        };

        const currentCaches = [...get().offlineSessions, localCacheItem];
        set({ offlineSessions: currentCaches });
        await AsyncStorage.setItem('offline_focus_sessions', JSON.stringify(currentCaches));
      }
    } else {
      // Early exit logic
      set((state) => ({
        earlyExitsCount: state.earlyExitsCount + 1,
        completionSuccessCount: 0 // reset success streak
      }));

      // Adaptive AI: If exited early repeatedly, reduce suggested duration!
      if (get().earlyExitsCount >= 2) {
        set({ recommendedDuration: Math.max(900, get().duration - 600) }); // drop 10 mins
      }

      try {
        await API.post('/focus/end', {
          sessionId,
          completed: false,
          durationMinutes,
          ambientStats
        });
      } catch (error) {
        console.log('[Focus Store] Log exit focus offline skipped.');
      }
    }

    // Refresh gamification stats globally to show the newly awarded XP scores!
    await useGamificationStore.getState().fetchGamificationStats();
    await get().fetchFocusStats();
    await useAnalyticsStore.getState().fetchProgressAnalytics();
  },

  // ─── AUDIO SYSTEM ───────────────────────────────────────────────────────────
  loadAndPlayAudio: async () => {
    const { musicType, soundInstance, volume } = get();

    // Clean up current active loop
    await get().cleanupAudio();

    try {
      const source = AUDIO_MAP[musicType] || AUDIO_MAP.lofi;
      
      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay: true,
          isLooping: true,
          volume: volume,
        }
      );

      set({ soundInstance: sound, isPlaying: true });
    } catch (error) {
      console.error('[Focus Store] Sound load failed:', error);
    }
  },

  setMusic: async (type) => {
    fireHaptic('light');
    set({ musicType: type });

    if (get().isActive && !get().isPaused) {
      await get().loadAndPlayAudio();
    }
  },

  setVolume: async (vol) => {
    const { soundInstance } = get();
    set({ volume: vol });

    if (soundInstance) {
      try {
        await soundInstance.setVolumeAsync(vol);
      } catch (e) {}
    }
  },

  cleanupAudio: async () => {
    const { soundInstance } = get();
    if (soundInstance) {
      try {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
      } catch (e) {}
      set({ soundInstance: null, isPlaying: false });
    }
  },

  // ─── OFFLINE SYNC ───────────────────────────────────────────────────────────
  syncOfflineSessions: async () => {
    const { offlineSessions, syncing } = get();
    if (offlineSessions.length === 0 || syncing) return;

    set({ syncing: true });
    console.log(`[Focus Store] Starting bulk offline sync for ${offlineSessions.length} sessions...`);

    try {
      for (const sess of offlineSessions) {
        // Sync completed session
        await API.post('/focus/complete', {
          sessionId: sess.sessionId,
          completed: true,
          duration: sess.duration
        });
      }

      // Sync complete, clean storage
      set({ offlineSessions: [] });
      await AsyncStorage.removeItem('offline_focus_sessions');
      console.log('[Focus Store] Sync completed successfully!');
    } catch (error) {
      console.warn('[Focus Store] Sync failed (remains cached):', error.message);
    } finally {
      set({ syncing: false });
      await get().fetchFocusStats();
      await useGamificationStore.getState().fetchGamificationStats();
    }
  },

  loadOfflineCache: async () => {
    try {
      const cached = await AsyncStorage.getItem('offline_focus_sessions');
      if (cached) {
        set({ offlineSessions: JSON.parse(cached) });
      }
    } catch (e) {}
  }
}));
