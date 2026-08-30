import { STORAGE_KEYS } from '../constants/storage';
import { createEmptyDriverLicenses } from '../utils/driverLicenseUtils';
import { db } from './db';

/** Usuario local offline hasta integrar autenticación remota */
export async function ensureLocalUser(): Promise<string> {
  const cachedId = localStorage.getItem(STORAGE_KEYS.localUserId);

  if (cachedId) {
    const existing = await db.userProfiles.get(cachedId);
    if (existing) {
      return cachedId;
    }
  }

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.userProfiles.add({
    id: userId,
    email: '',
    activeVehicleId: '',
    driverLicenses: createEmptyDriverLicenses(),
    createdAt: now,
  });

  localStorage.setItem(STORAGE_KEYS.localUserId, userId);
  return userId;
}
