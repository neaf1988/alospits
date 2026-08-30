export interface MaintenanceFormValues {
  serviceDate: string;
  odometerKm: string;
  title: string;
  details: string;
  costCop: string;
  workshopName: string;
  invoiceNumber: string;
  nextServiceKmTarget: string;
  nextServiceDateTarget: string;
  hasKmTarget: boolean;
  hasDateTarget: boolean;
}

export function toDateInputValue(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function createEmptyMaintenanceForm(currentOdometerKm: number): MaintenanceFormValues {
  return {
    serviceDate: toDateInputValue(),
    odometerKm: String(currentOdometerKm),
    title: '',
    details: '',
    costCop: '',
    workshopName: '',
    invoiceNumber: '',
    nextServiceKmTarget: '',
    nextServiceDateTarget: '',
    hasKmTarget: false,
    hasDateTarget: false,
  };
}

export function validateMaintenanceForm(
  values: MaintenanceFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.serviceDate) {
    errors.serviceDate = 'Fecha obligatoria.';
  } else if (Number.isNaN(new Date(values.serviceDate).getTime())) {
    errors.serviceDate = 'Fecha inválida.';
  }

  const odometer = Number(values.odometerKm);
  if (Number.isNaN(odometer) || odometer < 0) {
    errors.odometerKm = 'Odómetro inválido.';
  }

  if (!values.title.trim()) {
    errors.title = 'Título obligatorio.';
  }

  if (!values.details.trim()) {
    errors.details = 'Descripción obligatoria.';
  }

  const cost = Number(values.costCop);
  if (Number.isNaN(cost) || cost <= 0) {
    errors.costCop = 'Costo obligatorio.';
  }

  if (values.hasKmTarget) {
    const targetKm = Number(values.nextServiceKmTarget);
    if (Number.isNaN(targetKm) || targetKm <= 0) {
      errors.nextServiceKmTarget = 'Km objetivo inválido.';
    } else if (!Number.isNaN(odometer) && targetKm <= odometer) {
      errors.nextServiceKmTarget = 'Debe ser mayor al odómetro del servicio.';
    }
  }

  if (values.hasDateTarget) {
    if (!values.nextServiceDateTarget) {
      errors.nextServiceDateTarget = 'Fecha objetivo obligatoria.';
    } else if (Number.isNaN(new Date(values.nextServiceDateTarget).getTime())) {
      errors.nextServiceDateTarget = 'Fecha inválida.';
    }
  }

  return errors;
}
