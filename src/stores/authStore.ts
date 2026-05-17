import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../utils/storage';
import { hashPin } from '../utils/formatters';

interface AuthState {
  isOnboarded:       boolean;
  isLocked:          boolean;
  appLockEnabled:    boolean;
  biometricsEnabled: boolean;
  pinHash:           string | null;

  // Actions
  completeOnboarding: ()           => void;
  enableAppLock:      (pin: string) => void;
  disableAppLock:     ()           => void;
  lock:               ()           => void;
  unlock:             ()           => void;
  verifyPin:          (pin: string) => boolean;
  toggleBiometrics:   (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isOnboarded:       false,
      isLocked:          false,
      appLockEnabled:    false,
      biometricsEnabled: false,
      pinHash:           null,

      completeOnboarding: () => set({ isOnboarded: true }),

      enableAppLock: (pin) =>
        set({ appLockEnabled: true, pinHash: hashPin(pin), isLocked: false }),

      disableAppLock: () =>
        set({ appLockEnabled: false, pinHash: null, isLocked: false }),

      lock: () => {
        if (get().appLockEnabled) set({ isLocked: true });
      },

      unlock: () => set({ isLocked: false }),

      verifyPin: (pin) => {
        const { pinHash } = get();
        return !!pinHash && hashPin(pin) === pinHash;
      },

      toggleBiometrics: (val) => set({ biometricsEnabled: val }),
    }),
    {
      name:    'zenforge_auth',
      storage: createJSONStorage(() => zustandAsyncStorage),
    }
  )
);
