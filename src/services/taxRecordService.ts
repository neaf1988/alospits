import { db } from './db';
import type { TaxRecord, TaxStatus } from '../types';
import { enqueueSyncMutation } from './syncOutboxService';

export interface SaveTaxRecordInput {
  vehicleId: string;
  taxYear: number;
  dueDate: string;
  discountDueDate?: string;
  costCop: number;
  status: TaxStatus;
  paymentDate?: string;
}

export class TaxRecordServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaxRecordServiceError';
  }
}

function parseDate(value: string, label: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new TaxRecordServiceError(`${label} inválida.`);
  }
  return parsed.toISOString();
}

async function ensureVehicleExists(vehicleId: string) {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle) {
    throw new TaxRecordServiceError('Vehículo no encontrado.');
  }
  return vehicle;
}

async function findByVehicleAndYear(
  vehicleId: string,
  taxYear: number,
): Promise<TaxRecord | undefined> {
  return db.taxRecords.where('[vehicleId+taxYear]').equals([vehicleId, taxYear]).first();
}

function validateTaxInput(input: SaveTaxRecordInput): void {
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(input.taxYear) || input.taxYear < 2000 || input.taxYear > currentYear + 1) {
    throw new TaxRecordServiceError(`Año gravable entre 2000 y ${currentYear + 1}.`);
  }

  if (input.costCop <= 0) {
    throw new TaxRecordServiceError('El valor del impuesto debe ser mayor a cero.');
  }

  if (input.discountDueDate && input.dueDate) {
    const discount = new Date(input.discountDueDate).getTime();
    const due = new Date(input.dueDate).getTime();
    if (discount > due) {
      throw new TaxRecordServiceError(
        'La fecha de pronto pago no puede ser posterior al vencimiento.',
      );
    }
  }

  if (input.status === 'PAID' && !input.paymentDate) {
    throw new TaxRecordServiceError('Indica la fecha de pago.');
  }
}

export async function getTaxRecordsByVehicle(vehicleId: string): Promise<TaxRecord[]> {
  const records = await db.taxRecords.where('vehicleId').equals(vehicleId).toArray();
  return records.sort((a, b) => b.taxYear - a.taxYear);
}

export async function getTaxRecordById(id: string): Promise<TaxRecord | undefined> {
  return db.taxRecords.get(id);
}

export async function createTaxRecord(input: SaveTaxRecordInput): Promise<TaxRecord> {
  const vehicle = await ensureVehicleExists(input.vehicleId);
  validateTaxInput(input);

  const existing = await findByVehicleAndYear(input.vehicleId, input.taxYear);
  if (existing) {
    throw new TaxRecordServiceError(
      `Ya existe un impuesto registrado para ${input.taxYear}. Edítalo en lugar de crear uno nuevo.`,
    );
  }

  const record: TaxRecord = {
    id: crypto.randomUUID(),
    vehicleId: input.vehicleId,
    taxYear: input.taxYear,
    dueDate: parseDate(input.dueDate, 'Fecha límite'),
    costCop: Math.round(input.costCop),
    status: input.status,
    ...(input.discountDueDate
      ? { discountDueDate: parseDate(input.discountDueDate, 'Fecha pronto pago') }
      : {}),
    ...(input.status === 'PAID' && input.paymentDate
      ? { paymentDate: parseDate(input.paymentDate, 'Fecha de pago') }
      : {}),
  };

  await db.taxRecords.add(record);
  await enqueueSyncMutation(vehicle.userId, 'taxRecord', record.id, 'create', record);
  return record;
}

export async function updateTaxRecord(id: string, input: SaveTaxRecordInput): Promise<TaxRecord> {
  const vehicle = await ensureVehicleExists(input.vehicleId);

  const current = await db.taxRecords.get(id);
  if (!current) {
    throw new TaxRecordServiceError('Impuesto no encontrado.');
  }
  if (current.vehicleId !== input.vehicleId) {
    throw new TaxRecordServiceError('El impuesto no pertenece a este vehículo.');
  }

  validateTaxInput(input);

  if (input.taxYear !== current.taxYear) {
    const duplicate = await findByVehicleAndYear(input.vehicleId, input.taxYear);
    if (duplicate && duplicate.id !== id) {
      throw new TaxRecordServiceError(`Ya existe un impuesto para ${input.taxYear}.`);
    }
  }

  const updated: TaxRecord = {
    ...current,
    taxYear: input.taxYear,
    dueDate: parseDate(input.dueDate, 'Fecha límite'),
    costCop: Math.round(input.costCop),
    status: input.status,
    discountDueDate: input.discountDueDate
      ? parseDate(input.discountDueDate, 'Fecha pronto pago')
      : undefined,
    paymentDate:
      input.status === 'PAID' && input.paymentDate
        ? parseDate(input.paymentDate, 'Fecha de pago')
        : undefined,
  };

  await db.taxRecords.put(updated);
  await enqueueSyncMutation(vehicle.userId, 'taxRecord', updated.id, 'update', updated);
  return updated;
}

export async function saveTaxRecord(
  input: SaveTaxRecordInput,
  recordId?: string,
): Promise<TaxRecord> {
  if (recordId) {
    return updateTaxRecord(recordId, input);
  }
  return createTaxRecord(input);
}

export async function markTaxRecordAsPaid(
  id: string,
  vehicleId: string,
  paymentDate: string,
): Promise<TaxRecord> {
  const current = await db.taxRecords.get(id);
  if (!current) {
    throw new TaxRecordServiceError('Impuesto no encontrado.');
  }
  if (current.vehicleId !== vehicleId) {
    throw new TaxRecordServiceError('El impuesto no pertenece a este vehículo.');
  }

  return updateTaxRecord(id, {
    vehicleId,
    taxYear: current.taxYear,
    dueDate: current.dueDate,
    discountDueDate: current.discountDueDate,
    costCop: current.costCop,
    status: 'PAID',
    paymentDate,
  });
}

export async function deleteTaxRecord(id: string, vehicleId: string): Promise<void> {
  const record = await db.taxRecords.get(id);
  if (!record) {
    throw new TaxRecordServiceError('Impuesto no encontrado.');
  }
  if (record.vehicleId !== vehicleId) {
    throw new TaxRecordServiceError('El impuesto no pertenece a este vehículo.');
  }

  const vehicle = await ensureVehicleExists(vehicleId);
  await db.taxRecords.delete(id);
  await enqueueSyncMutation(vehicle.userId, 'taxRecord', id, 'delete', { id, vehicleId });
}

export async function getAvailableTaxYears(vehicleId: string): Promise<number[]> {
  const existing = await getTaxRecordsByVehicle(vehicleId);
  const usedYears = new Set(existing.map((record) => record.taxYear));
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear + 1; year >= currentYear - 5; year -= 1) {
    if (!usedYears.has(year)) {
      years.push(year);
    }
  }
  return years;
}
