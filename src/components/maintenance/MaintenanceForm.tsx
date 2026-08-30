import type { MaintenanceFormValues } from './maintenanceFormUtils';

interface MaintenanceFormProps {
  values: MaintenanceFormValues;
  errors: Record<string, string>;
  currentOdometerKm?: number;
  disabled?: boolean;
  onChange: (values: MaintenanceFormValues) => void;
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

export function MaintenanceForm({
  values,
  errors,
  currentOdometerKm,
  disabled,
  onChange,
}: MaintenanceFormProps) {
  function update<K extends keyof MaintenanceFormValues>(
    key: K,
    value: MaintenanceFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="maint-date">Fecha del servicio</FieldLabel>
          <input
            id="maint-date"
            type="date"
            className={inputClass}
            value={values.serviceDate}
            disabled={disabled}
            onChange={(e) => update('serviceDate', e.target.value)}
          />
          <FieldError message={errors.serviceDate} />
        </div>
        <div>
          <FieldLabel htmlFor="maint-odometer">Odómetro (km)</FieldLabel>
          <input
            id="maint-odometer"
            type="number"
            min={0}
            step={1}
            className={inputClass}
            value={values.odometerKm}
            disabled={disabled}
            onChange={(e) => update('odometerKm', e.target.value)}
          />
          {currentOdometerKm !== undefined && (
            <p className="mt-1 text-xs text-slate-500">
              Odómetro actual del vehículo: {currentOdometerKm.toLocaleString('es-CO')} km. Puedes
              registrar uno anterior si estás cargando un servicio olvidado.
            </p>
          )}
          <FieldError message={errors.odometerKm} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="maint-title">Título del servicio</FieldLabel>
        <input
          id="maint-title"
          type="text"
          className={inputClass}
          value={values.title}
          disabled={disabled}
          placeholder="Cambio de aceite, frenos, sincronización…"
          onChange={(e) => update('title', e.target.value)}
        />
        <FieldError message={errors.title} />
      </div>

      <div>
        <FieldLabel htmlFor="maint-details">Detalle / repuestos</FieldLabel>
        <textarea
          id="maint-details"
          rows={4}
          className={`${inputClass} resize-none`}
          value={values.details}
          disabled={disabled}
          placeholder="Aceite 5W-30, filtro OEM, mano de obra…"
          onChange={(e) => update('details', e.target.value)}
        />
        <FieldError message={errors.details} />
      </div>

      <div>
        <FieldLabel htmlFor="maint-cost">Costo total (COP)</FieldLabel>
        <input
          id="maint-cost"
          type="number"
          min={1}
          step={1}
          className={inputClass}
          value={values.costCop}
          disabled={disabled}
          placeholder="350000"
          onChange={(e) => update('costCop', e.target.value)}
        />
        <FieldError message={errors.costCop} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="maint-workshop">Taller (opcional)</FieldLabel>
          <input
            id="maint-workshop"
            type="text"
            className={inputClass}
            value={values.workshopName}
            disabled={disabled}
            onChange={(e) => update('workshopName', e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="maint-invoice">Factura Nº (opcional)</FieldLabel>
          <input
            id="maint-invoice"
            type="text"
            className={inputClass}
            value={values.invoiceNumber}
            disabled={disabled}
            onChange={(e) => update('invoiceNumber', e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Próximo servicio (opcional)
        </p>

        <label className="flex min-h-12 items-start gap-3">
          <input
            type="checkbox"
            checked={values.hasKmTarget}
            disabled={disabled}
            onChange={(e) => update('hasKmTarget', e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-900 text-pit-accent"
          />
          <span className="flex-1">
            <span className="block text-sm text-slate-200">Por kilometraje</span>
            {values.hasKmTarget && (
              <input
                type="number"
                min={1}
                step={1}
                className={`${inputClass} mt-2`}
                value={values.nextServiceKmTarget}
                disabled={disabled}
                placeholder="50000"
                onChange={(e) => update('nextServiceKmTarget', e.target.value)}
              />
            )}
            <FieldError message={errors.nextServiceKmTarget} />
          </span>
        </label>

        <label className="flex min-h-12 items-start gap-3">
          <input
            type="checkbox"
            checked={values.hasDateTarget}
            disabled={disabled}
            onChange={(e) => update('hasDateTarget', e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-900 text-pit-accent"
          />
          <span className="flex-1">
            <span className="block text-sm text-slate-200">Por fecha</span>
            {values.hasDateTarget && (
              <input
                type="date"
                className={`${inputClass} mt-2`}
                value={values.nextServiceDateTarget}
                disabled={disabled}
                onChange={(e) => update('nextServiceDateTarget', e.target.value)}
              />
            )}
            <FieldError message={errors.nextServiceDateTarget} />
          </span>
        </label>

        <p className="text-xs text-slate-500">
          Con tanqueos registrados, proyectamos la fecha estimada por km/día (spec 04).
        </p>
      </div>
    </div>
  );
}
