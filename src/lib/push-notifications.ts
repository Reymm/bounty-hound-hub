import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Push notification registration and handling for native apps.
 * Uses @capacitor/push-notifications for APNs (iOS) and FCM (Android).
 */

export type NativePushPermission = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'unavailable';

type PushInitStatus = 'unsupported' | 'denied' | 'registered' | 'registration_failed' | 'save_failed';

export interface PushInitResult {
  status: PushInitStatus;
  permission: NativePushPermission;
  token?: string;
  error?: string;
}

let pushInitialized = false;
let activeUserId: string | null = null;
let initPromise: Promise<PushInitResult> | null = null;

export async function getPushPermissionState(): Promise<NativePushPermission> {
  if (!Capacitor.isNativePlatform()) return 'unavailable';

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const permissions = await PushNotifications.checkPermissions();
    return permissions.receive as NativePushPermission;
  } catch (error) {
    console.error('Unable to read push permission state:', error);
    return 'unavailable';
  }
}

export async function initPushNotifications(userId: string): Promise<PushInitResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'unsupported', permission: 'unavailable' };
  }

  if (pushInitialized && activeUserId === userId) {
    return {
      status: 'registered',
      permission: await getPushPermissionState(),
    };
  }

  if (initPromise && activeUserId === userId) {
    return initPromise;
  }

  activeUserId = userId;
  initPromise = registerForPush(userId);

  const result = await initPromise;
  initPromise = null;
  return result;
}

async function registerForPush(userId: string): Promise<PushInitResult> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();

    let finalizeRegistration: ((result: PushInitResult) => void) | null = null;
    const registrationResult = new Promise<PushInitResult>((resolve) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        pushInitialized = false;
        activeUserId = null;
        resolve({
          status: 'registration_failed',
          permission: 'granted',
          error: 'Timed out waiting for the device push token.',
        });
      }, 12000);

      finalizeRegistration = (result) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(result);
      };
    });

    await Promise.all([
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push token:', token.value);
        const saveResult = await saveDeviceToken(userId, token.value);

        if (!saveResult.ok) {
          pushInitialized = false;
          activeUserId = null;
          finalizeRegistration?.({
            status: 'save_failed',
            permission: 'granted',
            token: token.value,
            error: saveResult.error,
          });
          return;
        }

        pushInitialized = true;
        finalizeRegistration?.({
          status: 'registered',
          permission: 'granted',
          token: token.value,
        });
      }),
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        pushInitialized = false;
        activeUserId = null;
        finalizeRegistration?.({
          status: 'registration_failed',
          permission: 'granted',
          error: JSON.stringify(error),
        });
      }),
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received in foreground:', notification);
      }),
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push action:', action);
        const data = action.notification.data;
        if (data?.bountyId) {
          window.location.href = `/b/${data.bountyId}`;
        } else if (data?.route) {
          window.location.href = data.route;
        }
      }),
    ]);

    let permission = await getPushPermissionState();
    if (permission === 'prompt' || permission === 'prompt-with-rationale') {
      const requested = await PushNotifications.requestPermissions();
      permission = requested.receive as NativePushPermission;
    }

    if (permission !== 'granted') {
      pushInitialized = false;
      activeUserId = null;
      return { status: 'denied', permission };
    }

    await PushNotifications.register();
    return await registrationResult;
  } catch (error) {
    pushInitialized = false;
    activeUserId = null;
    console.error('Push notification init failed:', error);
    return {
      status: 'registration_failed',
      permission: await getPushPermissionState(),
      error: error instanceof Error ? error.message : 'Unknown push initialization error',
    };
  }
}

async function saveDeviceToken(userId: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const platform = Capacitor.getPlatform();
  let lastError = 'Unknown token save error';

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      if (attempt > 1) {
        await supabase.auth.getSession();
        await new Promise((resolve) => window.setTimeout(resolve, 750));
      }

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

      if (!error) {
        return { ok: true };
      }

      lastError = error.message;
      console.error(`Failed to save push token (attempt ${attempt}):`, error);
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown token save error';
      console.error(`Error saving device token (attempt ${attempt}):`, error);
    }
  }

  return { ok: false, error: lastError };
}

export async function removePushToken() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
    pushInitialized = false;
    activeUserId = null;
    initPromise = null;
  } catch (error) {
    console.error('Error removing push listeners:', error);
  }
}
