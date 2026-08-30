import type { MaintenanceLog } from '../types';
import type { UpcomingMaintenance } from './maintenanceProjection';

export function toDateInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatServiceDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getNextServiceSummary(item: UpcomingMaintenance): string {
  const parts: string[] = [];

  if (item.kmRemaining !== null) {
    if (item.kmRemaining <= 0) {
      parts.push('Km objetivo alcanzado');
    } else {
      parts.push(`Faltan ${item.kmRemaining.toLocaleString('es-CO')} km`);
    }
  }

  if (item.daysByDate !== null) {
    if (item.daysByDate < 0) {
      parts.push(`Fecha vencida hace ${Math.abs(item.daysByDate)} día(s)`);
    } else if (item.daysByDate === 0) {
      parts.push('Vence hoy (fecha)');
    } else {
      parts.push(`Fecha en ${item.daysByDate} día(s)`);
    }
  }

  if (item.daysByKmProjection !== null && item.kmRemaining !== null && item.kmRemaining > 0) {
    parts.push(`Proyección ~${item.daysByKmProjection} día(s) por uso`);
  }

  return parts.join(' · ') || 'Próximo servicio programado';
}

export function hasUpcomingTarget(log: MaintenanceLog): boolean {
  return log.nextServiceKmTarget !== undefined || log.nextServiceDateTarget !== undefined;
}
