import type { FuelLogFormValues } from './fuelLogFormUtils';
import { calculatePricePerGallon } from './fuelLogFormUtils';

interface FuelLogFormProps {
  values: FuelLogFormValues;
  errors: Record<string, string>;
  minOdometerKm: number;
  disabled?: boolean;
  onChange: (values: FuelLogFormValues) => void;
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

export function FuelLogForm({
  values,
  errors,
  minOdometerKm,
  disabled,
  onChange,
}: FuelLogFormProps) {
  function update<K extends keyof FuelLogFormValues>(key: K, value: FuelLogFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const pricePerGallon = calculatePricePerGallon(values.gallons, values.totalCostCop);

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="fuel-timestamp">Fecha y hora</FieldLabel>
        <input
          id="fuel-timestamp"
          type="datetime-local"
          className={inputClass}
          value={values.timestamp}
          disabled={disabled}
          onChange={(e) => update('timestamp', e.target.value)}
        />
        <FieldError message={errors.timestamp} />
      </div>

      <div>
        <FieldLabel htmlFor="fuel-odometer">Odómetro (km)</FieldLabel>
        <input
          id="fuel-odometer"
          type="number"
          min={minOdometerKm}
          step={1}
          className={inputClass}
          value={values.odometerKm}
          disabled={disabled}
          onChange={(e) => update('odometerKm', e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          Mínimo registrado: {minOdometerKm.toLocaleString('es-CO')} km
        </p>
        <FieldError message={errors.odometerKm} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="fuel-gallons">Galones</FieldLabel>
          <input
            id="fuel-gallons"
            type="number"
            min={0.01}
            step={0.01}
            inputMode="decimal"
            className={inputClass}
            value={values.gallons}
            disabled={disabled}
            placeholder="8.50"
            onChange={(e) => update('gallons', e.target.value)}
          />
          <FieldError message={errors.gallons} />
        </div>
        <div>
          <FieldLabel htmlFor="fuel-cost">Valor total (COP)</FieldLabel>
          <input
            id="fuel-cost"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className={inputClass}
            value={values.totalCostCop}
            disabled={disabled}
            placeholder="185000"
            onChange={(e) => update('totalCostCop', e.target.value)}
          />
          <FieldError message={errors.totalCostCop} />
        </div>
      </div>

      {pricePerGallon !== null && (
        <p className="rounded-lg bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
          Precio por galón:{' '}
          <span className="font-semibold text-pit-accent-muted">
            ${Math.round(pricePerGallon).toLocaleString('es-CO')}
          </span>
        </p>
      )}

      <div>
        <FieldLabel htmlFor="fuel-station">Estación (opcional)</FieldLabel>
        <input
          id="fuel-station"
          type="text"
          className={inputClass}
          value={values.stationName}
          disabled={disabled}
          placeholder="Terpel, Primax…"
          autoComplete="off"
          onChange={(e) => update('stationName', e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3">
        <label className="flex min-h-12 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={values.isFullTank}
            disabled={disabled}
            onChange={(e) => update('isFullTank', e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-900 text-pit-accent focus:ring-pit-accent"
          />
          <span>
            <span className="block text-sm font-medium text-slate-200">Tanque lleno</span>
            <span className="mt-0.5 block text-xs leading-snug text-slate-400">
              Necesario para calcular Km/Galón entre tanqueos consecutivos llenos.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
