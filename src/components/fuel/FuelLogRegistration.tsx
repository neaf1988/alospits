import { useEffect, useState, type FormEvent } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import {
  deleteFuelLog,
  FuelLogServiceError,
  getFuelLogById,
  saveFuelLog,
} from '../../services/fuelLogService';
import { db } from '../../services/db';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { useVehicleContextStore } from '../../stores/vehicleContextStore';
import { getMinOdometerExcludingFuelLog } from '../../utils/vehicleOdometerUtils';
import type { Vehicle } from '../../types';
import { FuelLogForm } from './FuelLogForm';
import {
  createEmptyFuelLogForm,
  fuelLogToFormValues,
  validateFuelLogForm,
  type FuelLogFormValues,
} from './fuelLogFormUtils';

interface FuelLogRegistrationProps {
  userId: string;
  vehicleId: string;
  logId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function FuelLogRegistration({
  userId,
  vehicleId,
  logId,
  onComplete,
  onCancel,
}: FuelLogRegistrationProps) {
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const refreshVehicles = useVehicleContextStore((state) => state.refreshVehicles);
  const isEditing = Boolean(logId);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [minOdometerKm, setMinOdometerKm] = useState(0);
  const [values, setValues] = useState<FuelLogFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [vehicleRecord, existingLog, minOdometer] = await Promise.all([
          db.vehicles.get(vehicleId),
          logId ? getFuelLogById(logId) : Promise.resolve(undefined),
          logId
            ? getMinOdometerExcludingFuelLog(vehicleId, logId)
            : db.vehicles.get(vehicleId).then((record) => record?.currentOdometerKm ?? 0),
        ]);

        if (cancelled) {
          return;
        }

        if (!vehicleRecord) {
          setLoadError('Vehículo no encontrado.');
          return;
        }

        if (logId && !existingLog) {
          setLoadError('Tanqueo no encontrado.');
          return;
        }

        setVehicle(vehicleRecord);
        setMinOdometerKm(minOdometer);
        setValues(
          existingLog
            ? fuelLogToFormValues(existingLog)
            : createEmptyFuelLogForm(vehicleRecord.currentOdometerKm),
        );
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el formulario.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, logId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!vehicle || !values) {
      return;
    }

    setSubmitError(null);
    const fieldErrors = validateFuelLogForm(values);

    const odometer = Number(values.odometerKm);
    if (!fieldErrors.odometerKm && odometer < minOdometerKm) {
      fieldErrors.odometerKm = `No puede ser menor a ${minOdometerKm.toLocaleString('es-CO')} km.`;
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await saveFuelLog(
        {
          vehicleId,
          timestamp: new Date(values.timestamp).toISOString(),
          odometerKm: odometer,
          gallons: Number(values.gallons),
          totalCostCop: Number(values.totalCostCop),
          isFullTank: values.isFullTank,
          stationName: values.stationName || undefined,
        },
        logId,
      );

      await refreshVehicles(userId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof FuelLogServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo guardar el tanqueo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!logId || !window.confirm('¿Eliminar este tanqueo?')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deleteFuelLog(logId, vehicleId);
      await refreshVehicles(userId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof FuelLogServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo eliminar el tanqueo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return <AppPageError message={loadError} onRetry={onCancel} />;
  }

  if (!vehicle || !values) {
    return <AppPageLoading />;
  }

  return (
    <AppPageBody
      footer={
        <BottomActions>
          <div className="space-y-2">
            <div className={isEditing ? 'grid grid-cols-2 gap-2' : undefined}>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="min-h-12 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="fuel-log-form"
                disabled={isSubmitting}
                className="min-h-12 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando…' : isEditing ? 'Actualizar' : 'Guardar tanqueo'}
              </button>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Eliminar tanqueo
              </button>
            )}
          </div>
        </BottomActions>
      }
    >
      <VehicleContextBanner vehicleId={vehicleId} />
      <form id="fuel-log-form" onSubmit={(e) => void handleSubmit(e)}>
        <FuelLogForm
          values={values}
          errors={errors}
          minOdometerKm={minOdometerKm}
          disabled={isSubmitting}
          onChange={setValues}
        />
        {submitError && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {submitError}
          </p>
        )}
      </form>
    </AppPageBody>
  );
}
