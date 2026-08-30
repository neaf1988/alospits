import { useEffect, useState, type FormEvent } from 'react';
import { TIRE_TREAD_CRITICAL_MM } from '../../types';
import { db } from '../../services/db';
import { updateVehicleTireTread, VehicleServiceError } from '../../services/vehicleService';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { useVehicleContextStore } from '../../stores/vehicleContextStore';
import {
  getTireTreadStatus,
  getTireTreadStatusLabel,
  TIRE_TREAD_STATUS_STYLES,
} from '../../utils/tireTreadDisplay';

interface TireTreadSectionProps {
  vehicleId: string;
  userId: string;
}

export function TireTreadSection({ vehicleId, userId }: TireTreadSectionProps) {
  const revision = useDashboardRefreshStore((state) => state.revision);
  const refreshVehicles = useVehicleContextStore((state) => state.refreshVehicles);
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);

  const [depthMm, setDepthMm] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void db.vehicles.get(vehicleId).then((vehicle) => {
      if (!cancelled && vehicle) {
        setDepthMm(vehicle.tireTreadDepthMm);
        setInputValue(String(vehicle.tireTreadDepthMm));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [vehicleId, revision]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = Number(inputValue);
    if (Number.isNaN(parsed) || parsed < 0.1 || parsed > 12) {
      setError('Ingresa un valor entre 0.1 y 12 mm.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateVehicleTireTread(vehicleId, userId, parsed);
      await refreshVehicles(userId);
      bumpDashboard();
      setDepthMm(parsed);
      setIsEditing(false);
    } catch (submitError) {
      if (submitError instanceof VehicleServiceError) {
        setError(submitError.message);
      } else {
        setError('No se pudo guardar la medición.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (depthMm === null) {
    return (
      <section className="mb-6 rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <div className="h-16 animate-pulse rounded-lg bg-slate-800/80" />
      </section>
    );
  }

  const status = getTireTreadStatus(depthMm);

  return (
    <section className="mb-6 rounded-xl border border-slate-700/60 bg-pit-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Llantas</h2>
          <p className="mt-1 text-2xl font-bold text-slate-100">{depthMm.toFixed(1)} mm</p>
          <p className="mt-1 text-xs text-slate-500">
            Mínimo legal {TIRE_TREAD_CRITICAL_MM} mm · Res. 1080/2019
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TIRE_TREAD_STATUS_STYLES[status]}`}
        >
          {getTireTreadStatusLabel(status)}
        </span>
      </div>

      {isEditing ? (
        <form className="mt-4 space-y-3" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor="tire-tread-input" className="mb-1 block text-xs font-medium text-slate-400">
              Profundidad de labrado (mm)
            </label>
            <input
              id="tire-tread-input"
              type="number"
              min={0.1}
              max={12}
              step={0.1}
              disabled={isSubmitting}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-pit-accent focus:outline-none focus:ring-1 focus:ring-pit-accent"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsEditing(false);
                setInputValue(String(depthMm));
                setError(null);
              }}
              className="min-h-12 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="mt-4 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800"
        >
          Actualizar medición
        </button>
      )}
    </section>
  );
}
