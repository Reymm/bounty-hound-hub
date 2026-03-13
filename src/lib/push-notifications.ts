import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Push notification registration and handling for native apps.
 * Uses @capacitor/push-notifications for APNs (iOS) and FCM (Android).
 */

let pushInitialized = false;

export async function initPushNotifications(userId: string) {
  if (!Capacitor.isNativePlatform() || pushInitialized) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.log('Push permission not granted');
      return;
    }

    // Register with APNs/FCM
    await PushNotifications.register();

    // Listen for registration success → store token
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
      // Could show an in-app toast here
    });

    // Listen for notification taps (app was in background)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action:', action);
      const data = action.notification.data;
      // Navigate based on notification type
      if (data?.bountyId) {
        window.location.href = `/b/${data.bountyId}`;
      } else if (data?.route) {
        window.location.href = data.route;
      }
    });

    pushInitialized = true;
  } catch (error) {
    console.error('Push notification init failed:', error);
  }
}

async function saveDeviceToken(userId: string, token: string) {
  const platform = Capacitor.getPlatform(); // 'ios' | 'android'

  try {
    // Upsert the device token
    const { error } = await supabase
      .from('device_push_tokens')
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
