// src/lib/notifications.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type * as NotificationsType from 'expo-notifications';

// Lazy-load the module so importing this file on web doesn't trigger listeners.
async function N(): Promise<typeof import('expo-notifications')> {
  return await import('expo-notifications');
}

/** Call once on app boot (native only) to control foreground display behavior. */
export async function installForegroundNotificationHandler() {
  if (Platform.OS === 'web') return;
  const Notifications = await N();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Android requires a channel to show notifications. */
export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  const Notifications = await N();
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Standard',
    importance: (await N()).AndroidImportance.HIGH,
    lockscreenVisibility: (await N()).AndroidNotificationVisibility.PUBLIC,
  });
}

/** Ask for permissions. Returns true if granted or iOS PROVISIONAL. */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await N();

  let settings = await Notifications.getPermissionsAsync();
  const hasAny =
    settings.granted || settings.ios?.status === (await N()).IosAuthorizationStatus.PROVISIONAL;

  if (hasAny) return true;

  settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowDisplayInCarPlay: true,
    },
  });

  return (
    settings.granted || settings.ios?.status === (await N()).IosAuthorizationStatus.PROVISIONAL
  );
}

/** Schedule a daily local reminder (native). */
export async function scheduleDailyReminder(hour = 18, minute = 0) {
  const Notifications = await N();
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Dagens påminnelse',
      body: 'Kika på dina favoriter eller hitta nya Pokémon!',
      // sound: Platform.OS === 'ios' ? 'default' : undefined, // enable if you want sound
    },
    trigger: {
      type: (await N()).SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'default' : undefined,
    } as NotificationsType.DailyTriggerInput,
  });
}

export async function cancelAllReminders() {
  const Notifications = await N();
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification() {
  const Notifications = await N();
  await ensureAndroidChannel();
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Testavisering', body: 'Detta är en testnotis 🎉' },
    trigger: null, // fire immediately
  });
}

/**
 * Register for push (iOS/Android/Web). On web we also register a service worker
 * so pushes can arrive when the tab is closed.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      try {
        // Clean up typical CRA/Vite workers so they don't clash.
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
          if (url.endsWith('/service-worker.js')) await r.unregister();
        }
        // Try relative first, then absolute (works with Expo web dev/prod).
        try {
          await navigator.serviceWorker.register('expo-service-worker.js');
        } catch {
          await navigator.serviceWorker.register('/expo-service-worker.js');
        }
      } catch (e) {
        console.warn('SW registration failed', e);
      }
    }

    const Notifications = await N();

    let settings = await Notifications.getPermissionsAsync();
    const hasAny =
      settings.granted || settings.ios?.status === (await N()).IosAuthorizationStatus.PROVISIONAL;

    if (!hasAny) {
      settings = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
        },
      });
    }

    const nowHas =
      settings.granted || settings.ios?.status === (await N()).IosAuthorizationStatus.PROVISIONAL;
    if (!nowHas) return null;

    // Needed especially on web
    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    if (!projectId) {
      console.warn(
        'Saknar EAS projectId. Lägg till "extra.eas.projectId" i app.json för att hämta push-token, särskilt på web.',
      );
    }

    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data ?? null;
  } catch {
    return null;
  }
}

/** Send a quick test push via the Expo Push API (client-side). */
export async function sendExpoTestPush(expoPushToken: string) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: expoPushToken,
        title: 'Test (Push)',
        body: 'Detta är en testpush 🎯',
      }),
    });
  } catch {
    // ignore
  }
}

// ---- Optional listeners (use if you want to react to notifications) ----
let receivedSub: NotificationsType.Subscription | null = null;
let responseSub: NotificationsType.Subscription | null = null;

export async function listenNotifications(cb: (n: NotificationsType.Notification) => void) {
  const Notifications = await N();
  if (!receivedSub) receivedSub = Notifications.addNotificationReceivedListener(cb);
  return () => {
    receivedSub?.remove?.();
    receivedSub = null;
  };
}

export async function listenNotificationResponses(
  cb: (r: NotificationsType.NotificationResponse) => void,
) {
  const Notifications = await N();
  if (!responseSub) responseSub = Notifications.addNotificationResponseReceivedListener(cb);
  Notifications.getLastNotificationResponseAsync().then((res) => {
    if (res) cb(res);
  });
  return () => {
    responseSub?.remove?.();
    responseSub = null;
  };
}
