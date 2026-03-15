import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Push notification registration and handling for native apps.
 * Uses @capacitor/push-notifications for APNs (iOS) and FCM (Android).
 */

let pushInitialized = false;

export async function initPushNotifications(userId: string) {
  if (!Capacitor.isNativePlatform() || pushInitialized) return;

  // Lock immediately to avoid duplicate init races from multiple auth events.
  pushInitialized = true;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Ensure clean listener state before re-attaching.
    await PushNotifications.removeAllListeners();

    // Listen for registration success → store token.
    // Must be attached BEFORE register() to avoid missing fast callbacks.
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push token:', token.value);
      await saveDeviceToken(userId, token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for incoming notifications while app is open
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received in foreground:', notification);
    });

    // Listen for notification taps (app was in background)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action:', action);
      const data = action.notification.data;
      if (data?.bountyId) {
        window.location.href = `/b/${data.bountyId}`;
      } else if (data?.route) {
        window.location.href = data.route;
      }
    });

    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.log('Push permission not granted');
      pushInitialized = false;
      return;
    }

    // Register with APNs/FCM
    await PushNotifications.register();
  } catch (error) {
    pushInitialized = false;
    console.error('Push notification init failed:', error);
  }
}

async function saveDeviceToken(userId: string, token: string) {
  const platform = Capacitor.getPlatform(); // 'ios' | 'android'

  try {
    // Use raw query since table isn't in generated types yet
    const { error } = await supabase
      .from('device_push_tokens' as any)
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    if (error) {
      console.error('Failed to save push token:', error);
    }
  } catch (e) {
    console.error('Error saving device token:', e);
  }
}

export async function removePushToken() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
    pushInitialized = false;
  } catch (e) {
    console.error('Error removing push listeners:', e);
  }
}
