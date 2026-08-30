import { COLOMBIAN_CITIES } from '../../constants/cities';
import { PLATE_DIGITS, WEEKDAYS } from '../../constants/weekdays';
import type { PicoPlacaDayRule, VehicleType, Weekday } from '../../types';

export interface PicoPlacaFormValues {
  cityCode: string;
  vehicleType: VehicleType;
  enabled: boolean;
  dayRules: Record<Weekday, number[]>;
}

export function createEmptyPicoPlacaForm(
  cityCode = COLOMBIAN_CITIES[0]?.code ?? 'BOG',
  vehicleType: VehicleType = 'CAR',
): PicoPlacaFormValues {
  const dayRules = Object.fromEntries(
    WEEKDAYS.map((day) => [day.value, [] as number[]]),
  ) as Record<Weekday, number[]>;

  return {
    cityCode,
    vehicleType,
    enabled: true,
    dayRules,
  };
}

export function scheduleToFormValues(
  cityCode: string,
  vehicleType: VehicleType,
  enabled: boolean,
  dayRules: PicoPlacaDayRule[],
): PicoPlacaFormValues {
  const form = createEmptyPicoPlacaForm(cityCode, vehicleType);
  form.enabled = enabled;

  for (const rule of dayRules) {
    form.dayRules[rule.weekday] = [...rule.digits];
  }

  return form;
}

export function formValuesToDayRules(values: PicoPlacaFormValues): PicoPlacaDayRule[] {
  return WEEKDAYS.map((day) => ({
    weekday: day.value,
    digits: [...values.dayRules[day.value]].sort((a, b) => a - b),
  })).filter((rule) => rule.digits.length > 0);
}

export function validatePicoPlacaForm(values: PicoPlacaFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.cityCode.trim()) {
    errors.cityCode = 'Selecciona una ciudad.';
  }

  if (values.enabled) {
    const hasAnyDay = WEEKDAYS.some((day) => values.dayRules[day.value].length > 0);
    if (!hasAnyDay) {
      errors.dayRules = 'Marca al menos un día con dígitos restringidos.';
    }
  }

  for (const day of WEEKDAYS) {
    for (const digit of values.dayRules[day.value]) {
      if (!PLATE_DIGITS.includes(digit as (typeof PLATE_DIGITS)[number])) {
        errors[`day-${day.value}`] = 'Dígito inválido.';
      }
    }
  }

  return errors;
}

export function toggleDigit(
  values: PicoPlacaFormValues,
  weekday: Weekday,
  digit: number,
): PicoPlacaFormValues {
  const current = values.dayRules[weekday];
  const next = current.includes(digit)
    ? current.filter((value) => value !== digit)
    : [...current, digit].sort((a, b) => a - b);

  return {
    ...values,
    dayRules: {
      ...values.dayRules,
      [weekday]: next,
    },
  };
}
