import type { PicoPlacaDayRule, VehicleType } from '../types';

/** Patrón típico lunes–viernes en ciudades colombianas (carros) */
export function buildStandardCarWeekRules(): PicoPlacaDayRule[] {
  return [
    { weekday: 1, digits: [1, 2] },
    { weekday: 2, digits: [3, 4] },
    { weekday: 3, digits: [5, 6] },
    { weekday: 4, digits: [7, 8] },
    { weekday: 5, digits: [9, 0] },
  ];
}

export interface PicoPlacaDefaultSeed {
  cityCode: string;
  vehicleType: VehicleType;
  enabled: boolean;
  dayRules: PicoPlacaDayRule[];
}

/** Valores iniciales editables por el usuario */
export const PICO_PLACA_DEFAULT_SEEDS: PicoPlacaDefaultSeed[] = [
  { cityCode: 'BOG', vehicleType: 'CAR', enabled: true, dayRules: buildStandardCarWeekRules() },
  { cityCode: 'BOG', vehicleType: 'MOTORCYCLE', enabled: false, dayRules: [] },
  { cityCode: 'MDE', vehicleType: 'CAR', enabled: true, dayRules: buildStandardCarWeekRules() },
  { cityCode: 'MDE', vehicleType: 'MOTORCYCLE', enabled: false, dayRules: [] },
  { cityCode: 'CLO', vehicleType: 'CAR', enabled: true, dayRules: buildStandardCarWeekRules() },
  { cityCode: 'CLO', vehicleType: 'MOTORCYCLE', enabled: false, dayRules: [] },
  { cityCode: 'BAQ', vehicleType: 'CAR', enabled: true, dayRules: buildStandardCarWeekRules() },
  { cityCode: 'BAQ', vehicleType: 'MOTORCYCLE', enabled: false, dayRules: [] },
  { cityCode: 'BGA', vehicleType: 'CAR', enabled: true, dayRules: buildStandardCarWeekRules() },
  { cityCode: 'BGA', vehicleType: 'MOTORCYCLE', enabled: false, dayRules: [] },
];
