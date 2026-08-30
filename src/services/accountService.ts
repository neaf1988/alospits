import type { AlertSettings } from '../constants/alertSettings';
import type { NotificationPreferences } from '../constants/notifications';
import { STORAGE_KEYS } from '../constants/storage';
import type { ThemeMode } from '../stores/themeStore';
import { getTheme, setTheme } from '../stores/themeStore';
import { createEmptyDriverLicenses } from '../utils/driverLicenseUtils';
import { saveAlertSettings, getAlertSettings } from './alertSettingsService';
import { db } from './db';
import { saveNotificationPreferences, getNotificationPreferences } from './notificationService';
import { ensureDefaultPicoPlacaSchedules } from './picoPlacaService';
import { enqueueSyncMutation } from './syncOutboxService';
import type {
  FuelLog,
  LegalDocument,
  MaintenanceLog,
  PicoPlacaSchedule,
  TaxRecord,
  UserProfile,
  Vehicle,
} from '../types';

export class AccountServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountServiceError';
  }
}

export const BACKUP_VERSION = 2 as const;
export const BACKUP_APP_ID = 'alospits' as const;

export type BackupVersion = 1 | 2;

export interface BackupPreferences {
  theme?: ThemeMode;
  alertSettings?: AlertSettings;
  notificationPrefs?: NotificationPreferences;
}

export interface AccountBackupPayload {
  version: BackupVersion;
  exportedAt: string;
  app?: typeof BACKUP_APP_ID;
  userProfile: UserProfile;
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  legalDocuments: LegalDocument[];
  taxRecords: TaxRecord[];
  picoPlacaSchedules?: PicoPlacaSchedule[];
  preferences?: BackupPreferences;
}

export interface BackupSummary {
  vehicles: number;
  fuelLogs: number;
  maintenanceLogs: number;
  legalDocuments: number;
  taxRecords: number;
  picoPlacaSchedules: number;
  exportedAt: string;
}

export interface ImportBackupResult {
  summary: BackupSummary;
  preferencesRestored: boolean;
}

export function summarizeBackup(backup: AccountBackupPayload): BackupSummary {
  return {
    vehicles: backup.vehicles.length,
    fuelLogs: backup.fuelLogs.length,
    maintenanceLogs: backup.maintenanceLogs.length,
    legalDocuments: backup.legalDocuments.length,
    taxRecords: backup.taxRecords.length,
    picoPlacaSchedules: backup.picoPlacaSchedules?.length ?? 0,
    exportedAt: backup.exportedAt,
  };
}

function readBackupPreferences(): BackupPreferences {
  return {
    theme: getTheme(),
    alertSettings: getAlertSettings(),
    notificationPrefs: getNotificationPreferences(),
  };
}

function restoreBackupPreferences(preferences?: BackupPreferences): boolean {
  if (!preferences) {
    return false;
  }

  if (preferences.theme === 'light' || preferences.theme === 'dark') {
    setTheme(preferences.theme);
  }
  if (preferences.alertSettings) {
    saveAlertSettings(preferences.alertSettings);
  }
  if (preferences.notificationPrefs) {
    saveNotificationPreferences(preferences.notificationPrefs);
  }

  return true;
}

export async function getUserProfile(userId: string): Promise<UserProfile | undefined> {
  return db.userProfiles.get(userId);
}

export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<UserProfile> {
  const profile = await db.userProfiles.get(userId);
  if (!profile) {
    throw new AccountServiceError('Perfil no encontrado.');
  }

  const trimmed = displayName.trim();
  const updated: UserProfile = {
    ...profile,
    displayName: trimmed || undefined,
  };

  await db.userProfiles.put(updated);
  await enqueueSyncMutation(userId, 'userProfile', userId, 'update', updated);
  return updated;
}

export async function exportAccountBackup(userId: string): Promise<AccountBackupPayload> {
  const profile = await db.userProfiles.get(userId);
  if (!profile) {
    throw new AccountServiceError('Perfil no encontrado.');
  }

  const vehicles = await db.vehicles.where('userId').equals(userId).toArray();
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);

  const [fuelLogs, maintenanceLogs, legalDocuments, taxRecords, picoPlacaSchedules] =
    await Promise.all([
      vehicleIds.length > 0
        ? db.fuelLogs.where('vehicleId').anyOf(vehicleIds).toArray()
        : Promise.resolve([]),
      vehicleIds.length > 0
        ? db.maintenanceLogs.where('vehicleId').anyOf(vehicleIds).toArray()
        : Promise.resolve([]),
      vehicleIds.length > 0
        ? db.legalDocuments.where('vehicleId').anyOf(vehicleIds).toArray()
        : Promise.resolve([]),
      vehicleIds.length > 0
        ? db.taxRecords.where('vehicleId').anyOf(vehicleIds).toArray()
        : Promise.resolve([]),
      db.picoPlacaSchedules.toArray(),
    ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: BACKUP_APP_ID,
    userProfile: profile,
    vehicles,
    fuelLogs,
    maintenanceLogs,
    legalDocuments,
    taxRecords,
    picoPlacaSchedules,
    preferences: readBackupPreferences(),
  };
}

function isBackupPayload(value: unknown): value is AccountBackupPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const version = record.version;

  if (version !== 1 && version !== 2) {
    return false;
  }

  if (record.app !== undefined && record.app !== BACKUP_APP_ID) {
    return false;
  }

  return (
    typeof record.exportedAt === 'string' &&
    typeof record.userProfile === 'object' &&
    Array.isArray(record.vehicles) &&
    Array.isArray(record.fuelLogs) &&
    Array.isArray(record.maintenanceLogs) &&
    Array.isArray(record.legalDocuments) &&
    Array.isArray(record.taxRecords)
  );
}

export async function importAccountBackup(
  userId: string,
  raw: unknown,
): Promise<ImportBackupResult> {
  if (!isBackupPayload(raw)) {
    throw new AccountServiceError('El archivo no es un respaldo válido de A Los Pits.');
  }

  const backup = raw;
  const profile: UserProfile = {
    ...backup.userProfile,
    id: userId,
  };

  const vehicles = backup.vehicles.map((vehicle) => ({
    ...vehicle,
    userId,
  }));

  const vehicleIdSet = new Set(vehicles.map((vehicle) => vehicle.id));
  const filterByVehicle = <T extends { vehicleId: string }>(items: T[]) =>
    items.filter((item) => vehicleIdSet.has(item.vehicleId));

  const fuelLogs = filterByVehicle(backup.fuelLogs);
  const maintenanceLogs = filterByVehicle(backup.maintenanceLogs);
  const legalDocuments = filterByVehicle(backup.legalDocuments);
  const taxRecords = filterByVehicle(backup.taxRecords);

  if (profile.activeVehicleId && !vehicleIdSet.has(profile.activeVehicleId)) {
    profile.activeVehicleId = vehicles[0]?.id ?? '';
  }

  const existingVehicles = await db.vehicles.where('userId').equals(userId).toArray();
  const existingVehicleIds = existingVehicles.map((vehicle) => vehicle.id);
  const picoPlacaSchedules =
    backup.version >= 2 && Array.isArray(backup.picoPlacaSchedules)
      ? backup.picoPlacaSchedules
      : null;

  await db.transaction('rw', db.tables, async () => {
    if (existingVehicleIds.length > 0) {
      await db.fuelLogs.where('vehicleId').anyOf(existingVehicleIds).delete();
      await db.maintenanceLogs.where('vehicleId').anyOf(existingVehicleIds).delete();
      await db.legalDocuments.where('vehicleId').anyOf(existingVehicleIds).delete();
      await db.taxRecords.where('vehicleId').anyOf(existingVehicleIds).delete();
      await db.vehicles.where('userId').equals(userId).delete();
    }

    await db.userProfiles.put(profile);
    if (vehicles.length > 0) {
      await db.vehicles.bulkAdd(vehicles);
    }
    if (fuelLogs.length > 0) {
      await db.fuelLogs.bulkAdd(fuelLogs);
    }
    if (maintenanceLogs.length > 0) {
      await db.maintenanceLogs.bulkAdd(maintenanceLogs);
    }
    if (legalDocuments.length > 0) {
      await db.legalDocuments.bulkAdd(legalDocuments);
    }
    if (taxRecords.length > 0) {
      await db.taxRecords.bulkAdd(taxRecords);
    }

    if (picoPlacaSchedules !== null) {
      await db.picoPlacaSchedules.clear();
      if (picoPlacaSchedules.length > 0) {
        await db.picoPlacaSchedules.bulkAdd(picoPlacaSchedules);
      }
    }

    await db.syncOutbox.where('userId').equals(userId).delete();
  });

  if (picoPlacaSchedules !== null && picoPlacaSchedules.length === 0) {
    await ensureDefaultPicoPlacaSchedules();
  }

  if (profile.activeVehicleId) {
    localStorage.setItem(STORAGE_KEYS.activeVehicleId, profile.activeVehicleId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeVehicleId);
  }

  const preferencesRestored = restoreBackupPreferences(backup.preferences);

  const normalizedBackup: AccountBackupPayload = {
    ...backup,
    userProfile: profile,
    vehicles,
    fuelLogs,
    maintenanceLogs,
    legalDocuments,
    taxRecords,
    picoPlacaSchedules: picoPlacaSchedules ?? backup.picoPlacaSchedules,
  };

  return {
    summary: summarizeBackup(normalizedBackup),
    preferencesRestored,
  };
}

export async function resetLocalAccount(userId: string): Promise<string> {
  const existingVehicles = await db.vehicles.where('userId').equals(userId).toArray();
  const vehicleIds = existingVehicles.map((vehicle) => vehicle.id);
  const now = new Date().toISOString();

  await db.transaction('rw', db.tables, async () => {
    if (vehicleIds.length > 0) {
      await db.fuelLogs.where('vehicleId').anyOf(vehicleIds).delete();
      await db.maintenanceLogs.where('vehicleId').anyOf(vehicleIds).delete();
      await db.legalDocuments.where('vehicleId').anyOf(vehicleIds).delete();
      await db.taxRecords.where('vehicleId').anyOf(vehicleIds).delete();
    }

    await db.vehicles.where('userId').equals(userId).delete();
    await db.syncOutbox.where('userId').equals(userId).delete();

    await db.userProfiles.put({
      id: userId,
      email: '',
      activeVehicleId: '',
      driverLicenses: createEmptyDriverLicenses(),
      createdAt: now,
    });
  });

  localStorage.removeItem(STORAGE_KEYS.activeVehicleId);
  return userId;
}
