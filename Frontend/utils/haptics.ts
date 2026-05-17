import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../store/settingsStore';

export function fireHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  const level = useSettingsStore.getState().hapticsLevel;
  if (level === 'off') return;

  if (level === 'soft') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else if (level === 'medium') {
    Haptics.impactAsync(style === 'heavy' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } else if (level === 'strong') {
    Haptics.impactAsync(
      style === 'light' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy
    );
  }
}

export function fireSuccessHaptic() {
  const level = useSettingsStore.getState().hapticsLevel;
  if (level === 'off') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function fireErrorHaptic() {
  const level = useSettingsStore.getState().hapticsLevel;
  if (level === 'off') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
