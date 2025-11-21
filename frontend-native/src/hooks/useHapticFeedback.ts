import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function useHapticFeedback() {
  const trigger = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(style).catch(() => {
      });
    }
  };

  const triggerSuccess = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const triggerError = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const triggerWarning = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };

  const triggerSelection = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  return {
    trigger,
    triggerLight: () => trigger(Haptics.ImpactFeedbackStyle.Light),
    triggerMedium: () => trigger(Haptics.ImpactFeedbackStyle.Medium),
    triggerHeavy: () => trigger(Haptics.ImpactFeedbackStyle.Heavy),
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerSelection,
  };
}

