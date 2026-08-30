import { TIRE_TREAD_CRITICAL_MM } from '../types';
import type { ComplianceItem, DriverLicenses, FuelLog, MaintenanceLog, PicoPlacaSchedule, TaxRecord, Vehicle } from '../types';
import { getAlertSettings } from '../services/alertSettingsService';
import { getFuelEfficiencyAnomalyMessage } from './fuelMetrics';
import { getComplianceItemLabel } from './complianceDisplay';
import { getNextServiceSummary } from './maintenanceDisplay';
import { getUpcomingMaintenances } from './maintenanceProjection';
import { buildDriverLicenseAlerts } from './driverLicenseAlerts';
import { buildPicoPlacaAlerts } from './picoPlacaAlerts';
import { daysUntilDate } from './taxDisplay';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
}

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildVehicleAlerts(
  vehicle: Vehicle,
  complianceItems: ComplianceItem[],
  taxRecords: TaxRecord[],
  fuelLogs: FuelLog[] = [],
  maintenanceLogs: MaintenanceLog[] = [],
  picoPlacaSchedule?: PicoPlacaSchedule,
  driverLicenses?: DriverLicenses,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const alertSettings = getAlertSettings();

  alerts.push(...buildPicoPlacaAlerts(vehicle, picoPlacaSchedule));

  if (driverLicenses) {
    alerts.push(...buildDriverLicenseAlerts(driverLicenses, vehicle.type));
  }

  const fuelAnomalyMessage = getFuelEfficiencyAnomalyMessage(fuelLogs);
  if (fuelAnomalyMessage) {
    alerts.push({
      id: `fuel-anomaly-${vehicle.id}`,
      severity: 'warning',
      title: 'Rendimiento de combustible bajo',
      message: fuelAnomalyMessage,
    });
  }

  if (vehicle.tireTreadDepthMm <= TIRE_TREAD_CRITICAL_MM) {
    alerts.push({
      id: `tire-${vehicle.id}`,
      severity: 'critical',
      title: 'Llantas en límite legal',
      message: `Profundidad de labrado ${vehicle.tireTreadDepthMm.toFixed(1)} mm (mínimo ${TIRE_TREAD_CRITICAL_MM} mm).`,
    });
  } else if (vehicle.tireTreadDepthMm <= TIRE_TREAD_CRITICAL_MM + 0.5) {
    alerts.push({
      id: `tire-warn-${vehicle.id}`,
      severity: 'warning',
      title: 'Llantas por revisar',
      message: `Labrado en ${vehicle.tireTreadDepthMm.toFixed(1)} mm. Planifica cambio pronto.`,
    });
  }

  for (const item of complianceItems) {
    const days = daysUntil(item.expiryDate);
    const label = getComplianceItemLabel(item.type);
    if (days < 0) {
      alerts.push({
        id: `compliance-expired-${item.id}`,
        severity: 'critical',
        title: `${label} vencido`,
        message: `Venció hace ${Math.abs(days)} día(s).`,
      });
    } else if (days <= item.alertDaysBefore) {
      alerts.push({
        id: `compliance-soon-${item.id}`,
        severity: days <= 5 ? 'critical' : 'warning',
        title: `${label} por vencer`,
        message: `Vence en ${days} día(s).`,
      });
    }
  }

  for (const tax of taxRecords) {
    if (tax.status !== 'PENDING') {
      continue;
    }

    const daysUntilDue = daysUntilDate(tax.dueDate);

    if (daysUntilDue < 0) {
      alerts.push({
        id: `tax-overdue-${tax.id}`,
        severity: 'critical',
        title: `Impuesto ${tax.taxYear} vencido`,
        message: `Fecha límite superada hace ${Math.abs(daysUntilDue)} día(s).`,
      });
    } else if (daysUntilDue <= alertSettings.taxAlertDaysBefore) {
      alerts.push({
        id: `tax-soon-${tax.id}`,
        severity: daysUntilDue <= 5 ? 'critical' : 'warning',
        title: `Impuesto ${tax.taxYear} pendiente`,
        message: `Vence en ${daysUntilDue} día(s). Valor: $${tax.costCop.toLocaleString('es-CO')}.`,
      });
    }

    if (tax.discountDueDate) {
      const discountDays = daysUntilDate(tax.discountDueDate);
      if (discountDays >= 0 && discountDays <= 15) {
        alerts.push({
          id: `tax-discount-${tax.id}`,
          severity: discountDays <= 5 ? 'warning' : 'info',
          title: `Pronto pago impuesto ${tax.taxYear}`,
          message:
            discountDays === 0
              ? 'Último día con descuento por pronto pago.'
              : `Descuento vigente ${discountDays} día(s) más (hasta ${new Date(tax.discountDueDate).toLocaleDateString('es-CO')}).`,
        });
      }
    }
  }

  const upcomingMaintenances = getUpcomingMaintenances(
    vehicle.currentOdometerKm,
    maintenanceLogs,
    fuelLogs,
  );

  for (const item of upcomingMaintenances) {
    const summary = getNextServiceSummary(item);
    const isKmOverdue = item.kmRemaining !== null && item.kmRemaining <= 0;
    const isDateOverdue = item.daysByDate !== null && item.daysByDate < 0;
    const isKmSoon =
      item.kmRemaining !== null &&
      item.kmRemaining > 0 &&
      item.kmRemaining <= alertSettings.maintenanceKmWarning;
    const isDateSoon =
      item.daysByDate !== null &&
      item.daysByDate >= 0 &&
      item.daysByDate <= alertSettings.maintenanceDaysWarning;
    const isProjectionSoon =
      item.daysByKmProjection !== null &&
      item.daysByKmProjection <= alertSettings.maintenanceDaysWarning;

    if (!isKmOverdue && !isDateOverdue && !isKmSoon && !isDateSoon && !isProjectionSoon) {
      continue;
    }

    const severity: AlertSeverity =
      isKmOverdue || isDateOverdue || (item.daysByDate !== null && item.daysByDate <= 5)
        ? 'critical'
        : 'warning';

    alerts.push({
      id: `maint-${item.log.id}`,
      severity,
      title: `Mantenimiento: ${item.log.title}`,
      message: summary,
    });
  }

  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
