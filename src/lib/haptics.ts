import { Capacitor } from '@capacitor/core';

/**
 * Haptic feedback utility for native apps.
 * Silently no-ops on web.
 */

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch {}
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: typeMap[type] });
  } catch {}
}

export async function hapticSelection() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch {}
}
