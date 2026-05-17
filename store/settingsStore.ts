import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'cinematic' | 'minimalDark';
export type BlurQuality = 'minimal' | 'balanced' | 'ultra';
export type HapticLevel = 'off' | 'soft' | 'medium' | 'strong';
export type GlowIntensity = 'low' | 'medium' | 'ultra';

interface SettingsState {
  // Appearance
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  glowIntensity: GlowIntensity;
  setGlowIntensity: (level: GlowIntensity) => void;

  // Notifications
  smartAlerts: boolean;
  setSmartAlerts: (val: boolean) => void;
  soundEffects: boolean;
  setSoundEffects: (val: boolean) => void;
  focusReminders: boolean;
  setFocusReminders: (val: boolean) => void;

  // App Experience
  hapticsLevel: HapticLevel;
  setHapticsLevel: (level: HapticLevel) => void;
  blurQuality: BlurQuality;
  setBlurQuality: (quality: BlurQuality) => void;
  minimalMode: boolean;
  setMinimalMode: (val: boolean) => void;

  // Focus Environment
  deepWorkZone: boolean;
  setDeepWorkZone: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'cinematic',
      setTheme: (theme) => set({ theme }),
      accentColor: '#4FA5FF', // Electric Blue default
      setAccentColor: (accentColor) => set({ accentColor }),
      glowIntensity: 'medium',
      setGlowIntensity: (glowIntensity) => set({ glowIntensity }),

      smartAlerts: true,
      setSmartAlerts: (smartAlerts) => set({ smartAlerts }),
      soundEffects: true,
      setSoundEffects: (soundEffects) => set({ soundEffects }),
      focusReminders: true,
      setFocusReminders: (focusReminders) => set({ focusReminders }),

      hapticsLevel: 'medium',
      setHapticsLevel: (hapticsLevel) => set({ hapticsLevel }),
      blurQuality: 'balanced',
      setBlurQuality: (blurQuality) => set({ blurQuality }),
      minimalMode: false,
      setMinimalMode: (minimalMode) => set({ minimalMode }),

      deepWorkZone: false,
      setDeepWorkZone: (deepWorkZone) => set({ deepWorkZone }),
    }),
    {
      name: 'todo-premium-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
