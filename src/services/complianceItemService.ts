import { db } from './db';
import type { ComplianceItem, ComplianceItemType } from '../types';
import {
  COMPLIANCE_DOCUMENT_TYPES,
  COMPLIANCE_SAFETY_TYPES,
  DEFAULT_ALERT_DAYS_BEFORE,
} from '../constants/complianceItems';
import { enqueueSyncMutation } from './syncOutboxService';

export interface SaveComplianceItemInput {
  vehicleId: string;
  type: ComplianceItemType;
  expiryDate: string;
  costCop?: number;
  notes?: string;
  alertDaysBefore?: number;
}

export class ComplianceItemServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComplianceItemServiceError';
  }
}

export type ComplianceItemCategory = 'document' | 'safety';

function parseExpiryDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ComplianceItemServiceError('Fecha de vencimiento inválida.');
  }
  return parsed.toISOString();
}

function normalizeOptionalCost(costCop?: number): number | undefined {
  if (costCop === undefined || costCop === null) {
    return undefined;
  }
  if (costCop <= 0) {
    throw new ComplianceItemServiceError('El costo debe ser mayor a cero.');
  }
  return Math.round(costCop);
}

async function ensureVehicleExists(vehicleId: string) {
  const vehicle = await db.vehicles.get(vehicleId);
  if (!vehicle) {
    throw new ComplianceItemServiceError('Vehículo no encontrado.');
  }
  return vehicle;
}

async function findByVehicleAndType(
  vehicleId: string,
  type: ComplianceItemType,
): Promise<ComplianceItem | undefined> {
  return db.legalDocuments.where('[vehicleId+type]').equals([vehicleId, type]).first();
}

export async function getComplianceItemsByVehicle(vehicleId: string): Promise<ComplianceItem[]> {
  return db.legalDocuments.where('vehicleId').equals(vehicleId).toArray();
}

export async function getComplianceItemById(id: string): Promise<ComplianceItem | undefined> {
  return db.legalDocuments.get(id);
}

export async function createComplianceItem(input: SaveComplianceItemInput): Promise<ComplianceItem> {
  const vehicle = await ensureVehicleExists(input.vehicleId);

  const existing = await findByVehicleAndType(input.vehicleId, input.type);
  if (existing) {
    throw new ComplianceItemServiceError(
      `Ya existe un registro de ${input.type}. Edítalo en lugar de crear uno nuevo.`,
    );
  }

  const notes = input.notes?.trim();
  const costCop = normalizeOptionalCost(input.costCop);

  const item: ComplianceItem = {
    id: crypto.randomUUID(),
    vehicleId: input.vehicleId,
    type: input.type,
    expiryDate: parseExpiryDate(input.expiryDate),
    alertDaysBefore: input.alertDaysBefore ?? DEFAULT_ALERT_DAYS_BEFORE,
    ...(costCop !== undefined ? { costCop } : {}),
    ...(notes ? { notes } : {}),
  };

  await db.legalDocuments.add(item);
  await enqueueSyncMutation(vehicle.userId, 'complianceItem', item.id, 'create', item);
  return item;
}

export async function updateComplianceItem(
  id: string,
  input: SaveComplianceItemInput,
): Promise<ComplianceItem> {
  const vehicle = await ensureVehicleExists(input.vehicleId);

  const current = await db.legalDocuments.get(id);
  if (!current) {
    throw new ComplianceItemServiceError('Registro no encontrado.');
  }

  if (current.vehicleId !== input.vehicleId) {
    throw new ComplianceItemServiceError('El registro no pertenece a este vehículo.');
  }

  if (input.type !== current.type) {
    const duplicate = await findByVehicleAndType(input.vehicleId, input.type);
    if (duplicate && duplicate.id !== id) {
      throw new ComplianceItemServiceError(
        `Ya existe un registro de ${input.type} para este vehículo.`,
      );
    }
  }

  const notes = input.notes?.trim();
  const costCop = normalizeOptionalCost(input.costCop);

  const updated: ComplianceItem = {
    ...current,
    type: input.type,
    expiryDate: parseExpiryDate(input.expiryDate),
    alertDaysBefore: input.alertDaysBefore ?? DEFAULT_ALERT_DAYS_BEFORE,
    costCop,
    notes: notes || undefined,
  };

  await db.legalDocuments.put(updated);
  await enqueueSyncMutation(vehicle.userId, 'complianceItem', updated.id, 'update', updated);
  return updated;
}

export async function upsertBotiquin(input: SaveComplianceItemInput): Promise<ComplianceItem> {
  if (input.type !== 'BOTIQUIN') {
    throw new ComplianceItemServiceError('Tipo inválido para botiquín.');
  }

  const existing = await findByVehicleAndType(input.vehicleId, 'BOTIQUIN');
  if (existing) {
    return updateComplianceItem(existing.id, input);
  }
  return createComplianceItem(input);
}

export async function saveComplianceItem(
  input: SaveComplianceItemInput,
  itemId?: string,
): Promise<ComplianceItem> {
  if (itemId) {
    return updateComplianceItem(itemId, input);
  }
  if (input.type === 'BOTIQUIN') {
    return upsertBotiquin(input);
  }
  return createComplianceItem(input);
}

export async function deleteComplianceItem(id: string, vehicleId: string): Promise<void> {
  const item = await db.legalDocuments.get(id);
  if (!item) {
    throw new ComplianceItemServiceError('Registro no encontrado.');
  }
  if (item.vehicleId !== vehicleId) {
    throw new ComplianceItemServiceError('El registro no pertenece a este vehículo.');
  }

  const vehicle = await ensureVehicleExists(vehicleId);
  await db.legalDocuments.delete(id);
  await enqueueSyncMutation(vehicle.userId, 'complianceItem', id, 'delete', { id, vehicleId });
}

export async function getAvailableComplianceItemTypes(
  vehicleId: string,
): Promise<ComplianceItemType[]> {
  const existing = await getComplianceItemsByVehicle(vehicleId);
  const usedTypes = new Set(existing.map((item) => item.type));
  const allTypes: ComplianceItemType[] = [
    'SOAT',
    'TECNOMECANICA',
    'SEGURO_TODO_RIESGO',
    'BOTIQUIN',
    'EXTINTOR',
  ];
  return allTypes.filter((type) => !usedTypes.has(type));
}

export async function getAvailableComplianceItemTypesByCategory(
  vehicleId: string,
  category: ComplianceItemCategory,
): Promise<ComplianceItemType[]> {
  const pool = category === 'document' ? COMPLIANCE_DOCUMENT_TYPES : COMPLIANCE_SAFETY_TYPES;
  const available = await getAvailableComplianceItemTypes(vehicleId);
  return available.filter((type) => pool.includes(type));
}
