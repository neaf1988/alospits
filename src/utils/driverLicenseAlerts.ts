import type { DriverLicenses, VehicleType } from '../types';
import {
  getDriverLicenseLabel,
  getDriverLicenseStatus,
} from './driverLicenseDisplay';
import { getDriverLicenseClassesForVehicleType } from '../constants/driverLicenses';
import type { DashboardAlert } from './dashboardAlerts';

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildAlertForLicense(
  licenseClass: keyof DriverLicenses,
  licenses: DriverLicenses,
): DashboardAlert | null {
  const entry = licenses[licenseClass];
  const status = getDriverLicenseStatus(entry);

  if (!status || status === 'ok' || !entry.expiryDate) {
    return null;
  }

  const days = daysUntil(entry.expiryDate);
  const label = getDriverLicenseLabel(licenseClass);

  if (status === 'expired') {
    return {
      id: `license-expired-${licenseClass}`,
      severity: 'critical',
      title: `Licencia ${label} vencida`,
      message: `Venció hace ${Math.abs(days)} día(s).`,
    };
  }

  return {
    id: `license-soon-${licenseClass}`,
    severity: days <= 5 ? 'critical' : 'warning',
    title: `Licencia ${label} por vencer`,
    message: `Vence en ${days} día(s).`,
  };
}

/** Alertas de licencia para el tipo del vehículo activo (vencimiento y falta de registro) */
export function buildDriverLicenseAlerts(
  licenses: DriverLicenses,
  vehicleType: VehicleType,
): DashboardAlert[] {
  const relevantClasses = getDriverLicenseClassesForVehicleType(vehicleType).map(
    (item) => item.class,
  );

  const activeClasses = relevantClasses.filter((licenseClass) => licenses[licenseClass].active);

  if (activeClasses.length === 0) {
    const noun = vehicleType === 'MOTORCYCLE' ? 'motocicleta' : 'automóvil';
    return [
      {
        id: `license-missing-${vehicleType}`,
        severity: 'warning',
        title: 'Licencia no registrada',
        message: `No tienes licencia registrada para conducir este ${noun}. Regístrala en Licencias.`,
      },
    ];
  }

  const alerts: DashboardAlert[] = [];

  for (const licenseClass of activeClasses) {
    const alert = buildAlertForLicense(licenseClass, licenses);
    if (alert) {
      alerts.push(alert);
    }
  }

  return alerts;
}
