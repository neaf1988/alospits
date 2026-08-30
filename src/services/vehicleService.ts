import { STORAGE_KEYS } from '../constants/storage';
import { db } from './db';
import { MAX_VEHICLES } from '../types';
import type { Vehicle, VehicleType } from '../types';
import { getPlateValidationError, normalizePlate } from '../utils/plateValidation';
import { enqueueSyncMutation } from './syncOutboxService';

export interface CreateVehicleInput {
  userId: string;
  type: VehicleType;
  brand: string;
  line: string;
  modelYear: number;
  plate: string;
  cityCode: string;
  currentOdometerKm: number;
  tireTreadDepthMm: number;
}

export class VehicleServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VehicleServiceError';
  }
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const count = await db.vehicles.where('userId').equals(input.userId).count();
  if (count >= MAX_VEHICLES) {
    throw new VehicleServiceError(
      `Solo puedes registrar hasta ${MAX_VEHICLES} vehículos.`,
    );
  }

  const plateError = getPlateValidationError(input.plate);
  if (plateError) {
    throw new VehicleServiceError(plateError);
  }

  const normalizedPlate = normalizePlate(input.plate);
  const duplicate = await db.vehicles
    .where('[userId+plate]')
    .equals([input.userId, normalizedPlate])
    .first();

  if (duplicate) {
    throw new VehicleServiceError('Ya existe un vehículo con esta placa.');
  }

  const vehicle: Vehicle = {
    id: crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    brand: input.brand.trim(),
    line: input.line.trim(),
    modelYear: input.modelYear,
    plate: normalizedPlate,
    cityCode: input.cityCode,
    currentOdometerKm: input.currentOdometerKm,
    tireTreadDepthMm: input.tireTreadDepthMm,
    createdAt: new Date().toISOString(),
  };

  await db.transaction('rw', db.vehicles, db.userProfiles, async () => {
    await db.vehicles.add(vehicle);
    await db.userProfiles.update(input.userId, { activeVehicleId: vehicle.id });
  });

  localStorage.setItem(STORAGE_KEYS.activeVehicleId, vehicle.id);
  await enqueueSyncMutation(input.userId, 'vehicle', vehicle.id, 'create', vehicle);
  return vehicle;
}

export interface UpdateVehicleInput {
  type: VehicleType;
  brand: string;
  line: string;
  modelYear: number;
  plate: string;
  cityCode: string;
  currentOdometerKm: number;
  tireTreadDepthMm: number;
}

async function getMaxRecordedOdometer(vehicleId: string): Promise<number> {
  const [fuelLogs, maintenanceLogs] = await Promise.all([
    db.fuelLogs.where('vehicleId').equals(vehicleId).toArray(),
    db.maintenanceLogs.where('vehicleId').equals(vehicleId).toArray(),
  ]);

  const readings = [
    ...fuelLogs.map((log) => log.odometerKm),
    ...maintenanceLogs.map((log) => log.odometerKm),
  ];

  return readings.length > 0 ? Math.max(...readings) : 0;
}

export async function getVehicleById(vehicleId: string, userId: string): Promise<Vehicle> {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle || vehicle.userId !== userId) {
    throw new VehicleServiceError('Vehículo no encontrado.');
  }
  return vehicle;
}

export async function updateVehicle(
  vehicleId: string,
  userId: string,
  input: UpdateVehicleInput,
): Promise<Vehicle> {
  const vehicle = await getVehicleById(vehicleId, userId);

  const plateError = getPlateValidationError(input.plate);
  if (plateError) {
    throw new VehicleServiceError(plateError);
  }

  const normalizedPlate = normalizePlate(input.plate);
  const duplicate = await db.vehicles
    .where('[userId+plate]')
    .equals([userId, normalizedPlate])
    .first();

  if (duplicate && duplicate.id !== vehicleId) {
    throw new VehicleServiceError('Ya existe un vehículo con esta placa.');
  }

  if (input.tireTreadDepthMm < 0.1 || input.tireTreadDepthMm > 12) {
    throw new VehicleServiceError('Labrado entre 0.1 y 12 mm.');
  }

  const maxRecordedOdometer = await getMaxRecordedOdometer(vehicleId);
  if (input.currentOdometerKm < maxRecordedOdometer) {
    throw new VehicleServiceError(
      `El odómetro no puede ser menor a ${maxRecordedOdometer.toLocaleString('es-CO')} km (registrado en tanqueos o mantenimientos).`,
    );
  }

  const updated: Vehicle = {
    ...vehicle,
    type: input.type,
    brand: input.brand.trim(),
    line: input.line.trim(),
    modelYear: input.modelYear,
    plate: normalizedPlate,
    cityCode: input.cityCode,
    currentOdometerKm: input.currentOdometerKm,
    tireTreadDepthMm: input.tireTreadDepthMm,
  };

  await db.vehicles.put(updated);
  await enqueueSyncMutation(userId, 'vehicle', updated.id, 'update', updated);
  return updated;
}

export async function deleteVehicle(vehicleId: string, userId: string): Promise<void> {
  await getVehicleById(vehicleId, userId);
  const profile = await db.userProfiles.get(userId);

  if (!profile) {
    throw new VehicleServiceError('Perfil de usuario no encontrado.');
  }

  const remainingBeforeDelete = await db.vehicles
    .where('userId')
    .equals(userId)
    .toArray();
  const otherVehicles = remainingBeforeDelete.filter((item) => item.id !== vehicleId);

  const nextActiveId =
    profile.activeVehicleId === vehicleId
      ? (otherVehicles[0]?.id ?? '')
      : profile.activeVehicleId;

  await db.transaction('rw', db.tables, async () => {
    await db.fuelLogs.where('vehicleId').equals(vehicleId).delete();
    await db.legalDocuments.where('vehicleId').equals(vehicleId).delete();
    await db.taxRecords.where('vehicleId').equals(vehicleId).delete();
    await db.maintenanceLogs.where('vehicleId').equals(vehicleId).delete();
    await db.vehicles.delete(vehicleId);
    await db.userProfiles.update(userId, { activeVehicleId: nextActiveId });
  });

  if (nextActiveId) {
    localStorage.setItem(STORAGE_KEYS.activeVehicleId, nextActiveId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeVehicleId);
  }

  await enqueueSyncMutation(userId, 'vehicle', vehicleId, 'delete', { id: vehicleId, userId });
}

export async function updateVehicleTireTread(
  vehicleId: string,
  userId: string,
  tireTreadDepthMm: number,
): Promise<Vehicle> {
  if (tireTreadDepthMm < 0.1 || tireTreadDepthMm > 12) {
    throw new VehicleServiceError('Labrado entre 0.1 y 12 mm.');
  }

  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle || vehicle.userId !== userId) {
    throw new VehicleServiceError('Vehículo no encontrado.');
  }

  await db.vehicles.update(vehicleId, { tireTreadDepthMm });
  return { ...vehicle, tireTreadDepthMm };
}
