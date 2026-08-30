import { getCityName } from '../constants/cities';
import { getWeekdayLabel, getWeekdayShort } from '../constants/weekdays';
import type { PicoPlacaSchedule, Vehicle, Weekday } from '../types';
import { normalizePlate } from './plateValidation';
import { getVehicleTypeLabel } from './vehicleDisplay';

export function getLastPlateDigit(plate: string): number | null {
  const normalized = normalizePlate(plate);
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const char = normalized[index];
    if (char >= '0' && char <= '9') {
      return Number(char);
    }
  }
  return null;
}

export function getIsoWeekday(date: Date = new Date()): Weekday {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as Weekday;
}

export function getDigitsForWeekday(
  schedule: PicoPlacaSchedule,
  weekday: Weekday,
): number[] {
  return schedule.dayRules.find((rule) => rule.weekday === weekday)?.digits ?? [];
}

export function isRestrictedOnDate(
  schedule: PicoPlacaSchedule,
  plate: string,
  date: Date = new Date(),
): boolean {
  if (!schedule.enabled) {
    return false;
  }

  const digit = getLastPlateDigit(plate);
  if (digit === null) {
    return false;
  }

  const weekday = getIsoWeekday(date);
  return getDigitsForWeekday(schedule, weekday).includes(digit);
}

export function formatDigitsList(digits: number[]): string {
  if (digits.length === 0) {
    return '—';
  }
  return digits.join(', ');
}

export function getScheduleSummary(schedule: PicoPlacaSchedule): string {
  if (!schedule.enabled) {
    return 'No aplica pico y placa';
  }

  if (schedule.dayRules.length === 0) {
    return 'Sin días configurados';
  }

  return schedule.dayRules
    .map((rule) => `${getWeekdayShort(rule.weekday)}: ${formatDigitsList(rule.digits)}`)
    .join(' · ');
}

export function getScheduleStatusLabel(schedule: PicoPlacaSchedule): string {
  if (!schedule.enabled) {
    return 'Inactivo';
  }
  if (schedule.dayRules.length === 0) {
    return 'Sin reglas';
  }
  return 'Activo';
}

export interface PicoPlacaRestrictionInfo {
  appliesToday: boolean;
  appliesTomorrow: boolean;
  plateDigit: number | null;
  todayDigits: number[];
  tomorrowDigits: number[];
  cityName: string;
  vehicleTypeLabel: string;
}

export function getPicoPlacaRestrictionInfo(
  vehicle: Vehicle,
  schedule: PicoPlacaSchedule | undefined,
  referenceDate: Date = new Date(),
): PicoPlacaRestrictionInfo | null {
  if (!schedule) {
    return null;
  }

  const plateDigit = getLastPlateDigit(vehicle.plate);
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayWeekday = getIsoWeekday(today);
  const tomorrowWeekday = getIsoWeekday(tomorrow);
  const todayDigits = schedule.enabled ? getDigitsForWeekday(schedule, todayWeekday) : [];
  const tomorrowDigits = schedule.enabled ? getDigitsForWeekday(schedule, tomorrowWeekday) : [];

  const appliesToday =
    schedule.enabled && plateDigit !== null && todayDigits.includes(plateDigit);
  const appliesTomorrow =
    schedule.enabled && plateDigit !== null && tomorrowDigits.includes(plateDigit);

  return {
    appliesToday,
    appliesTomorrow,
    plateDigit,
    todayDigits,
    tomorrowDigits,
    cityName: getCityName(schedule.cityCode),
    vehicleTypeLabel: getVehicleTypeLabel(schedule.vehicleType),
  };
}

export function formatRestrictionDayMessage(
  weekday: Weekday,
  digits: number[],
): string {
  if (digits.length === 0) {
    return `${getWeekdayLabel(weekday)}: sin restricción`;
  }
  return `${getWeekdayLabel(weekday)}: dígitos ${formatDigitsList(digits)}`;
}
