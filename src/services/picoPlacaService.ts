import { PICO_PLACA_DEFAULT_SEEDS } from '../constants/picoPlacaDefaults';
import type { PicoPlacaDayRule, PicoPlacaSchedule, VehicleType, Weekday } from '../types';
import { db } from './db';

export interface SavePicoPlacaScheduleInput {
  cityCode: string;
  vehicleType: VehicleType;
  enabled: boolean;
  dayRules: PicoPlacaDayRule[];
}

export class PicoPlacaServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PicoPlacaServiceError';
  }
}

function normalizeDayRules(dayRules: PicoPlacaDayRule[]): PicoPlacaDayRule[] {
  const byWeekday = new Map<Weekday, Set<number>>();

  for (const rule of dayRules) {
    if (rule.weekday < 1 || rule.weekday > 7) {
      throw new PicoPlacaServiceError('Día de la semana inválido.');
    }

    const digits = new Set<number>();
    for (const digit of rule.digits) {
      if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
        throw new PicoPlacaServiceError('Los dígitos deben estar entre 0 y 9.');
      }
      digits.add(digit);
    }

    if (digits.size > 0) {
      byWeekday.set(rule.weekday, digits);
    }
  }

  return [...byWeekday.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekday, digits]) => ({
      weekday,
      digits: [...digits].sort((a, b) => a - b),
    }));
}

function validateScheduleInput(input: SavePicoPlacaScheduleInput): SavePicoPlacaScheduleInput {
  const cityCode = input.cityCode.trim().toUpperCase();
  if (!cityCode) {
    throw new PicoPlacaServiceError('La ciudad es obligatoria.');
  }

  const dayRules = normalizeDayRules(input.dayRules);

  if (input.enabled && dayRules.length === 0) {
    throw new PicoPlacaServiceError(
      'Agrega al menos un día con dígitos cuando el pico y placa está activo.',
    );
  }

  return {
    cityCode,
    vehicleType: input.vehicleType,
    enabled: input.enabled,
    dayRules,
  };
}

async function findByCityAndType(
  cityCode: string,
  vehicleType: VehicleType,
): Promise<PicoPlacaSchedule | undefined> {
  return db.picoPlacaSchedules.where('[cityCode+vehicleType]').equals([cityCode, vehicleType]).first();
}

export async function getAllPicoPlacaSchedules(): Promise<PicoPlacaSchedule[]> {
  const schedules = await db.picoPlacaSchedules.toArray();
  return schedules.sort((a, b) => {
    const cityCompare = a.cityCode.localeCompare(b.cityCode);
    if (cityCompare !== 0) {
      return cityCompare;
    }
    return a.vehicleType.localeCompare(b.vehicleType);
  });
}

export async function getPicoPlacaScheduleById(id: string): Promise<PicoPlacaSchedule | undefined> {
  return db.picoPlacaSchedules.get(id);
}

export async function getPicoPlacaScheduleForVehicle(
  cityCode: string,
  vehicleType: VehicleType,
): Promise<PicoPlacaSchedule | undefined> {
  return findByCityAndType(cityCode.trim().toUpperCase(), vehicleType);
}

export async function savePicoPlacaSchedule(
  input: SavePicoPlacaScheduleInput,
  scheduleId?: string,
): Promise<PicoPlacaSchedule> {
  const normalized = validateScheduleInput(input);

  if (scheduleId) {
    const existing = await db.picoPlacaSchedules.get(scheduleId);
    if (!existing) {
      throw new PicoPlacaServiceError('Configuración no encontrada.');
    }

    const duplicate = await findByCityAndType(normalized.cityCode, normalized.vehicleType);
    if (duplicate && duplicate.id !== scheduleId) {
      throw new PicoPlacaServiceError('Ya existe una configuración para esta ciudad y tipo.');
    }

    const updated: PicoPlacaSchedule = {
      ...existing,
      ...normalized,
      updatedAt: new Date().toISOString(),
    };
    await db.picoPlacaSchedules.put(updated);
    return updated;
  }

  const duplicate = await findByCityAndType(normalized.cityCode, normalized.vehicleType);
  if (duplicate) {
    throw new PicoPlacaServiceError('Ya existe una configuración para esta ciudad y tipo.');
  }

  const created: PicoPlacaSchedule = {
    id: crypto.randomUUID(),
    ...normalized,
    updatedAt: new Date().toISOString(),
  };
  await db.picoPlacaSchedules.add(created);
  return created;
}

export async function deletePicoPlacaSchedule(id: string): Promise<void> {
  const existing = await db.picoPlacaSchedules.get(id);
  if (!existing) {
    throw new PicoPlacaServiceError('Configuración no encontrada.');
  }
  await db.picoPlacaSchedules.delete(id);
}

export async function ensureDefaultPicoPlacaSchedules(): Promise<void> {
  const count = await db.picoPlacaSchedules.count();
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  await db.picoPlacaSchedules.bulkAdd(
    PICO_PLACA_DEFAULT_SEEDS.map((seed) => ({
      id: crypto.randomUUID(),
      cityCode: seed.cityCode,
      vehicleType: seed.vehicleType,
      enabled: seed.enabled,
      dayRules: seed.dayRules,
      updatedAt: now,
    })),
  );
}
