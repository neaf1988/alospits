import {
  NOTIFICATION_MILESTONE_DAYS,
  PICO_PLACA_NOTIFICATION_HOUR,
  type NotificationMilestoneDay,
} from '../constants/notifications';
import { getDriverLicenseClassesForVehicleType } from '../constants/driverLicenses';
import { getPicoPlacaScheduleForVehicle } from '../services/picoPlacaService';
import { db } from '../services/db';
import { getDriverLicenses } from '../services/driverLicenseService';
import { TIRE_TREAD_CRITICAL_MM } from '../types';
import type { DriverLicenseClass, DriverLicenses, VehicleType } from '../types';
import type { NotificationContext, PendingNotification } from '../types/notifications';
import { getComplianceItemLabel } from './complianceDisplay';
import { getDriverLicenseLabel } from './driverLicenseDisplay';
import { createEmptyDriverLicenses } from './driverLicenseUtils';
import { formatDateKey } from './notificationDedup';
import { formatDigitsList, getPicoPlacaRestrictionInfo } from './picoPlacaUtils';
import { formatPlate } from './vehicleDisplay';

function daysUntil(isoDate: string, referenceDate: Date): number {
  const target = new Date(isoDate);
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getExpiryMilestone(
  daysUntilExpiry: number,
): NotificationMilestoneDay | null {
  if (daysUntilExpiry < 0) {
    return null;
  }
  return NOTIFICATION_MILESTONE_DAYS.includes(daysUntilExpiry as NotificationMilestoneDay)
    ? (daysUntilExpiry as NotificationMilestoneDay)
    : null;
}

export function shouldDeliverPicoPlacaNotification(now: Date): boolean {
  return now.getHours() >= PICO_PLACA_NOTIFICATION_HOUR;
}

function buildPicoPlacaNotifications(
  context: NotificationContext,
  now: Date,
): PendingNotification[] {
  if (!shouldDeliverPicoPlacaNotification(now)) {
    return [];
  }

  const dateKey = formatDateKey(now);
  const notifications: PendingNotification[] = [];

  for (const vehicle of context.vehicles) {
    if (!vehicle.picoPlacaAppliesToday) {
      continue;
    }

    notifications.push({
      id: `pico-placa:${vehicle.vehicleId}:${dateKey}`,
      tag: `pico-placa-${vehicle.vehicleId}`,
      title: 'Pico y placa hoy',
      body: `Placa ${formatPlate(vehicle.plate)} tiene restricción hoy en ${vehicle.picoPlacaCityName}. Dígitos: ${formatDigitsList(vehicle.picoPlacaDigits)}.`,
    });
  }

  return notifications;
}

function buildComplianceNotifications(
  plate: string,
  complianceItems: NotificationContext['vehicles'][number]['complianceItems'],
  now: Date,
): PendingNotification[] {
  const notifications: PendingNotification[] = [];

  for (const item of complianceItems) {
    const days = daysUntil(item.expiryDate, now);
    const milestone = getExpiryMilestone(days);
    if (milestone === null) {
      continue;
    }

    const label = getComplianceItemLabel(item.type);
    notifications.push({
      id: `compliance:${item.id}:${milestone}d`,
      tag: `compliance-${item.id}`,
      title: `${label} — ${milestone} día(s)`,
      body: `Placa ${formatPlate(plate)}: ${label} vence en ${milestone} día(s).`,
    });
  }

  return notifications;
}

function buildTaxNotifications(
  plate: string,
  taxRecords: NotificationContext['vehicles'][number]['taxRecords'],
  now: Date,
): PendingNotification[] {
  const notifications: PendingNotification[] = [];

  for (const record of taxRecords) {
    if (record.status === 'PAID') {
      continue;
    }

    const days = daysUntil(record.dueDate, now);
    const milestone = getExpiryMilestone(days);
    if (milestone === null) {
      continue;
    }

    notifications.push({
      id: `tax:${record.id}:${milestone}d`,
      tag: `tax-${record.id}`,
      title: `Impuesto ${record.taxYear} — ${milestone} día(s)`,
      body: `Placa ${formatPlate(plate)}: impuesto vehicular vence en ${milestone} día(s).`,
    });
  }

  return notifications;
}

function buildLicenseNotifications(
  licenses: DriverLicenses,
  vehicleType: VehicleType,
  now: Date,
): PendingNotification[] {
  const relevantClasses = getDriverLicenseClassesForVehicleType(vehicleType).map(
    (item) => item.class,
  );
  const notifications: PendingNotification[] = [];

  for (const licenseClass of relevantClasses) {
    const entry = licenses[licenseClass as DriverLicenseClass];
    if (!entry.active || !entry.expiryDate) {
      continue;
    }

    const days = daysUntil(entry.expiryDate, now);
    const milestone = getExpiryMilestone(days);
    if (milestone === null) {
      continue;
    }

    const label = getDriverLicenseLabel(licenseClass as DriverLicenseClass);
    notifications.push({
      id: `license:${licenseClass}:${milestone}d`,
      tag: `license-${licenseClass}`,
      title: `Licencia ${label} — ${milestone} día(s)`,
      body: `Tu licencia ${label} vence en ${milestone} día(s).`,
    });
  }

  return notifications;
}

function buildTireNotification(
  vehicleId: string,
  plate: string,
  tireTreadDepthMm: number,
): PendingNotification | null {
  if (tireTreadDepthMm > TIRE_TREAD_CRITICAL_MM) {
    return null;
  }

  return {
    id: `tire:${vehicleId}:critical`,
    tag: `tire-${vehicleId}`,
    title: 'Llantas en límite legal',
    body: `Placa ${formatPlate(plate)}: labrado en ${tireTreadDepthMm.toFixed(1)} mm (mínimo ${TIRE_TREAD_CRITICAL_MM} mm).`,
  };
}

export function buildPendingNotifications(
  context: NotificationContext,
  now: Date = new Date(),
): PendingNotification[] {
  const notifications: PendingNotification[] = [];

  notifications.push(...buildPicoPlacaNotifications(context, now));

  const activeVehicle =
    context.vehicles.find((vehicle) => vehicle.vehicleId === context.activeVehicleId) ??
    context.vehicles[0];

  if (!activeVehicle) {
    return notifications;
  }

  notifications.push(
    ...buildComplianceNotifications(
      activeVehicle.plate,
      activeVehicle.complianceItems,
      now,
    ),
  );
  notifications.push(
    ...buildTaxNotifications(
      activeVehicle.plate,
      activeVehicle.taxRecords,
      now,
    ),
  );
  notifications.push(
    ...buildLicenseNotifications(context.driverLicenses, activeVehicle.vehicleType, now),
  );

  const tireNotification = buildTireNotification(
    activeVehicle.vehicleId,
    activeVehicle.plate,
    activeVehicle.tireTreadDepthMm,
  );
  if (tireNotification) {
    notifications.push(tireNotification);
  }

  return notifications;
}

/** Carga datos enriquecidos para evaluar reglas de notificación */
export async function loadNotificationContext(
  userId: string,
  activeVehicleId: string | null,
): Promise<NotificationContext> {
  const [vehicles, driverLicenses] = await Promise.all([
    db.vehicles.where('userId').equals(userId).toArray(),
    getDriverLicenses(userId).catch(() => null),
  ]);

  const vehicleContexts = await Promise.all(
    vehicles.map(async (vehicle) => {
      const [complianceItems, taxRecords, schedule] = await Promise.all([
        db.legalDocuments.where('vehicleId').equals(vehicle.id).toArray(),
        db.taxRecords.where('vehicleId').equals(vehicle.id).toArray(),
        getPicoPlacaScheduleForVehicle(vehicle.cityCode, vehicle.type),
      ]);

      const restriction = getPicoPlacaRestrictionInfo(vehicle, schedule);

      return {
        vehicleId: vehicle.id,
        plate: vehicle.plate,
        cityCode: vehicle.cityCode,
        vehicleType: vehicle.type,
        tireTreadDepthMm: vehicle.tireTreadDepthMm,
        complianceItems,
        taxRecords,
        picoPlacaAppliesToday: restriction?.appliesToday ?? false,
        picoPlacaCityName: restriction?.cityName ?? vehicle.cityCode,
        picoPlacaDigits: restriction?.todayDigits ?? [],
      };
    }),
  );

  return {
    userId,
    activeVehicleId,
    vehicles: vehicleContexts,
    driverLicenses: driverLicenses ?? createEmptyDriverLicenses(),
  };
}
