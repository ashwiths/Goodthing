import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import API from '../api/api.js';
import { useGamificationStore } from './gamificationStore';
import { useAmbientSoundStore } from './ambientSoundStore';
import { fireSuccessHaptic, fireHaptic } from '../../utils/haptics';

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
    const { duration, musicType, soundInstance } = get();
    fireHaptic('medium');

    const startedAt = new Date();
    let sessionId = `local-session-${Date.now()}`;

    // 1. Log start to backend
    try {
      const response = await API.post('/focus/start', {
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
      sessionStartTime: startedAt,
      ambientStats: {}
    });
  },

  pauseSession: async () => {
    fireHaptic('light');
    set({ isPaused: true, isPlaying: false });
  },

  resumeSession: async () => {
    fireHaptic('light');
    set({ isPaused: false, isPlaying: true });
  },

  tick: () => {
    const { timeRemaining, isActive, isPaused, ambientStats } = get();
    if (!isActive || isPaused) return;

    // Dynamically increment active ambient sound listening duration in seconds
    const ambientState = useAmbientSoundStore.getState();
    if (ambientState?.isPlaying && ambientState?.currentSound) {
      const currentStats = { ...ambientStats };
      currentStats[ambientState.currentSound] = (currentStats[ambientState.currentSound] || 0) + 1;
      set({ ambientStats: currentStats });
    }

    if (timeRemaining <= 1) {
      set({ timeRemaining: 0 });
      get().completeSession(true);
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  completeSession: async (completed) => {
    const { sessionId, duration, timeRemaining, musicType, sessionStartTime, ambientStats } = get();
    const elapsedSeconds = duration - timeRemaining;
    const endedAt = new Date();

    fireHaptic('heavy');
    set({ isActive: false, isPaused: false });

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
        const response = await API.post('/focus/complete', {
          sessionId,
          completed: true,
          duration,
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
          endedAt,
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
        await API.post('/focus/complete', {
          sessionId,
          completed: false,
          duration: elapsedSeconds,
          ambientStats
        });
      } catch (error) {
        console.log('[Focus Store] Log exit focus offline skipped.');
      }
    }

    // Refresh gamification stats globally to show the newly awarded XP scores!
    await useGamificationStore.getState().fetchGamificationStats();
    await get().fetchFocusStats();
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
