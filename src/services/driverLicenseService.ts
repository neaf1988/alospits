import { db } from './db';
import type { DriverLicenses, UserProfile } from '../types';
import {
  migrateDriverLicenses,
  normalizeDriverLicenses,
} from '../utils/driverLicenseUtils';
import { enqueueSyncMutation } from './syncOutboxService';

export class DriverLicenseServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriverLicenseServiceError';
  }
}

function validateLicenses(licenses: DriverLicenses): DriverLicenses {
  const normalized = normalizeDriverLicenses(licenses);

  for (const [licenseClass, entry] of Object.entries(normalized) as [
    keyof DriverLicenses,
    DriverLicenses[keyof DriverLicenses],
  ][]) {
    if (entry.active && !entry.expiryDate) {
      throw new DriverLicenseServiceError(
        `La licencia ${licenseClass} requiere fecha de vencimiento cuando está activa.`,
      );
    }

    if (entry.expiryDate && Number.isNaN(new Date(entry.expiryDate).getTime())) {
      throw new DriverLicenseServiceError(`Fecha inválida para licencia ${licenseClass}.`);
    }

    if (entry.alertDaysBefore < 1 || entry.alertDaysBefore > 365) {
      throw new DriverLicenseServiceError(
        `Días de alerta inválidos para licencia ${licenseClass}.`,
      );
    }
  }

  return normalized;
}

export async function getUserProfile(userId: string): Promise<UserProfile | undefined> {
  const profile = await db.userProfiles.get(userId);
  if (!profile) {
    return undefined;
  }

  const driverLicenses = migrateDriverLicenses(profile.driverLicenses);
  if (JSON.stringify(driverLicenses) !== JSON.stringify(profile.driverLicenses)) {
    await db.userProfiles.update(userId, { driverLicenses });
  }

  return { ...profile, driverLicenses };
}

export async function getDriverLicenses(userId: string): Promise<DriverLicenses> {
  const profile = await getUserProfile(userId);
  if (!profile) {
    throw new DriverLicenseServiceError('Usuario no encontrado.');
  }
  return profile.driverLicenses;
}

export async function saveDriverLicenses(
  userId: string,
  licenses: DriverLicenses,
): Promise<DriverLicenses> {
  const profile = await db.userProfiles.get(userId);
  if (!profile) {
    throw new DriverLicenseServiceError('Usuario no encontrado.');
  }

  const normalized = validateLicenses(licenses);
  await db.userProfiles.update(userId, { driverLicenses: normalized });
  await enqueueSyncMutation(userId, 'userProfile', userId, 'update', {
    ...profile,
    driverLicenses: normalized,
  });
  return normalized;
}
