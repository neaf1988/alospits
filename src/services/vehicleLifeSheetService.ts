import { db } from './db';
import type { VehicleLifeSheetReport, VehicleLifeSheetSourceData } from '../types/vehicleLifeSheet';
import { buildVehicleLifeSheetReport } from '../utils/vehicleLifeSheetData';

export class VehicleLifeSheetServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VehicleLifeSheetServiceError';
  }
}

export async function loadVehicleLifeSheetData(vehicleId: string): Promise<VehicleLifeSheetSourceData> {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle) {
    throw new VehicleLifeSheetServiceError('Vehículo no encontrado.');
  }

  const [fuelLogs, maintenanceLogs, taxRecords, complianceItems] = await Promise.all([
    db.fuelLogs.where('vehicleId').equals(vehicleId).toArray(),
    db.maintenanceLogs.where('vehicleId').equals(vehicleId).toArray(),
    db.taxRecords.where('vehicleId').equals(vehicleId).toArray(),
    db.legalDocuments.where('vehicleId').equals(vehicleId).toArray(),
  ]);

  return {
    vehicle,
    fuelLogs,
    maintenanceLogs,
    taxRecords,
    complianceItems,
  };
}

export async function buildVehicleLifeSheet(vehicleId: string): Promise<VehicleLifeSheetReport> {
  const source = await loadVehicleLifeSheetData(vehicleId);
  return buildVehicleLifeSheetReport(source);
}
