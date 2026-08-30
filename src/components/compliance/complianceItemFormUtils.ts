import type { ComplianceItemType, Vehicle } from '../../types';
import { getDefaultComplianceAlertDays } from '../../services/alertSettingsService';
import {
  suggestAnnualRenewalExpiryDate,
  suggestFirstTecnomecanicaExpiryDate,
} from '../../utils/complianceNormativaUtils';

export interface ComplianceItemFormValues {
  type: ComplianceItemType;
  expiryDate: string;
  costCop: string;
  notes: string;
  alertDaysBefore: string;
}

export function createEmptyComplianceItemForm(
  type: ComplianceItemType = 'SOAT',
  vehicle?: Vehicle,
): ComplianceItemFormValues {
  let defaultDate: string;
  if (type === 'TECNOMECANICA' && vehicle) {
    defaultDate = suggestFirstTecnomecanicaExpiryDate(vehicle);
  } else {
    defaultDate = suggestAnnualRenewalExpiryDate();
  }

  return {
    type,
    expiryDate: defaultDate,
    costCop: '',
    notes: '',
    alertDaysBefore: String(getDefaultComplianceAlertDays()),
  };
}

export function validateComplianceItemForm(
  values: ComplianceItemFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.type) {
    errors.type = 'Selecciona el tipo de ítem.';
  }

  if (!values.expiryDate) {
    errors.expiryDate = 'Fecha de vencimiento obligatoria.';
  } else if (Number.isNaN(new Date(values.expiryDate).getTime())) {
    errors.expiryDate = 'Fecha inválida.';
  }

  if (values.costCop.trim()) {
    const cost = Number(values.costCop);
    if (Number.isNaN(cost) || cost <= 0) {
      errors.costCop = 'Costo inválido.';
    }
  }

  const alertDays = Number(values.alertDaysBefore);
  if (Number.isNaN(alertDays) || alertDays < 1 || alertDays > 365) {
    errors.alertDaysBefore = 'Alerta entre 1 y 365 días.';
  }

  return errors;
}
