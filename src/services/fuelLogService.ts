import { db } from './db';
import type { FuelLog } from '../types';
import {
  getMinOdometerExcludingFuelLog,
  syncVehicleOdometerFromRecords,
} from '../utils/vehicleOdometerUtils';
import { enqueueSyncMutation } from './syncOutboxService';

export interface SaveFuelLogInput {
  vehicleId: string;
  timestamp: string;
  odometerKm: number;
  gallons: number;
  totalCostCop: number;
  isFullTank: boolean;
  stationName?: string;
}

export class FuelLogServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FuelLogServiceError';
  }
}

async function ensureVehicleExists(vehicleId: string) {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle) {
    throw new FuelLogServiceError('Vehículo no encontrado.');
  }
  return vehicle;
}

function validateFuelInput(input: SaveFuelLogInput, minOdometerKm: number) {
  if (input.gallons <= 0) {
    throw new FuelLogServiceError('Los galones deben ser mayores a cero.');
  }

  if (input.totalCostCop <= 0) {
    throw new FuelLogServiceError('El valor pagado debe ser mayor a cero.');
  }

  const timestampMs = new Date(input.timestamp).getTime();
  if (Number.isNaN(timestampMs)) {
    throw new FuelLogServiceError('Fecha u hora inválida.');
  }

  if (input.odometerKm < minOdometerKm) {
    throw new FuelLogServiceError(
      `El odómetro no puede ser menor a ${minOdometerKm.toLocaleString('es-CO')} km.`,
    );
  }
}

function buildFuelLogPayload(input: SaveFuelLogInput): Omit<FuelLog, 'id'> {
  const stationName = input.stationName?.trim();

  return {
    vehicleId: input.vehicleId,
    timestamp: new Date(input.timestamp).toISOString(),
    odometerKm: input.odometerKm,
    gallons: input.gallons,
    totalCostCop: Math.round(input.totalCostCop),
    isFullTank: input.isFullTank,
    ...(stationName ? { stationName } : {}),
  };
}

export async function getFuelLogById(id: string): Promise<FuelLog | undefined> {
  return db.fuelLogs.get(id);
}

export async function createFuelLog(input: SaveFuelLogInput): Promise<FuelLog> {
  const vehicle = await ensureVehicleExists(input.vehicleId);
  const minOdometer = Math.max(
    vehicle.currentOdometerKm,
    await getMinOdometerExcludingFuelLog(input.vehicleId),
  );
  validateFuelInput(input, minOdometer);

  const fuelLog: FuelLog = {
    id: crypto.randomUUID(),
    ...buildFuelLogPayload(input),
  };

  await db.transaction('rw', db.fuelLogs, db.vehicles, async () => {
    await db.fuelLogs.add(fuelLog);
    await syncVehicleOdometerFromRecords(input.vehicleId);
  });

  await enqueueSyncMutation(vehicle.userId, 'fuelLog', fuelLog.id, 'create', fuelLog);
  return fuelLog;
}

export async function updateFuelLog(id: string, input: SaveFuelLogInput): Promise<FuelLog> {
  const vehicle = await ensureVehicleExists(input.vehicleId);
  const current = await db.fuelLogs.get(id);

  if (!current) {
    throw new FuelLogServiceError('Tanqueo no encontrado.');
  }
  if (current.vehicleId !== input.vehicleId) {
    throw new FuelLogServiceError('El tanqueo no pertenece a este vehículo.');
  }

  const minOdometer = await getMinOdometerExcludingFuelLog(input.vehicleId, id);
  validateFuelInput(input, minOdometer);

  const updated: FuelLog = {
    id,
    ...buildFuelLogPayload(input),
  };

  await db.transaction('rw', db.fuelLogs, db.vehicles, async () => {
    await db.fuelLogs.put(updated);
    await syncVehicleOdometerFromRecords(input.vehicleId);
  });

  await enqueueSyncMutation(vehicle.userId, 'fuelLog', updated.id, 'update', updated);
  return updated;
}

export async function saveFuelLog(
  input: SaveFuelLogInput,
  logId?: string,
): Promise<FuelLog> {
  if (logId) {
    return updateFuelLog(logId, input);
  }
  return createFuelLog(input);
}

export async function deleteFuelLog(id: string, vehicleId: string): Promise<void> {
  const log = await db.fuelLogs.get(id);
  if (!log) {
    throw new FuelLogServiceError('Tanqueo no encontrado.');
  }
  if (log.vehicleId !== vehicleId) {
    throw new FuelLogServiceError('El tanqueo no pertenece a este vehículo.');
  }

  const vehicle = await ensureVehicleExists(vehicleId);

  await db.transaction('rw', db.fuelLogs, db.vehicles, async () => {
    await db.fuelLogs.delete(id);
    await syncVehicleOdometerFromRecords(vehicleId);
  });

  await enqueueSyncMutation(vehicle.userId, 'fuelLog', id, 'delete', { id, vehicleId });
}

export async function getFuelLogsByVehicle(vehicleId: string): Promise<FuelLog[]> {
  const logs = await db.fuelLogs.where('vehicleId').equals(vehicleId).toArray();
  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
