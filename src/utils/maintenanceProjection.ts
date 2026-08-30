import type { FuelLog, MaintenanceLog } from '../types';

/** Km/día = (último odómetro - primer registro) / días transcurridos (spec 04) */
export function calculateDailyKmAverage(
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
): number | null {
  const odometerPoints: { date: Date; km: number }[] = [];

  for (const log of fuelLogs) {
    odometerPoints.push({ date: new Date(log.timestamp), km: log.odometerKm });
  }
  for (const log of maintenanceLogs) {
    odometerPoints.push({ date: new Date(log.serviceDate), km: log.odometerKm });
  }

  if (odometerPoints.length < 2) {
    return null;
  }

  odometerPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = odometerPoints[0];
  const last = odometerPoints[odometerPoints.length - 1];
  const kmDelta = last.km - first.km;
  const daysDelta =
    (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);

  if (kmDelta <= 0 || daysDelta <= 0) {
    return null;
  }

  return kmDelta / daysDelta;
}

export function projectDaysUntilKmTarget(
  currentOdometerKm: number,
  targetKm: number,
  dailyKm: number | null,
): number | null {
  const kmRemaining = targetKm - currentOdometerKm;
  if (kmRemaining <= 0 || !dailyKm || dailyKm <= 0) {
    return null;
  }
  return Math.ceil(kmRemaining / dailyKm);
}

export function projectDateFromKmTarget(
  currentOdometerKm: number,
  targetKm: number,
  dailyKm: number | null,
): Date | null {
  const days = projectDaysUntilKmTarget(currentOdometerKm, targetKm, dailyKm);
  if (days === null) {
    return null;
  }
  const projected = new Date();
  projected.setDate(projected.getDate() + days);
  return projected;
}

export interface UpcomingMaintenance {
  log: MaintenanceLog;
  kmRemaining: number | null;
  daysByDate: number | null;
  daysByKmProjection: number | null;
}

function daysUntilDate(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUpcomingMaintenances(
  vehicleOdometerKm: number,
  maintenanceLogs: MaintenanceLog[],
  fuelLogs: FuelLog[],
): UpcomingMaintenance[] {
  const dailyKm = calculateDailyKmAverage(fuelLogs, maintenanceLogs);
  const upcoming: UpcomingMaintenance[] = [];

  for (const log of maintenanceLogs) {
    if (!log.nextServiceKmTarget && !log.nextServiceDateTarget) {
      continue;
    }

    const kmRemaining =
      log.nextServiceKmTarget !== undefined
        ? log.nextServiceKmTarget - vehicleOdometerKm
        : null;

    const daysByDate = log.nextServiceDateTarget
      ? daysUntilDate(log.nextServiceDateTarget)
      : null;

    const daysByKmProjection =
      log.nextServiceKmTarget !== undefined
        ? projectDaysUntilKmTarget(vehicleOdometerKm, log.nextServiceKmTarget, dailyKm)
        : null;

    upcoming.push({
      log,
      kmRemaining,
      daysByDate,
      daysByKmProjection,
    });
  }

  return upcoming.sort((a, b) => {
    const urgencyA = Math.min(
      a.daysByDate ?? Infinity,
      a.daysByKmProjection ?? Infinity,
      a.kmRemaining !== null && a.kmRemaining <= 0 ? -1 : Infinity,
    );
    const urgencyB = Math.min(
      b.daysByDate ?? Infinity,
      b.daysByKmProjection ?? Infinity,
      b.kmRemaining !== null && b.kmRemaining <= 0 ? -1 : Infinity,
    );
    return urgencyA - urgencyB;
  });
}
