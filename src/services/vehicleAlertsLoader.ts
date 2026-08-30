import { getDriverLicenses } from './driverLicenseService';
import { db } from './db';
import { getPicoPlacaScheduleForVehicle } from './picoPlacaService';
import { buildVehicleAlerts, type DashboardAlert } from '../utils/dashboardAlerts';

export async function fetchVehicleAlerts(vehicleId: string): Promise<DashboardAlert[]> {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle) {
    return [];
  }

  const [fuelLogs, complianceItems, taxRecords, maintenanceLogs, driverLicenses, picoPlacaSchedule] =
    await Promise.all([
      db.fuelLogs.where('vehicleId').equals(vehicleId).toArray(),
      db.legalDocuments.where('vehicleId').equals(vehicleId).toArray(),
      db.taxRecords.where('vehicleId').equals(vehicleId).toArray(),
      db.maintenanceLogs.where('vehicleId').equals(vehicleId).toArray(),
      getDriverLicenses(vehicle.userId).catch(() => undefined),
      getPicoPlacaScheduleForVehicle(vehicle.cityCode, vehicle.type),
    ]);

  return buildVehicleAlerts(
    vehicle,
    complianceItems,
    taxRecords,
    fuelLogs,
    maintenanceLogs,
    picoPlacaSchedule,
    driverLicenses,
  );
}
