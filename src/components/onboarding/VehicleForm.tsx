import { COLOMBIAN_CITIES } from '../../constants/cities';
import type { VehicleType } from '../../types';
import { getVehicleTypeLabel } from '../../utils/vehicleDisplay';
import {
  EMPTY_VEHICLE_FORM,
  validateVehicleForm,
  type VehicleFormValues,
} from './vehicleFormUtils';

interface VehicleFormProps {
  values: VehicleFormValues;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (values: VehicleFormValues) => void;
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

export function VehicleForm({ values, errors, disabled, onChange }: VehicleFormProps) {
  function update<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <fieldset disabled={disabled}>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Tipo de vehículo
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(['CAR', 'MOTORCYCLE'] as VehicleType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update('type', type)}
              className={[
                'min-h-12 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                values.type === type
                  ? 'bg-pit-accent/20 ring-2 ring-pit-accent text-slate-100'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80',
              ].join(' ')}
            >
              {getVehicleTypeLabel(type)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="brand">Marca</FieldLabel>
          <input
            id="brand"
            className={inputClass}
            value={values.brand}
            onChange={(e) => update('brand', e.target.value)}
            placeholder="Mazda, AKT…"
            autoComplete="off"
          />
          <FieldError message={errors.brand} />
        </div>
        <div>
          <FieldLabel htmlFor="line">Línea</FieldLabel>
          <input
            id="line"
            className={inputClass}
            value={values.line}
            onChange={(e) => update('line', e.target.value)}
            placeholder="3, NKD 125…"
            autoComplete="off"
          />
          <FieldError message={errors.line} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="modelYear">Año modelo</FieldLabel>
          <input
            id="modelYear"
            type="number"
            min={1980}
            max={new Date().getFullYear() + 1}
            className={inputClass}
            value={values.modelYear}
            onChange={(e) => update('modelYear', e.target.value)}
          />
          <FieldError message={errors.modelYear} />
        </div>
        <div>
          <FieldLabel htmlFor="plate">Placa</FieldLabel>
          <input
            id="plate"
            className={inputClass}
            value={values.plate}
            onChange={(e) => update('plate', e.target.value.toUpperCase())}
            placeholder="ABC123"
            autoComplete="off"
          />
          <FieldError message={errors.plate} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="cityCode">Ciudad (pico y placa)</FieldLabel>
        <select
          id="cityCode"
          className={inputClass}
          value={values.cityCode}
          onChange={(e) => update('cityCode', e.target.value)}
        >
          {COLOMBIAN_CITIES.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name} ({city.code})
            </option>
          ))}
        </select>
        <FieldError message={errors.cityCode} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="odometer">Odómetro (km)</FieldLabel>
          <input
            id="odometer"
            type="number"
            min={0}
            step={1}
            className={inputClass}
            value={values.currentOdometerKm}
            onChange={(e) => update('currentOdometerKm', e.target.value)}
          />
          <FieldError message={errors.currentOdometerKm} />
        </div>
        <div>
          <FieldLabel htmlFor="tread">Labrado llantas (mm)</FieldLabel>
          <input
            id="tread"
            type="number"
            min={0.1}
            max={12}
            step={0.1}
            className={inputClass}
            value={values.tireTreadDepthMm}
            onChange={(e) => update('tireTreadDepthMm', e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Valor inicial estimado. Actualízalo en Cumplimiento cuando midas las llantas.
          </p>
          <FieldError message={errors.tireTreadDepthMm} />
        </div>
      </div>
    </div>
  );
}

export { EMPTY_VEHICLE_FORM, validateVehicleForm };
