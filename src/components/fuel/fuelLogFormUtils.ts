import type { FuelLog } from '../../types';

export interface FuelLogFormValues {
  timestamp: string;
  odometerKm: string;
  gallons: string;
  totalCostCop: string;
  isFullTank: boolean;
  stationName: string;
}

export function toDatetimeLocalValue(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createEmptyFuelLogForm(currentOdometerKm: number): FuelLogFormValues {
  return {
    timestamp: toDatetimeLocalValue(),
    odometerKm: String(currentOdometerKm),
    gallons: '',
    totalCostCop: '',
    isFullTank: true,
    stationName: '',
  };
}

export function validateFuelLogForm(values: FuelLogFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.timestamp) {
    errors.timestamp = 'Fecha obligatoria.';
  } else if (Number.isNaN(new Date(values.timestamp).getTime())) {
    errors.timestamp = 'Fecha u hora inválida.';
  }

  const odometer = Number(values.odometerKm);
  if (Number.isNaN(odometer) || odometer < 0) {
    errors.odometerKm = 'Odómetro inválido.';
  }

  const gallons = Number(values.gallons);
  if (Number.isNaN(gallons) || gallons <= 0) {
    errors.gallons = 'Ingresa los galones cargados.';
  }

  const totalCost = Number(values.totalCostCop);
  if (Number.isNaN(totalCost) || totalCost <= 0) {
    errors.totalCostCop = 'Ingresa el valor total pagado.';
  }

  return errors;
}

export function calculatePricePerGallon(gallons: string, totalCostCop: string): number | null {
  const g = Number(gallons);
  const cost = Number(totalCostCop);
  if (Number.isNaN(g) || Number.isNaN(cost) || g <= 0 || cost <= 0) {
    return null;
  }
  return cost / g;
}

export function fuelLogToFormValues(log: FuelLog): FuelLogFormValues {
  return {
    timestamp: toDatetimeLocalValue(new Date(log.timestamp)),
    odometerKm: String(log.odometerKm),
    gallons: String(log.gallons),
    totalCostCop: String(log.totalCostCop),
    isFullTank: log.isFullTank,
    stationName: log.stationName ?? '',
  };
}
