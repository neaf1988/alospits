/**
 * Push local deshabilitado hasta definir backend/hosting.
 * Para reactivar: injectManifest + src/sw.ts, useNotificationScheduler en App.tsx,
 * NotificationPermissionBanner en el dashboard.
 */
export const PUSH_NOTIFICATIONS_ENABLED = false;

/** Hora local para aviso diario de pico y placa (spec 05) */
export const PICO_PLACA_NOTIFICATION_HOUR = 6;

/** Intervalos de alerta push antes del vencimiento (spec 05) */
export const NOTIFICATION_MILESTONE_DAYS = [30, 15, 5, 1] as const;

export type NotificationMilestoneDay = (typeof NOTIFICATION_MILESTONE_DAYS)[number];

/** Intervalo de revisión mientras la app está activa (ms) */
export const NOTIFICATION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: true,
  picoPlacaEnabled: true,
  expiryAlertsEnabled: true,
} as const;

export type NotificationPreferences = {
  enabled: boolean;
  picoPlacaEnabled: boolean;
  expiryAlertsEnabled: boolean;
};
