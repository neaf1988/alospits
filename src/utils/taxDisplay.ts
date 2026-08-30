import type { TaxRecord, TaxStatus } from '../types';

export type TaxDisplayStatus =
  | 'paid'
  | 'overdue'
  | 'due-soon'
  | 'discount-soon'
  | 'discount-active'
  | 'pending';

export function daysUntilDate(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function toDateInputValue(isoDate?: string): string {
  const date = isoDate ? new Date(isoDate) : new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatTaxDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getTaxStatusLabel(status: TaxStatus): string {
  return status === 'PAID' ? 'Pagado' : 'Pendiente';
}

export function getTaxDisplayStatus(record: TaxRecord): TaxDisplayStatus {
  if (record.status === 'PAID') {
    return 'paid';
  }

  const daysUntilDue = daysUntilDate(record.dueDate);
  if (daysUntilDue < 0) {
    return 'overdue';
  }

  if (record.discountDueDate) {
    const daysUntilDiscount = daysUntilDate(record.discountDueDate);
    if (daysUntilDiscount >= 0) {
      return daysUntilDiscount <= 15 ? 'discount-soon' : 'discount-active';
    }
  }

  if (daysUntilDue <= 30) {
    return 'due-soon';
  }

  return 'pending';
}

export const TAX_STATUS_STYLES: Record<TaxDisplayStatus, string> = {
  paid: 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30',
  overdue: 'bg-red-500/20 text-red-300 ring-red-500/40',
  'due-soon': 'bg-amber-500/15 text-amber-200 ring-amber-500/30',
  'discount-soon': 'bg-sky-500/15 text-sky-200 ring-sky-500/30',
  'discount-active': 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  pending: 'bg-slate-700/50 text-slate-300 ring-slate-600/40',
};

export function getTaxDisplayStatusLabel(status: TaxDisplayStatus): string {
  switch (status) {
    case 'paid':
      return 'Pagado';
    case 'overdue':
      return 'Vencido';
    case 'due-soon':
      return 'Por vencer';
    case 'discount-soon':
      return 'Pronto pago';
    case 'discount-active':
      return 'Descuento vigente';
    default:
      return 'Pendiente';
  }
}

export function getTaxSummary(record: TaxRecord): string {
  if (record.status === 'PAID') {
    return record.paymentDate
      ? `Pagado el ${formatTaxDate(record.paymentDate)}`
      : 'Impuesto pagado';
  }

  const daysUntilDue = daysUntilDate(record.dueDate);
  const parts: string[] = [];

  if (daysUntilDue < 0) {
    parts.push(`Venció hace ${Math.abs(daysUntilDue)} día(s)`);
  } else if (daysUntilDue === 0) {
    parts.push('Vence hoy');
  } else {
    parts.push(`Vence en ${daysUntilDue} día(s)`);
  }

  if (record.discountDueDate) {
    const discountDays = daysUntilDate(record.discountDueDate);
    if (discountDays >= 0) {
      parts.push(`Pronto pago hasta ${formatTaxDate(record.discountDueDate)} (${discountDays} d)`);
    } else {
      parts.push('Ventana de pronto pago cerrada');
    }
  }

  return parts.join(' · ');
}

export function sortTaxRecordsByUrgency(records: TaxRecord[]): TaxRecord[] {
  return [...records].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'PENDING' ? -1 : 1;
    }
    return daysUntilDate(a.dueDate) - daysUntilDate(b.dueDate);
  });
}
