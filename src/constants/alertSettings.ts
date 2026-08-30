/** Umbrales configurables para alertas in-app (spec 05) */
export const DEFAULT_ALERT_SETTINGS = {
  /** Días antes del vencimiento para nuevos ítems de cumplimiento */
  defaultComplianceAlertDays: 30,
  /** Impuestos pendientes: avisar cuando falten N días o menos */
  taxAlertDaysBefore: 30,
  /** Mantenimiento por km: aviso si faltan N km o menos */
  maintenanceKmWarning: 500,
  /** Mantenimiento por fecha/proyección: aviso si faltan N días o menos */
  maintenanceDaysWarning: 30,
} as const;

export type AlertSettings = {
  defaultComplianceAlertDays: number;
  taxAlertDaysBefore: number;
  maintenanceKmWarning: number;
  maintenanceDaysWarning: number;
};
