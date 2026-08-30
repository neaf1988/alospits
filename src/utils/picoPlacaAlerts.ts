import type { DashboardAlert } from './dashboardAlerts';
import type { PicoPlacaSchedule, Vehicle } from '../types';
import {
  formatDigitsList,
  getPicoPlacaRestrictionInfo,
} from './picoPlacaUtils';

export function buildPicoPlacaAlerts(
  vehicle: Vehicle,
  schedule: PicoPlacaSchedule | undefined,
): DashboardAlert[] {
  if (!schedule) {
    if (vehicle.type === 'MOTORCYCLE') {
      return [];
    }

    return [
      {
        id: `pico-placa-missing-${vehicle.id}`,
        severity: 'info',
        title: 'Pico y placa sin configurar',
        message: `No hay calendario para ${vehicle.cityCode} y carros. Configúralo en el menú.`,
      },
    ];
  }

  if (!schedule.enabled) {
    return [];
  }

  const info = getPicoPlacaRestrictionInfo(vehicle, schedule);
  if (!info) {
    return [];
  }

  const alerts: DashboardAlert[] = [];

  if (info.appliesToday) {
    alerts.push({
      id: `pico-placa-today-${vehicle.id}`,
      severity: 'critical',
      title: 'Pico y placa hoy',
      message: `Placa ${vehicle.plate.toUpperCase()} (dígito ${info.plateDigit}) tiene restricción hoy en ${info.cityName}. Dígitos: ${formatDigitsList(info.todayDigits)}.`,
    });
  } else if (info.appliesTomorrow) {
    alerts.push({
      id: `pico-placa-tomorrow-${vehicle.id}`,
      severity: 'warning',
      title: 'Pico y placa mañana',
      message: `Placa con dígito ${info.plateDigit} tendrá restricción mañana en ${info.cityName}. Dígitos: ${formatDigitsList(info.tomorrowDigits)}.`,
    });
  } else if (info.plateDigit === null) {
    alerts.push({
      id: `pico-placa-digit-${vehicle.id}`,
      severity: 'warning',
      title: 'Placa sin dígito válido',
      message: 'No se pudo determinar el último dígito numérico de la placa para evaluar pico y placa.',
    });
  }

  return alerts;
}
