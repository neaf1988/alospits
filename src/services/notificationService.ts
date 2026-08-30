import { STORAGE_KEYS } from '../constants/storage';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '../constants/notifications';
import type { PendingNotification } from '../types/notifications';
import { markNotificationSent, wasNotificationSent } from '../utils/notificationDedup';
import {
  buildPendingNotifications,
  loadNotificationContext,
} from '../utils/notificationRules';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

function readPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notificationPrefs);
    if (!raw) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      enabled: parsed.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
      picoPlacaEnabled:
        parsed.picoPlacaEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.picoPlacaEnabled,
      expiryAlertsEnabled:
        parsed.expiryAlertsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.expiryAlertsEnabled,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function getNotificationPreferences(): NotificationPreferences {
  return readPreferences();
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  localStorage.setItem(STORAGE_KEYS.notificationPrefs, JSON.stringify(prefs));
}

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const result = await Notification.requestPermission();
  return result;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function showViaServiceWorker(notification: PendingNotification): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration?.active) {
    return false;
  }

  registration.active.postMessage({
    type: 'SHOW_NOTIFICATION',
    payload: {
      title: notification.title,
      body: notification.body,
      tag: notification.tag,
      data: { id: notification.id },
    },
  });

  return true;
}

function showViaNotificationApi(notification: PendingNotification): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification(notification.title, {
    body: notification.body,
    tag: notification.tag,
    icon: '/pwa-192x192.png',
    lang: 'es-CO',
  });
}

export async function deliverNotification(notification: PendingNotification): Promise<void> {
  const delivered = await showViaServiceWorker(notification);
  if (!delivered) {
    showViaNotificationApi(notification);
  }
  markNotificationSent(notification.id);
}

function filterByPreferences(
  notifications: PendingNotification[],
  prefs: NotificationPreferences,
): PendingNotification[] {
  return notifications.filter((notification) => {
    if (notification.id.startsWith('pico-placa:')) {
      return prefs.picoPlacaEnabled;
    }
    return prefs.expiryAlertsEnabled;
  });
}

export async function processScheduledNotifications(
  userId: string,
  activeVehicleId: string | null,
): Promise<number> {
  const prefs = readPreferences();
  if (!prefs.enabled) {
    return 0;
  }

  if (getNotificationPermission() !== 'granted') {
    return 0;
  }

  const context = await loadNotificationContext(userId, activeVehicleId);
  const pending = filterByPreferences(buildPendingNotifications(context), prefs);
  let deliveredCount = 0;

  for (const notification of pending) {
    if (wasNotificationSent(notification.id)) {
      continue;
    }

    await deliverNotification(notification);
    deliveredCount += 1;
  }

  return deliveredCount;
}

export async function registerBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('periodicSync' in registration) {
      await (registration as ServiceWorkerRegistration & {
        periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
      }).periodicSync.register('alospits-notifications', {
        minInterval: 60 * 60 * 1000,
      });
    }
  } catch {
    // Periodic Background Sync requiere PWA instalada y permiso explícito del usuario.
  }
}
