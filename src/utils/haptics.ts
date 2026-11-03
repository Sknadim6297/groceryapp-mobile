import { Platform } from 'react-native';

/** Soft selection feedback. Safe no-op if the module is unavailable. */
export async function hapticSelection(): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.selectionAsync();
  } catch {
    // Expo Go / web / missing module — ignore.
  }
}

export async function hapticLight(): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
}

export async function hapticSuccess(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}
