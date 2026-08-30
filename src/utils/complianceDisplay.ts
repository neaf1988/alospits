import type { ComplianceItem, ComplianceItemType } from '../types';
import { COMPLIANCE_ITEM_TYPES } from '../constants/complianceItems';

export type ComplianceItemStatus = 'expired' | 'critical' | 'warning' | 'ok';

export function getComplianceItemLabel(type: ComplianceItemType): string {
  return COMPLIANCE_ITEM_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function daysUntilExpiry(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getComplianceItemStatus(item: ComplianceItem): ComplianceItemStatus {
  const days = daysUntilExpiry(item.expiryDate);

  if (days < 0) {
    return 'expired';
  }
  if (days <= 5) {
    return 'critical';
  }
  if (days <= item.alertDaysBefore) {
    return 'warning';
  }
  return 'ok';
}

export function getComplianceItemStatusLabel(status: ComplianceItemStatus): string {
  switch (status) {
    case 'expired':
      return 'Vencido';
    case 'critical':
      return 'Urgente';
    case 'warning':
      return 'Por vencer';
    default:
      return 'Vigente';
  }
}

export const COMPLIANCE_STATUS_STYLES: Record<ComplianceItemStatus, string> = {
  expired: 'bg-red-500/20 text-red-300 ring-red-500/40',
  critical: 'bg-red-500/15 text-red-200 ring-red-500/30',
  warning: 'bg-amber-500/15 text-amber-200 ring-amber-500/30',
  ok: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30',
};

export function formatExpiryDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getExpiryCountdownText(item: ComplianceItem): string {
  const days = daysUntilExpiry(item.expiryDate);
  if (days < 0) {
    return `Venció hace ${Math.abs(days)} día(s)`;
  }
  if (days === 0) {
    return 'Vence hoy';
  }
  return `Vence en ${days} día(s)`;
}

export function sortComplianceItemsByUrgency(items: ComplianceItem[]): ComplianceItem[] {
  return [...items].sort((a, b) => {
    const daysA = daysUntilExpiry(a.expiryDate);
    const daysB = daysUntilExpiry(b.expiryDate);
    return daysA - daysB;
  });
}

export function toDateInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
