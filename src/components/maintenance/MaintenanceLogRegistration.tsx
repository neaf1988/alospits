import { useEffect, useState, type FormEvent } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import {
  deleteMaintenanceLog,
  getMaintenanceLogById,
  MaintenanceLogServiceError,
  saveMaintenanceLog,
} from '../../services/maintenanceLogService';
import { db } from '../../services/db';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { useVehicleContextStore } from '../../stores/vehicleContextStore';
import { toDateInputValue as toDisplayDate } from '../../utils/maintenanceDisplay';
import type { MaintenanceLog, Vehicle } from '../../types';
import { MaintenanceForm } from './MaintenanceForm';
import {
  createEmptyMaintenanceForm,
  validateMaintenanceForm,
  type MaintenanceFormValues,
} from './maintenanceFormUtils';

interface MaintenanceLogRegistrationProps {
  userId: string;
  vehicleId: string;
  logId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

function logToFormValues(log: MaintenanceLog): MaintenanceFormValues {
  return {
    serviceDate: toDisplayDate(log.serviceDate),
    odometerKm: String(log.odometerKm),
    title: log.title,
    details: log.details,
    costCop: String(log.costCop),
    workshopName: log.workshopName ?? '',
    invoiceNumber: log.invoiceNumber ?? '',
    nextServiceKmTarget:
      log.nextServiceKmTarget !== undefined ? String(log.nextServiceKmTarget) : '',
    nextServiceDateTarget: log.nextServiceDateTarget
      ? toDisplayDate(log.nextServiceDateTarget)
      : '',
    hasKmTarget: log.nextServiceKmTarget !== undefined,
    hasDateTarget: log.nextServiceDateTarget !== undefined,
  };
}

export function MaintenanceLogRegistration({
  userId,
  vehicleId,
  logId,
  onComplete,
  onCancel,
}: MaintenanceLogRegistrationProps) {
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const refreshVehicles = useVehicleContextStore((state) => state.refreshVehicles);
  const isEditing = Boolean(logId);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [values, setValues] = useState<MaintenanceFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [vehicleRecord, existingLog] = await Promise.all([
          db.vehicles.get(vehicleId),
          logId ? getMaintenanceLogById(logId) : Promise.resolve(undefined),
        ]);

        if (cancelled) {
          return;
        }

        if (!vehicleRecord) {
          setLoadError('Vehículo no encontrado.');
          return;
        }

        if (logId && !existingLog) {
          setLoadError('Mantenimiento no encontrado.');
          return;
        }

        setVehicle(vehicleRecord);
        setValues(
          existingLog
            ? logToFormValues(existingLog)
            : createEmptyMaintenanceForm(vehicleRecord.currentOdometerKm),
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
    const fieldErrors = validateMaintenanceForm(values);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const odometer = Number(values.odometerKm);
      await saveMaintenanceLog(
        {
          vehicleId,
          serviceDate: values.serviceDate,
          odometerKm: odometer,
          title: values.title,
          details: values.details,
          costCop: Number(values.costCop),
          workshopName: values.workshopName.trim() || undefined,
          invoiceNumber: values.invoiceNumber.trim() || undefined,
          ...(values.hasKmTarget && values.nextServiceKmTarget.trim()
            ? { nextServiceKmTarget: Number(values.nextServiceKmTarget) }
            : {}),
          ...(values.hasDateTarget && values.nextServiceDateTarget
            ? { nextServiceDateTarget: values.nextServiceDateTarget }
            : {}),
        },
        logId,
      );

      await refreshVehicles(userId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof MaintenanceLogServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo guardar el mantenimiento.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!logId || !window.confirm('¿Eliminar este mantenimiento?')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deleteMaintenanceLog(logId, vehicleId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof MaintenanceLogServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo eliminar el mantenimiento.');
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
                form="maintenance-form"
                disabled={isSubmitting}
                className="min-h-12 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando…' : isEditing ? 'Actualizar' : 'Guardar mantenimiento'}
              </button>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Eliminar mantenimiento
              </button>
            )}
          </div>
        </BottomActions>
      }
    >
      <VehicleContextBanner vehicleId={vehicleId} />
      <form id="maintenance-form" onSubmit={(e) => void handleSubmit(e)}>
        <MaintenanceForm
          values={values}
          errors={errors}
          currentOdometerKm={vehicle.currentOdometerKm}
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
