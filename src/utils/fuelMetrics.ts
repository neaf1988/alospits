import type { FuelLog } from '../types';

/** Km/Galón solo entre tanqueos llenos consecutivos (spec 04) */
export function calculateLatestFuelEfficiency(logs: FuelLog[]): number | null {
  const fullTanks = [...logs]
    .filter((log) => log.isFullTank)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (fullTanks.length < 2) {
    return null;
  }

  const previous = fullTanks[fullTanks.length - 2];
  const current = fullTanks[fullTanks.length - 1];
  const kmDelta = current.odometerKm - previous.odometerKm;

  if (kmDelta <= 0 || current.gallons <= 0) {
    return null;
  }

  return kmDelta / current.gallons;
}

export function calculateLatestCostPerKm(logs: FuelLog[]): number | null {
  if (logs.length < 2) {
    return null;
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const previous = sorted[sorted.length - 2];
  const current = sorted[sorted.length - 1];
  const kmDelta = current.odometerKm - previous.odometerKm;

  if (kmDelta <= 0) {
    return null;
  }

  return current.totalCostCop / kmDelta;
}

export function formatEfficiency(kmPerGal: number): string {
  return `${kmPerGal.toFixed(1)} km/gal`;
}

export function formatCopPerKm(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CO')}/km`;
}

export function formatDailyKm(kmPerDay: number): string {
  return `${kmPerDay.toFixed(1)} km/día`;
}

/** Eficiencias Km/Gal entre tanqueos llenos consecutivos */
export function calculateFullTankEfficiencies(logs: FuelLog[]): number[] {
  const fullTanks = [...logs]
    .filter((log) => log.isFullTank)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const efficiencies: number[] = [];

  for (let i = 1; i < fullTanks.length; i += 1) {
    const kmDelta = fullTanks[i].odometerKm - fullTanks[i - 1].odometerKm;
    if (kmDelta > 0 && fullTanks[i].gallons > 0) {
      efficiencies.push(kmDelta / fullTanks[i].gallons);
    }
  }

  return efficiencies;
}

const EFFICIENCY_DROP_THRESHOLD = 0.15;

/** Alerta si la eficiencia cae >15% vs promedio de los 3 tanqueos llenos previos (spec 04) */
export function hasFuelEfficiencyAnomaly(logs: FuelLog[]): boolean {
  const efficiencies = calculateFullTankEfficiencies(logs);
  if (efficiencies.length < 4) {
    return false;
  }

  const latest = efficiencies[efficiencies.length - 1];
  const previousThree = efficiencies.slice(-4, -1);
  const average =
    previousThree.reduce((sum, value) => sum + value, 0) / previousThree.length;

  return latest < average * (1 - EFFICIENCY_DROP_THRESHOLD);
}

export function getFuelEfficiencyAnomalyMessage(logs: FuelLog[]): string | null {
  const efficiencies = calculateFullTankEfficiencies(logs);
  if (efficiencies.length < 4) {
    return null;
  }

  const latest = efficiencies[efficiencies.length - 1];
  const previousThree = efficiencies.slice(-4, -1);
  const average =
    previousThree.reduce((sum, value) => sum + value, 0) / previousThree.length;

  if (latest >= average * (1 - EFFICIENCY_DROP_THRESHOLD)) {
    return null;
  }

  const dropPercent = Math.round((1 - latest / average) * 100);
  return `Rendimiento ${dropPercent}% bajo el promedio reciente (${latest.toFixed(1)} vs ${average.toFixed(1)} km/gal). Revisa presión de llantas o inyectores.`;
}
