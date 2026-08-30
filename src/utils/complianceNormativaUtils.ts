import type { Vehicle } from '../types';

const TECNO_FIRST_YEARS_CAR = 5;
const TECNO_FIRST_YEARS_MOTORCYCLE = 2;
const ANNUAL_RENEWAL_YEARS = 1;

function toDateInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Primera tecnomecanica segun spec 05 (vehiculo nuevo) */
export function suggestFirstTecnomecanicaExpiryDate(vehicle: Vehicle): string {
  const years =
    vehicle.type === 'MOTORCYCLE' ? TECNO_FIRST_YEARS_MOTORCYCLE : TECNO_FIRST_YEARS_CAR;
  const due = new Date(vehicle.modelYear, 0, 1);
  due.setFullYear(due.getFullYear() + years);
  return toDateInputValue(due);
}

export function suggestAnnualRenewalExpiryDate(fromDate: Date = new Date()): string {
  const due = new Date(fromDate);
  due.setFullYear(due.getFullYear() + ANNUAL_RENEWAL_YEARS);
  return toDateInputValue(due);
}

export function getTecnomecanicaSuggestionMessage(vehicle: Vehicle): string {
  const years =
    vehicle.type === 'MOTORCYCLE' ? TECNO_FIRST_YEARS_MOTORCYCLE : TECNO_FIRST_YEARS_CAR;
  const suggested = suggestFirstTecnomecanicaExpiryDate(vehicle);
  return `Vehículo ${vehicle.modelYear}: primera revisión estimada a los ${years} años (${suggested}). Para renovación anual usa +1 año desde hoy.`;
}
