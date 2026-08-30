import { COLOMBIAN_CITIES } from '../../constants/cities';
import { PLATE_DIGITS, WEEKDAYS } from '../../constants/weekdays';
import type { VehicleType } from '../../types';
import { getVehicleTypeLabel } from '../../utils/vehicleDisplay';
import {
  toggleDigit,
  type PicoPlacaFormValues,
} from './picoPlacaFormUtils';

interface PicoPlacaScheduleFormProps {
  values: PicoPlacaFormValues;
  errors: Record<string, string>;
  disabled?: boolean;
  isEditing?: boolean;
  onChange: (values: PicoPlacaFormValues) => void;
}

function FieldLabel({ children }: { children: string }) {
  return <p className="mb-1 text-xs font-medium text-slate-400">{children}</p>;
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

const selectClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-pit-accent focus:outline-none focus:ring-1 focus:ring-pit-accent';

export function PicoPlacaScheduleForm({
  values,
  errors,
  disabled,
  isEditing,
  onChange,
}: PicoPlacaScheduleFormProps) {
  function update<K extends keyof PicoPlacaFormValues>(key: K, value: PicoPlacaFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Ciudad</FieldLabel>
          {isEditing ? (
            <p className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-200">
              {COLOMBIAN_CITIES.find((city) => city.code === values.cityCode)?.name ??
                values.cityCode}
            </p>
          ) : (
            <select
              id="pico-placa-city"
              value={values.cityCode}
              disabled={disabled}
              onChange={(event) => update('cityCode', event.target.value)}
              className={selectClass}
            >
              {COLOMBIAN_CITIES.map((city) => (
                <option key={city.code} value={city.code}>
                  {city.name}
                </option>
              ))}
            </select>
          )}
          <FieldError message={errors.cityCode} />
        </div>

        <div>
          <FieldLabel>Tipo de vehículo</FieldLabel>
          {isEditing ? (
            <p className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-200">
              {getVehicleTypeLabel(values.vehicleType)}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(['CAR', 'MOTORCYCLE'] as VehicleType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => update('vehicleType', type)}
                  className={[
                    'min-h-12 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    values.vehicleType === type
                      ? 'bg-pit-accent/20 ring-2 ring-pit-accent text-slate-100'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80',
                  ].join(' ')}
                >
                  {getVehicleTypeLabel(type)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-700/60 bg-pit-surface px-4 py-3">
        <input
          type="checkbox"
          checked={values.enabled}
          disabled={disabled}
          onChange={(event) => update('enabled', event.target.checked)}
          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-pit-accent focus:ring-pit-accent"
        />
        <span className="text-sm text-slate-200">
          Aplica pico y placa para este tipo de vehículo en esta ciudad
        </span>
      </label>

      {values.enabled && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Días y dígitos restringidos
          </p>
          <p className="mb-3 text-xs text-slate-400">
            Se usa el último dígito numérico de la placa. Ej: ABC123 → 3, ABC12D → 2.
          </p>
          <FieldError message={errors.dayRules} />

          <div className="space-y-3">
            {WEEKDAYS.map((day) => (
              <div
                key={day.value}
                className="rounded-xl border border-slate-700/60 bg-pit-surface p-3"
              >
                <p className="mb-2 text-sm font-medium text-slate-200">{day.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLATE_DIGITS.map((digit) => {
                    const selected = values.dayRules[day.value].includes(digit);
                    return (
                      <button
                        key={digit}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(toggleDigit(values, day.value, digit))}
                        className={[
                          'min-h-10 min-w-10 rounded-lg text-sm font-semibold transition-colors',
                          selected
                            ? 'bg-pit-accent text-slate-950 ring-2 ring-pit-accent'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80',
                        ].join(' ')}
                        aria-pressed={selected}
                      >
                        {digit}
                      </button>
                    );
                  })}
                </div>
                <FieldError message={errors[`day-${day.value}`]} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
