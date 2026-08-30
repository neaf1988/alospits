import type { Weekday } from '../types';

export interface WeekdayOption {
  value: Weekday;
  label: string;
  short: string;
}

export const WEEKDAYS: WeekdayOption[] = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
];

export const PLATE_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function getWeekdayLabel(weekday: Weekday): string {
  return WEEKDAYS.find((day) => day.value === weekday)?.label ?? `Día ${weekday}`;
}

export function getWeekdayShort(weekday: Weekday): string {
  return WEEKDAYS.find((day) => day.value === weekday)?.short ?? String(weekday);
}
