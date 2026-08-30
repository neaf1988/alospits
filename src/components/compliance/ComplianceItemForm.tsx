import {
  ALERT_DAY_PRESETS,
  COMPLIANCE_ITEM_TYPES,
} from '../../constants/complianceItems';
import type { ComplianceItemType } from '../../types';
import type { ComplianceItemFormValues } from './complianceItemFormUtils';

interface ComplianceItemFormProps {
  values: ComplianceItemFormValues;
  errors: Record<string, string>;
  disabled?: boolean;
  isEditing?: boolean;
  availableTypes: ComplianceItemType[];
  onChange: (values: ComplianceItemFormValues) => void;
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

export function ComplianceItemForm({
  values,
  errors,
  disabled,
  isEditing,
  availableTypes,
  onChange,
}: ComplianceItemFormProps) {
  function update<K extends keyof ComplianceItemFormValues>(
    key: K,
    value: ComplianceItemFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  const selectableTypes = isEditing
    ? COMPLIANCE_ITEM_TYPES.filter(
        (item) => item.value === values.type || availableTypes.includes(item.value),
      )
    : COMPLIANCE_ITEM_TYPES.filter((item) => availableTypes.includes(item.value));

  const selectedTypeInfo = COMPLIANCE_ITEM_TYPES.find((item) => item.value === values.type);

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="compliance-type">Tipo</FieldLabel>
        <select
          id="compliance-type"
          className={inputClass}
          value={values.type}
          disabled={disabled || isEditing}
          onChange={(e) => update('type', e.target.value as ComplianceItemType)}
        >
          {selectableTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {selectedTypeInfo && (
          <p className="mt-1 text-xs text-slate-500">{selectedTypeInfo.description}</p>
        )}
        {values.type === 'BOTIQUIN' && (
          <p className="mt-2 rounded-lg bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            Regla: un único botiquín por vehículo con una fecha global de vencimiento.
          </p>
        )}
        <FieldError message={errors.type} />
      </div>

      <div>
        <FieldLabel htmlFor="compliance-expiry">Fecha de vencimiento</FieldLabel>
        <input
          id="compliance-expiry"
          type="date"
          className={inputClass}
          value={values.expiryDate}
          disabled={disabled}
          onChange={(e) => update('expiryDate', e.target.value)}
        />
        <FieldError message={errors.expiryDate} />
      </div>

      <div>
        <FieldLabel htmlFor="compliance-cost">Costo / valor (COP, opcional)</FieldLabel>
        <input
          id="compliance-cost"
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
        <FieldLabel htmlFor="compliance-alert">Alertar días antes</FieldLabel>
        <select
          id="compliance-alert"
          className={inputClass}
          value={values.alertDaysBefore}
          disabled={disabled}
          onChange={(e) => update('alertDaysBefore', e.target.value)}
        >
          {ALERT_DAY_PRESETS.map((days) => (
            <option key={days} value={String(days)}>
              {days} días antes
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Calendario normativo: alertas a 30, 15, 5 y 1 día(s) antes.
        </p>
        <FieldError message={errors.alertDaysBefore} />
      </div>

      <div>
        <FieldLabel htmlFor="compliance-notes">Notas (opcional)</FieldLabel>
        <textarea
          id="compliance-notes"
          rows={3}
          className={`${inputClass} resize-none`}
          value={values.notes}
          disabled={disabled}
          placeholder="Aseguradora, número de póliza, observaciones…"
          onChange={(e) => update('notes', e.target.value)}
        />
      </div>
    </div>
  );
}
