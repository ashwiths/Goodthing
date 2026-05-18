import { create } from 'zustand';
import { Audio } from 'expo-av';
import { fireHaptic } from '../../utils/haptics';
import API from '../api/api';
import { useFocusStore } from './focusStore';

export type SoundId = 'piano' | 'ocean' | 'forest' | 'rain' | 'thunder';

export interface SoundDefinition {
  id: SoundId;
  title: string;
  description: string;
  icon: string;
  source: any;
}

export const SOUNDS: SoundDefinition[] = [
  {
    id: 'piano',
    title: 'Piano Sanctuary',
    description: 'Soft cinematic piano for deep concentration.',
    icon: 'musical-notes-outline',
    source: require('../../assets/audio/piano.mp3'),
  },
  {
    id: 'ocean',
    title: 'Ocean Waves',
    description: 'Relaxing ocean waves to calm your mind.',
    icon: 'water-outline',
    source: require('../../assets/audio/ocean.mp3'),
  },
  {
    id: 'forest',
    title: 'Forest Whispers',
    description: 'Natural forest ambience with peaceful atmosphere.',
    icon: 'leaf-outline',
    source: require('../../assets/audio/forest.mp3'),
  },
  {
    id: 'rain',
    title: 'Cozy Rain',
    description: 'Gentle rainfall for cozy productivity sessions.',
    icon: 'rainy-outline',
    source: require('../../assets/audio/rain.mp3'),
  },
  {
    id: 'thunder',
    title: 'Deep Thunder',
    description: 'Deep thunder ambience for intense focus.',
    icon: 'thunderstorm-outline',
    source: require('../../assets/audio/thunder.mp3'),
  },
];

interface AmbientSoundState {
  currentSound: SoundId | null;
  isPlaying: boolean;
  volume: number;
  soundInstance: Audio.Sound | null;
  isTransitioning: boolean;

  // Real-Time Deep Focus Session State
  activeSessionId: string | null;
  sessionStartTime: Date | null;
  elapsedSeconds: number;
  startTimeoutId: any | null;
  tickIntervalId: any | null;

  playSound: (soundId: SoundId) => Promise<void>;
  pauseSound: () => Promise<void>;
  stopSound: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  cleanup: () => Promise<void>;
}

export const useAmbientSoundStore = create<AmbientSoundState>((set, get) => {
  const FADE_STEPS = 2;
  const FADE_INTERVAL = 10; // 20ms total transition (fast and ultra-responsive)

  // Helper to start the active session interval and debounced API call
  const startFocusSession = (soundId: SoundId) => {
    const { tickIntervalId, startTimeoutId } = get();

    // Clear any previous intervals or timeouts safely
    if (tickIntervalId) clearInterval(tickIntervalId);
    if (startTimeoutId) clearTimeout(startTimeoutId);

    set({
      sessionStartTime: new Date(),
      elapsedSeconds: 0,
      activeSessionId: null,
    });

    // 1. Tick up every second smoothly for high-precision live visuals
    const interval = setInterval(() => {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);

    // 2. Debounce the start request by 1.5 seconds to prevent spam during rapid switching
    const timeout = setTimeout(async () => {
      try {
        const res = await API.post('/focus/start', { ambienceType: soundId });
        if (res.data && res.data._id) {
          set({ activeSessionId: res.data._id });
        }
      } catch (err) {
        console.error('[Ambient Sound Store] Failed to start focus session in backend:', err);
      }
    }, 1500);

    set({
      tickIntervalId: interval,
      startTimeoutId: timeout,
    });
  };

  // Helper to end and persist the active session to MongoDB
  const endFocusSession = async (completed = true) => {
    const { tickIntervalId, startTimeoutId, activeSessionId, elapsedSeconds } = get();

    // Clear tick and debounce timeouts immediately
    if (tickIntervalId) clearInterval(tickIntervalId);
    if (startTimeoutId) clearTimeout(startTimeoutId);

    set({
      tickIntervalId: null,
      startTimeoutId: null,
    });

    if (activeSessionId && elapsedSeconds > 0) {
      const durationMinutes = elapsedSeconds / 60;
      try {
        await API.post('/focus/end', {
          sessionId: activeSessionId,
          durationMinutes,
          completed,
        });

        // Trigger an immediate stats and streak refresh on the Main Focus/Analytics stores!
        useFocusStore.getState().fetchFocusStats();
      } catch (err) {
        console.error('[Ambient Sound Store] Failed to persist end focus session:', err);
      }
    }

    set({
      activeSessionId: null,
      sessionStartTime: null,
      elapsedSeconds: 0,
    });
  };

  return {
    currentSound: null,
    isPlaying: false,
    volume: 0.5,
    soundInstance: null,
    isTransitioning: false,

    activeSessionId: null,
    sessionStartTime: null,
    elapsedSeconds: 0,
    startTimeoutId: null,
    tickIntervalId: null,

    playSound: async (soundId: SoundId) => {
      const { soundInstance, currentSound, volume, isTransitioning } = get();
      if (isTransitioning) return;

      fireHaptic('medium');
      set({ isTransitioning: true });

      try {
        // Toggle Active State if clicking the same sound
        if (currentSound === soundId && soundInstance) {
          if (get().isPlaying) {
            set({ isTransitioning: false });
            await get().pauseSound();
            return;
          } else {
            // Same sound but was paused -> Fast resume!
            await soundInstance.playAsync();
            set({ isPlaying: true });

            // Start focus session
            startFocusSession(soundId);

            // Fade-In
            const stepIn = volume / FADE_STEPS;
            for (let i = 0; i < FADE_STEPS; i++) {
              const currentStepVol = Math.min(volume, stepIn * (i + 1));
              try {
                await soundInstance.setVolumeAsync(currentStepVol);
              } catch (e) {}
              await new Promise((r) => setTimeout(r, FADE_INTERVAL));
            }

            try {
              await soundInstance.setVolumeAsync(volume);
            } catch (e) {}

            set({ isTransitioning: false });
            return;
          }
        }

        // Switching sounds: End previous focus session first
        await endFocusSession(true);

        // Fade-out previous sound
        if (soundInstance) {
          const initialVol = volume;
          const step = initialVol / FADE_STEPS;
          for (let i = 0; i < FADE_STEPS; i++) {
            const currentStepVol = Math.max(0, initialVol - step * (i + 1));
            try {
              await soundInstance.setVolumeAsync(currentStepVol);
            } catch (e) {}
            await new Promise((r) => setTimeout(r, FADE_INTERVAL));
          }

          try {
            await soundInstance.stopAsync();
            await soundInstance.unloadAsync();
          } catch (e) {}
          set({ soundInstance: null, isPlaying: false });
        }

        // Set state for loading new sound
        set({ currentSound: soundId });

        const targetSound = SOUNDS.find((s) => s.id === soundId);
        if (!targetSound) {
          set({ isTransitioning: false });
          return;
        }

        const { sound } = await Audio.Sound.createAsync(targetSound.source, {
          shouldPlay: false,
          isLooping: true,
          volume: 0,
        });

        set({ soundInstance: sound });

        // Play and start focus session
        await sound.playAsync();
        set({ isPlaying: true });
        startFocusSession(soundId);

        // Fade-in
        const stepIn = volume / FADE_STEPS;
        for (let i = 0; i < FADE_STEPS; i++) {
          const currentStepVol = Math.min(volume, stepIn * (i + 1));
          try {
            await sound.setVolumeAsync(currentStepVol);
          } catch (e) {}
          await new Promise((r) => setTimeout(r, FADE_INTERVAL));
        }

        try {
          await sound.setVolumeAsync(volume);
        } catch (e) {}
      } catch (error) {
        console.error('[Ambient Sound Store] Load track failed:', error);
      } finally {
        set({ isTransitioning: false });
      }
    },

    pauseSound: async () => {
      const { soundInstance, volume, isTransitioning } = get();
      if (!soundInstance || isTransitioning) return;

      set({ isTransitioning: true });
      fireHaptic('light');

      // End active focus session immediately on pause
      await endFocusSession(true);

      try {
        // Fade-out
        const initialVol = volume;
        const step = initialVol / FADE_STEPS;
        for (let i = 0; i < FADE_STEPS; i++) {
          const currentStepVol = Math.max(0, initialVol - step * (i + 1));
          try {
            await soundInstance.setVolumeAsync(currentStepVol);
          } catch (e) {}
          await new Promise((r) => setTimeout(r, FADE_INTERVAL));
        }

        await soundInstance.pauseAsync();
        set({ isPlaying: false });
      } catch (error) {
        console.error('[Ambient Sound Store] Pause failed:', error);
      } finally {
        set({ isTransitioning: false });
      }
    },

    stopSound: async () => {
      const { soundInstance, volume, isTransitioning } = get();
      if (!soundInstance || isTransitioning) return;

      set({ isTransitioning: true });

      // End focus session immediately on stop
      await endFocusSession(true);

      try {
        // Fade-out
        const initialVol = volume;
        const step = initialVol / FADE_STEPS;
        for (let i = 0; i < FADE_STEPS; i++) {
          const currentStepVol = Math.max(0, initialVol - step * (i + 1));
          try {
            await soundInstance.setVolumeAsync(currentStepVol);
          } catch (e) {}
          await new Promise((r) => setTimeout(r, FADE_INTERVAL));
        }

        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
        set({ soundInstance: null, isPlaying: false, currentSound: null });
      } catch (error) {
        console.error('[Ambient Sound Store] Stop failed:', error);
      } finally {
        set({ isTransitioning: false });
      }
    },

    setVolume: async (vol: number) => {
      const { soundInstance } = get();
      set({ volume: vol });

      if (soundInstance) {
        try {
          await soundInstance.setVolumeAsync(vol);
        } catch (e) {}
      }
    },

    cleanup: async () => {
      const { soundInstance } = get();
      await endFocusSession(true);

      if (soundInstance) {
        try {
          await soundInstance.stopAsync();
          await soundInstance.unloadAsync();
        } catch (e) {}
        set({ soundInstance: null, isPlaying: false, currentSound: null });
      }
    },
  };
});
