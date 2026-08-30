import { DEFAULT_LICENSE_ALERT_DAYS, DRIVER_LICENSE_CLASSES } from '../constants/driverLicenses';
import type {
  DriverLicenseClass,
  DriverLicenseEntry,
  DriverLicenses,
  LegacyDriverLicenses,
} from '../types';

export function createEmptyDriverLicenses(): DriverLicenses {
  const emptyEntry = (): DriverLicenseEntry => ({
    active: false,
    expiryDate: null,
    alertDaysBefore: DEFAULT_LICENSE_ALERT_DAYS,
  });

  return {
    A1: emptyEntry(),
    A2: emptyEntry(),
    B1: emptyEntry(),
    B2: emptyEntry(),
    B3: emptyEntry(),
  };
}

export function isDriverLicenseClass(value: string): value is DriverLicenseClass {
  return DRIVER_LICENSE_CLASSES.some((item) => item.class === value);
}

/** Migra perfiles guardados con categoryA / categoryB al modelo por subcategoría */
export function migrateDriverLicenses(raw: unknown): DriverLicenses {
  if (!raw || typeof raw !== 'object') {
    return createEmptyDriverLicenses();
  }

  if ('A1' in raw && 'B1' in raw) {
    return normalizeDriverLicenses(raw as DriverLicenses);
  }

  const legacy = raw as LegacyDriverLicenses;
  const licenses = createEmptyDriverLicenses();

  if (legacy.categoryA?.active) {
    licenses.A2 = {
      active: true,
      expiryDate: legacy.categoryA.expiryDate,
      alertDaysBefore: DEFAULT_LICENSE_ALERT_DAYS,
    };
  }

  if (legacy.categoryB?.active) {
    licenses.B1 = {
      active: true,
      expiryDate: legacy.categoryB.expiryDate,
      alertDaysBefore: DEFAULT_LICENSE_ALERT_DAYS,
    };
  }

  return licenses;
}

export function normalizeDriverLicenses(licenses: DriverLicenses): DriverLicenses {
  const normalized = createEmptyDriverLicenses();

  for (const option of DRIVER_LICENSE_CLASSES) {
    const entry = licenses[option.class];
    normalized[option.class] = {
      active: Boolean(entry?.active),
      expiryDate: entry?.expiryDate ?? null,
      alertDaysBefore: entry?.alertDaysBefore ?? DEFAULT_LICENSE_ALERT_DAYS,
    };
  }

  return normalized;
}

export function getActiveDriverLicenseClasses(licenses: DriverLicenses): DriverLicenseClass[] {
  return DRIVER_LICENSE_CLASSES.filter((item) => licenses[item.class].active).map(
    (item) => item.class,
  );
}
