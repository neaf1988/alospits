import type { ComplianceItemType } from '../types';

export interface ComplianceItemTypeOption {
  value: ComplianceItemType;
  label: string;
  description: string;
}

export const COMPLIANCE_ITEM_TYPES: ComplianceItemTypeOption[] = [
  {
    value: 'SOAT',
    label: 'SOAT',
    description: 'Seguro Obligatorio de Accidentes de Tránsito',
  },
  {
    value: 'TECNOMECANICA',
    label: 'Tecnomecánica',
    description: 'Revisión técnico-mecánica y de emisiones',
  },
  {
    value: 'SEGURO_TODO_RIESGO',
    label: 'Seguro todo riesgo',
    description: 'Póliza adicional voluntaria',
  },
  {
    value: 'BOTIQUIN',
    label: 'Botiquín',
    description: 'Un único registro con fecha global de vencimiento',
  },
  {
    value: 'EXTINTOR',
    label: 'Extintor',
    description: 'Recarga anual obligatoria (12 meses)',
  },
];

/** Intervalos de alerta según spec 05 (días antes del vencimiento) */
export const ALERT_DAY_PRESETS = [30, 15, 5, 1] as const;

export const DEFAULT_ALERT_DAYS_BEFORE = 30;

/** SOAT, tecnomecánica y seguros */
export const COMPLIANCE_DOCUMENT_TYPES: ComplianceItemType[] = [
  'SOAT',
  'TECNOMECANICA',
  'SEGURO_TODO_RIESGO',
];

/** Botiquín y extintor (elementos de seguridad, no documentos) */
export const COMPLIANCE_SAFETY_TYPES: ComplianceItemType[] = ['BOTIQUIN', 'EXTINTOR'];
