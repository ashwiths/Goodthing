import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../stores/userStore';

export function useHaptics() {
  const hapticsEnabled = useUserStore((s) => s.prefs.haptics);

  const light = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticsEnabled]);

  const medium = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [hapticsEnabled]);

  const heavy = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [hapticsEnabled]);

  const success = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hapticsEnabled]);

  const error = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [hapticsEnabled]);

  const warning = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [hapticsEnabled]);

  const selection = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.selectionAsync();
  }, [hapticsEnabled]);

  return { light, medium, heavy, success, error, warning, selection };
}
