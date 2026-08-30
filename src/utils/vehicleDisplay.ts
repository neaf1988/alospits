import type { Vehicle, VehicleType } from '../types';

export function getVehicleTypeLabel(type: VehicleType): string {
  return type === 'CAR' ? 'Carro' : 'Moto';
}

export function getVehicleDisplayName(vehicle: Vehicle): string {
  return `${vehicle.brand} ${vehicle.line}`.trim();
}

export function formatPlate(plate: string): string {
  return plate.toUpperCase();
}

export function formatOdometer(km: number): string {
  return `${km.toLocaleString('es-CO')} km`;
}
