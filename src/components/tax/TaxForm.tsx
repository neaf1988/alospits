import type { TaxFormValues } from './taxFormUtils';

interface TaxFormProps {
  values: TaxFormValues;
  errors: Record<string, string>;
  disabled?: boolean;
  isEditing?: boolean;
  availableYears: number[];
  onChange: (values: TaxFormValues) => void;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-400">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p className="mt-1 text-xs text-red-400" role="alert">
      {message}
    </p>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-pit-accent focus:outline-none focus:ring-1 focus:ring-pit-accent';

export function TaxForm({
  values,
  errors,
  disabled,
  isEditing,
  availableYears,
  onChange,
}: TaxFormProps) {
  function update<K extends keyof TaxFormValues>(key: K, value: TaxFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="tax-year">Año gravable</FieldLabel>
        {isEditing ? (
          <input
            id="tax-year"
            type="number"
            className={inputClass}
            value={values.taxYear}
            disabled
            readOnly
          />
        ) : (
          <select
            id="tax-year"
            className={inputClass}
            value={values.taxYear}
            disabled={disabled}
            onChange={(e) => update('taxYear', e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        )}
        <FieldError message={errors.taxYear} />
      </div>

      <div>
        <FieldLabel htmlFor="tax-due">Fecha límite de pago</FieldLabel>
        <input
          id="tax-due"
          type="date"
          className={inputClass}
          value={values.dueDate}
          disabled={disabled}
          onChange={(e) => update('dueDate', e.target.value)}
        />
        <FieldError message={errors.dueDate} />
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 space-y-3">
        <label className="flex min-h-12 items-start gap-3">
          <input
            type="checkbox"
            checked={values.hasDiscountDueDate}
            disabled={disabled}
            onChange={(e) => update('hasDiscountDueDate', e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-900 text-pit-accent"
          />
          <span>
            <span className="block text-sm font-medium text-slate-200">
              Descuento por pronto pago
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Impuesto departamental — semaforización de fecha con descuento
            </span>
          </span>
        </label>
        {values.hasDiscountDueDate && (
          <div>
            <FieldLabel htmlFor="tax-discount">Fecha límite pronto pago</FieldLabel>
            <input
              id="tax-discount"
              type="date"
              className={inputClass}
              value={values.discountDueDate}
              disabled={disabled}
              onChange={(e) => update('discountDueDate', e.target.value)}
            />
            <FieldError message={errors.discountDueDate} />
          </div>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="tax-cost">Valor impuesto (COP)</FieldLabel>
        <input
          id="tax-cost"
          type="number"
          min={1}
          step={1}
          className={inputClass}
          value={values.costCop}
          disabled={disabled}
          placeholder="850000"
          onChange={(e) => update('costCop', e.target.value)}
        />
        <FieldError message={errors.costCop} />
      </div>

      <div>
        <FieldLabel htmlFor="tax-status">Estado</FieldLabel>
        <select
          id="tax-status"
          className={inputClass}
          value={values.status}
          disabled={disabled}
          onChange={(e) => update('status', e.target.value as TaxFormValues['status'])}
        >
          <option value="PENDING">Pendiente</option>
          <option value="PAID">Pagado</option>
        </select>
      </div>

      {values.status === 'PAID' && (
        <div>
          <FieldLabel htmlFor="tax-payment">Fecha de pago</FieldLabel>
          <input
            id="tax-payment"
            type="date"
            className={inputClass}
            value={values.paymentDate}
            disabled={disabled}
            onChange={(e) => update('paymentDate', e.target.value)}
          />
          <FieldError message={errors.paymentDate} />
        </div>
      )}
    </div>
  );
}
