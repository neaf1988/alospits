import type { TaxStatus } from '../../types';

export interface TaxFormValues {
  taxYear: string;
  dueDate: string;
  hasDiscountDueDate: boolean;
  discountDueDate: string;
  costCop: string;
  status: TaxStatus;
  paymentDate: string;
}

export function toDateInputValue(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function createEmptyTaxForm(taxYear?: number): TaxFormValues {
  const year = taxYear ?? new Date().getFullYear();
  const dueDefault = new Date(year, 4, 31);
  const discountDefault = new Date(year, 2, 31);

  return {
    taxYear: String(year),
    dueDate: toDateInputValue(dueDefault),
    hasDiscountDueDate: true,
    discountDueDate: toDateInputValue(discountDefault),
    costCop: '',
    status: 'PENDING',
    paymentDate: toDateInputValue(),
  };
}

export function validateTaxForm(values: TaxFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const currentYear = new Date().getFullYear();
  const year = Number(values.taxYear);

  if (!Number.isInteger(year) || year < 2000 || year > currentYear + 1) {
    errors.taxYear = `Año entre 2000 y ${currentYear + 1}.`;
  }

  if (!values.dueDate) {
    errors.dueDate = 'Fecha límite obligatoria.';
  } else if (Number.isNaN(new Date(values.dueDate).getTime())) {
    errors.dueDate = 'Fecha inválida.';
  }

  if (values.hasDiscountDueDate) {
    if (!values.discountDueDate) {
      errors.discountDueDate = 'Fecha de pronto pago obligatoria.';
    } else if (Number.isNaN(new Date(values.discountDueDate).getTime())) {
      errors.discountDueDate = 'Fecha inválida.';
    } else if (values.dueDate && values.discountDueDate > values.dueDate) {
      errors.discountDueDate = 'No puede ser posterior al vencimiento.';
    }
  }

  const cost = Number(values.costCop);
  if (Number.isNaN(cost) || cost <= 0) {
    errors.costCop = 'Valor del impuesto obligatorio.';
  }

  if (values.status === 'PAID') {
    if (!values.paymentDate) {
      errors.paymentDate = 'Fecha de pago obligatoria.';
    } else if (Number.isNaN(new Date(values.paymentDate).getTime())) {
      errors.paymentDate = 'Fecha inválida.';
    }
  }

  return errors;
}
