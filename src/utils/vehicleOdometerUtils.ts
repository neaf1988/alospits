import { db } from '../services/db';

/** Recalcula el odómetro del vehículo según el máximo en tanqueos y mantenimientos */
export async function syncVehicleOdometerFromRecords(vehicleId: string): Promise<number> {
  const [vehicle, fuelLogs, maintenanceLogs] = await Promise.all([
    db.vehicles.get(vehicleId),
    db.fuelLogs.where('vehicleId').equals(vehicleId).toArray(),
    db.maintenanceLogs.where('vehicleId').equals(vehicleId).toArray(),
  ]);

  if (!vehicle) {
    return 0;
  }

  const readings = [
    ...fuelLogs.map((log) => log.odometerKm),
    ...maintenanceLogs.map((log) => log.odometerKm),
  ];

  const nextOdometer =
    readings.length > 0 ? Math.max(...readings) : vehicle.currentOdometerKm;

  if (nextOdometer !== vehicle.currentOdometerKm) {
    await db.vehicles.update(vehicleId, { currentOdometerKm: nextOdometer });
  }

  return nextOdometer;
}

export async function getMinOdometerExcludingFuelLog(
  vehicleId: string,
  excludeFuelLogId?: string,
): Promise<number> {
  const [fuelLogs, maintenanceLogs] = await Promise.all([
    db.fuelLogs.where('vehicleId').equals(vehicleId).toArray(),
    db.maintenanceLogs.where('vehicleId').equals(vehicleId).toArray(),
  ]);

  const readings = [
    ...fuelLogs
      .filter((log) => log.id !== excludeFuelLogId)
      .map((log) => log.odometerKm),
    ...maintenanceLogs.map((log) => log.odometerKm),
  ];

  return readings.length > 0 ? Math.max(...readings) : 0;
}
