import { STORAGE_KEYS } from '../constants/storage';
import {
  DEFAULT_ALERT_SETTINGS,
  type AlertSettings,
} from '../constants/alertSettings';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(settings: Partial<AlertSettings>): AlertSettings {
  return {
    defaultComplianceAlertDays: clamp(
      settings.defaultComplianceAlertDays ?? DEFAULT_ALERT_SETTINGS.defaultComplianceAlertDays,
      1,
      365,
    ),
    taxAlertDaysBefore: clamp(
      settings.taxAlertDaysBefore ?? DEFAULT_ALERT_SETTINGS.taxAlertDaysBefore,
      1,
      365,
    ),
    maintenanceKmWarning: clamp(
      settings.maintenanceKmWarning ?? DEFAULT_ALERT_SETTINGS.maintenanceKmWarning,
      50,
      5000,
    ),
    maintenanceDaysWarning: clamp(
      settings.maintenanceDaysWarning ?? DEFAULT_ALERT_SETTINGS.maintenanceDaysWarning,
      1,
      365,
    ),
  };
}

export function getAlertSettings(): AlertSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.alertSettings);
    if (!raw) {
      return { ...DEFAULT_ALERT_SETTINGS };
    }
    return normalize(JSON.parse(raw) as Partial<AlertSettings>);
  } catch {
    return { ...DEFAULT_ALERT_SETTINGS };
  }
}

export function saveAlertSettings(settings: AlertSettings): AlertSettings {
  const normalized = normalize(settings);
  localStorage.setItem(STORAGE_KEYS.alertSettings, JSON.stringify(normalized));
  return normalized;
}

export function getDefaultComplianceAlertDays(): number {
  return getAlertSettings().defaultComplianceAlertDays;
}
