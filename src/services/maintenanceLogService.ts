import { db } from './db';
import type { MaintenanceLog } from '../types';
import { enqueueSyncMutation } from './syncOutboxService';

export interface SaveMaintenanceLogInput {
  vehicleId: string;
  serviceDate: string;
  odometerKm: number;
  title: string;
  details: string;
  costCop: number;
  workshopName?: string;
  invoiceNumber?: string;
  nextServiceKmTarget?: number;
  nextServiceDateTarget?: string;
}

export class MaintenanceLogServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MaintenanceLogServiceError';
  }
}

function parseDate(value: string, fieldLabel: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new MaintenanceLogServiceError(`${fieldLabel} inválida.`);
  }
  return parsed.toISOString();
}

async function ensureVehicleExists(vehicleId: string) {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle) {
    throw new MaintenanceLogServiceError('Vehículo no encontrado.');
  }
  return vehicle;
}

function validateMaintenanceInput(input: SaveMaintenanceLogInput) {
  const title = input.title.trim();
  const details = input.details.trim();

  if (!title) {
    throw new MaintenanceLogServiceError('El título del servicio es obligatorio.');
  }
  if (!details) {
    throw new MaintenanceLogServiceError('La descripción del servicio es obligatoria.');
  }
  if (input.costCop <= 0) {
    throw new MaintenanceLogServiceError('El costo debe ser mayor a cero.');
  }
  if (!Number.isFinite(input.odometerKm) || input.odometerKm < 0) {
    throw new MaintenanceLogServiceError('Odómetro inválido.');
  }
  if (
    input.nextServiceKmTarget !== undefined &&
    input.nextServiceKmTarget <= input.odometerKm
  ) {
    throw new MaintenanceLogServiceError(
      'El km objetivo debe ser mayor al odómetro del servicio.',
    );
  }
}

export async function getMaintenanceLogsByVehicle(
  vehicleId: string,
): Promise<MaintenanceLog[]> {
  const logs = await db.maintenanceLogs.where('vehicleId').equals(vehicleId).toArray();
  return logs.sort(
    (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime(),
  );
}

export async function getMaintenanceLogById(id: string): Promise<MaintenanceLog | undefined> {
  return db.maintenanceLogs.get(id);
}

export async function createMaintenanceLog(
  input: SaveMaintenanceLogInput,
): Promise<MaintenanceLog> {
  const vehicle = await ensureVehicleExists(input.vehicleId);
  validateMaintenanceInput(input);

  const workshopName = input.workshopName?.trim();
  const invoiceNumber = input.invoiceNumber?.trim();

  const log: MaintenanceLog = {
    id: crypto.randomUUID(),
    vehicleId: input.vehicleId,
    serviceDate: parseDate(input.serviceDate, 'Fecha de servicio'),
    odometerKm: input.odometerKm,
    title: input.title.trim(),
    details: input.details.trim(),
    costCop: Math.round(input.costCop),
    ...(workshopName ? { workshopName } : {}),
    ...(invoiceNumber ? { invoiceNumber } : {}),
    ...(input.nextServiceKmTarget !== undefined
      ? { nextServiceKmTarget: input.nextServiceKmTarget }
      : {}),
    ...(input.nextServiceDateTarget
      ? { nextServiceDateTarget: parseDate(input.nextServiceDateTarget, 'Fecha próximo servicio') }
      : {}),
  };

  await db.transaction('rw', db.maintenanceLogs, db.vehicles, async () => {
    await db.maintenanceLogs.add(log);
    if (input.odometerKm > vehicle.currentOdometerKm) {
      await db.vehicles.update(input.vehicleId, {
        currentOdometerKm: input.odometerKm,
      });
    }
  });

  await enqueueSyncMutation(vehicle.userId, 'maintenanceLog', log.id, 'create', log);
  return log;
}

export async function updateMaintenanceLog(
  id: string,
  input: SaveMaintenanceLogInput,
): Promise<MaintenanceLog> {
  const vehicle = await ensureVehicleExists(input.vehicleId);
  const current = await db.maintenanceLogs.get(id);

  if (!current) {
    throw new MaintenanceLogServiceError('Mantenimiento no encontrado.');
  }
  if (current.vehicleId !== input.vehicleId) {
    throw new MaintenanceLogServiceError('El registro no pertenece a este vehículo.');
  }

  validateMaintenanceInput(input);

  const workshopName = input.workshopName?.trim();
  const invoiceNumber = input.invoiceNumber?.trim();

  const updated: MaintenanceLog = {
    ...current,
    serviceDate: parseDate(input.serviceDate, 'Fecha de servicio'),
    odometerKm: input.odometerKm,
    title: input.title.trim(),
    details: input.details.trim(),
    costCop: Math.round(input.costCop),
    workshopName: workshopName || undefined,
    invoiceNumber: invoiceNumber || undefined,
    nextServiceKmTarget: input.nextServiceKmTarget,
    nextServiceDateTarget: input.nextServiceDateTarget
      ? parseDate(input.nextServiceDateTarget, 'Fecha próximo servicio')
      : undefined,
  };

  await db.transaction('rw', db.maintenanceLogs, db.vehicles, async () => {
    await db.maintenanceLogs.put(updated);
    if (input.odometerKm > vehicle.currentOdometerKm) {
      await db.vehicles.update(input.vehicleId, {
        currentOdometerKm: input.odometerKm,
      });
    }
  });

  await enqueueSyncMutation(vehicle.userId, 'maintenanceLog', updated.id, 'update', updated);
  return updated;
}

export async function saveMaintenanceLog(
  input: SaveMaintenanceLogInput,
  logId?: string,
): Promise<MaintenanceLog> {
  if (logId) {
    return updateMaintenanceLog(logId, input);
  }
  return createMaintenanceLog(input);
}

export async function deleteMaintenanceLog(id: string, vehicleId: string): Promise<void> {
  const log = await db.maintenanceLogs.get(id);
  if (!log) {
    throw new MaintenanceLogServiceError('Mantenimiento no encontrado.');
  }
  if (log.vehicleId !== vehicleId) {
    throw new MaintenanceLogServiceError('El registro no pertenece a este vehículo.');
  }

  const vehicle = await ensureVehicleExists(vehicleId);
  await db.maintenanceLogs.delete(id);
  await enqueueSyncMutation(vehicle.userId, 'maintenanceLog', id, 'delete', {
    id,
    vehicleId,
  });
}
