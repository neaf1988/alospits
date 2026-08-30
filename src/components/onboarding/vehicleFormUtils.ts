import type { Vehicle } from '../../types';

export interface VehicleFormValues {
  type: 'CAR' | 'MOTORCYCLE';
  brand: string;
  line: string;
  modelYear: string;
  plate: string;
  cityCode: string;
  currentOdometerKm: string;
  tireTreadDepthMm: string;
}

export const EMPTY_VEHICLE_FORM: VehicleFormValues = {
  type: 'CAR',
  brand: '',
  line: '',
  modelYear: String(new Date().getFullYear()),
  plate: '',
  cityCode: 'BOG',
  currentOdometerKm: '0',
  tireTreadDepthMm: '4.0',
};

export function validateVehicleForm(values: VehicleFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const currentYear = new Date().getFullYear();

  if (!values.brand.trim()) {
    errors.brand = 'Marca obligatoria.';
  }
  if (!values.line.trim()) {
    errors.line = 'Línea obligatoria.';
  }

  const year = Number(values.modelYear);
  if (!Number.isInteger(year) || year < 1980 || year > currentYear + 1) {
    errors.modelYear = `Año entre 1980 y ${currentYear + 1}.`;
  }

  if (!values.plate.trim()) {
    errors.plate = 'Placa obligatoria.';
  }

  if (!values.cityCode) {
    errors.cityCode = 'Ciudad obligatoria.';
  }

  const odometer = Number(values.currentOdometerKm);
  if (Number.isNaN(odometer) || odometer < 0) {
    errors.currentOdometerKm = 'Odómetro inválido.';
  }

  const tread = Number(values.tireTreadDepthMm);
  if (Number.isNaN(tread) || tread <= 0 || tread > 12) {
    errors.tireTreadDepthMm = 'Labrado entre 0.1 y 12 mm.';
  }

  return errors;
}

export function vehicleToFormValues(vehicle: Vehicle): VehicleFormValues {
  return {
    type: vehicle.type,
    brand: vehicle.brand,
    line: vehicle.line,
    modelYear: String(vehicle.modelYear),
    plate: vehicle.plate,
    cityCode: vehicle.cityCode,
    currentOdometerKm: String(vehicle.currentOdometerKm),
    tireTreadDepthMm: String(vehicle.tireTreadDepthMm),
  };
}
