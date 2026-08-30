import type { DriverLicenseClass, VehicleType } from '../types';

export interface DriverLicenseClassOption {
  class: DriverLicenseClass;
  vehicleType: VehicleType;
  label: string;
  description: string;
}

/** Categorías de licencia colombiana (RUNT) agrupadas por tipo de vehículo */
export const DRIVER_LICENSE_CLASSES: DriverLicenseClassOption[] = [
  {
    class: 'A1',
    vehicleType: 'MOTORCYCLE',
    label: 'A1',
    description: 'Motocicletas y motociclos hasta 125 cc',
  },
  {
    class: 'A2',
    vehicleType: 'MOTORCYCLE',
    label: 'A2',
    description: 'Motocicletas y motociclos de más de 125 cc',
  },
  {
    class: 'B1',
    vehicleType: 'CAR',
    label: 'B1',
    description: 'Automóviles, camperos y camionetas (servicio particular)',
  },
  {
    class: 'B2',
    vehicleType: 'CAR',
    label: 'B2',
    description: 'Camionetas, microbuses y busetas (servicio público)',
  },
  {
    class: 'B3',
    vehicleType: 'CAR',
    label: 'B3',
    description: 'Vehículos articulados (servicio público)',
  },
];

export const DEFAULT_LICENSE_ALERT_DAYS = 30;

export const LICENSE_ALERT_DAY_PRESETS = [30, 15, 5, 1] as const;

export function getDriverLicenseClassesForVehicleType(
  vehicleType: VehicleType,
): DriverLicenseClassOption[] {
  return DRIVER_LICENSE_CLASSES.filter((item) => item.vehicleType === vehicleType);
}

export function getDriverLicenseClassOption(
  licenseClass: DriverLicenseClass,
): DriverLicenseClassOption | undefined {
  return DRIVER_LICENSE_CLASSES.find((item) => item.class === licenseClass);
}
