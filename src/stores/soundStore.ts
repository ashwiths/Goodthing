import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';

interface SoundState {
  activeSoundId: string | null;
  volume:        number;   // 0.0 - 1.0
  isPlaying:     boolean;
  setActiveSound: (id: string | null) => void;
  setVolume:      (v: number)         => void;
  setPlaying:     (v: boolean)        => void;
  toggleSound:    (id: string)        => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      activeSoundId: null,
      volume:        0.7,
      isPlaying:     false,

      setActiveSound: (id) => set({ activeSoundId: id, isPlaying: !!id }),
      setVolume:      (v)  => set({ volume: Math.max(0, Math.min(1, v)) }),
      setPlaying:     (v)  => set({ isPlaying: v }),

      toggleSound: (id) => {
        const { activeSoundId, isPlaying } = get();
        if (activeSoundId === id) {
          set({ isPlaying: !isPlaying });
        } else {
          set({ activeSoundId: id, isPlaying: true });
        }
      },
    }),
    { name: 'zenforge_sound', storage: createJSONStorage(() => zustandAsyncStorage) }
  )
);
