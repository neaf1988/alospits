import type { DriverLicenseClass, DriverLicenseEntry, DriverLicenses, VehicleType } from '../types';
import { getDriverLicenseClassOption, getDriverLicenseClassesForVehicleType } from '../constants/driverLicenses';
import type { ComplianceItemStatus } from './complianceDisplay';

export function getDriverLicenseLabel(licenseClass: DriverLicenseClass): string {
  return getDriverLicenseClassOption(licenseClass)?.label ?? licenseClass;
}

export function getDriverLicenseDescription(licenseClass: DriverLicenseClass): string {
  return getDriverLicenseClassOption(licenseClass)?.description ?? '';
}

function daysUntilExpiry(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDriverLicenseStatus(entry: DriverLicenseEntry): ComplianceItemStatus | null {
  if (!entry.active || !entry.expiryDate) {
    return null;
  }

  const days = daysUntilExpiry(entry.expiryDate);
  if (days < 0) {
    return 'expired';
  }
  if (days <= 5) {
    return 'critical';
  }
  if (days <= entry.alertDaysBefore) {
    return 'warning';
  }
  return 'ok';
}

export function getDriverLicenseExpiryText(entry: DriverLicenseEntry): string {
  if (!entry.active) {
    return 'No registrada';
  }
  if (!entry.expiryDate) {
    return 'Sin fecha de vencimiento';
  }

  const days = daysUntilExpiry(entry.expiryDate);
  const formatted = new Date(entry.expiryDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (days < 0) {
    return `Venció el ${formatted} (hace ${Math.abs(days)} día(s))`;
  }
  if (days === 0) {
    return `Vence hoy (${formatted})`;
  }
  return `Vence el ${formatted} (${days} día(s))`;
}

export function getDriverLicenseStatusLabel(
  status: ComplianceItemStatus | null,
): string {
  if (!status) {
    return 'No registrada';
  }
  switch (status) {
    case 'expired':
      return 'Vencida';
    case 'critical':
      return 'Urgente';
    case 'warning':
      return 'Por vencer';
    default:
      return 'Vigente';
  }
}

export const DRIVER_LICENSE_STATUS_STYLES: Record<
  ComplianceItemStatus | 'inactive',
  string
> = {
  expired: 'bg-red-500/20 text-red-300 ring-red-500/40',
  critical: 'bg-red-500/15 text-red-200 ring-red-500/30',
  warning: 'bg-amber-500/15 text-amber-200 ring-amber-500/30',
  ok: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30',
  inactive: 'bg-slate-700/40 text-slate-400 ring-slate-600/40',
};

export function getRelevantActiveLicensesForVehicleType(
  licenses: DriverLicenses,
  vehicleType: VehicleType,
): DriverLicenseClass[] {
  return getDriverLicenseClassesForVehicleType(vehicleType)
    .map((item) => item.class)
    .filter((licenseClass) => licenses[licenseClass].active);
}

export function getVehicleTypeLicenseNoun(vehicleType: VehicleType): string {
  return vehicleType === 'MOTORCYCLE' ? 'motocicleta' : 'automóvil';
}

export function getLicenseStatusStyleKey(
  entry: DriverLicenseEntry,
): ComplianceItemStatus | 'inactive' {
  if (!entry.active) {
    return 'inactive';
  }
  return getDriverLicenseStatus(entry) ?? 'inactive';
}

export function sortDriverLicenseClassesByUrgency(
  classes: DriverLicenseClass[],
  licenses: DriverLicenses,
): DriverLicenseClass[] {
  const statusOrder: Record<string, number> = {
    expired: 0,
    critical: 1,
    warning: 2,
    ok: 3,
    inactive: 4,
  };

  return [...classes].sort((a, b) => {
    const statusA = getDriverLicenseStatus(licenses[a]) ?? 'inactive';
    const statusB = getDriverLicenseStatus(licenses[b]) ?? 'inactive';
    const orderDiff = statusOrder[statusA] - statusOrder[statusB];
    if (orderDiff !== 0) {
      return orderDiff;
    }

    const daysA = licenses[a].expiryDate ? daysUntilExpiry(licenses[a].expiryDate!) : 9999;
    const daysB = licenses[b].expiryDate ? daysUntilExpiry(licenses[b].expiryDate!) : 9999;
    return daysA - daysB;
  });
}
