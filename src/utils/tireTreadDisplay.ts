import { TIRE_TREAD_CRITICAL_MM } from '../types';

export type TireTreadStatus = 'critical' | 'warning' | 'ok';

export function getTireTreadStatus(depthMm: number): TireTreadStatus {
  if (depthMm <= TIRE_TREAD_CRITICAL_MM) {
    return 'critical';
  }
  if (depthMm <= TIRE_TREAD_CRITICAL_MM + 0.5) {
    return 'warning';
  }
  return 'ok';
}

export function getTireTreadStatusLabel(status: TireTreadStatus): string {
  switch (status) {
    case 'critical':
      return 'En límite legal';
    case 'warning':
      return 'Por revisar';
    default:
      return 'OK';
  }
}

export const TIRE_TREAD_STATUS_STYLES: Record<TireTreadStatus, string> = {
  critical: 'bg-red-500/15 text-red-200 ring-red-500/40',
  warning: 'bg-amber-500/15 text-amber-200 ring-amber-500/40',
  ok: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/40',
};
