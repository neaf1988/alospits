import { useEffect, useState, type FormEvent } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import { VehicleForm } from '../onboarding/VehicleForm';
import {
  vehicleToFormValues,
  validateVehicleForm,
  type VehicleFormValues,
} from '../onboarding/vehicleFormUtils';
import {
  deleteVehicle,
  getVehicleById,
  updateVehicle,
  VehicleServiceError,
} from '../../services/vehicleService';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { useVehicleContextStore } from '../../stores/vehicleContextStore';
import { getPlateValidationError } from '../../utils/plateValidation';
import { formatPlate } from '../../utils/vehicleDisplay';

interface VehicleEditorProps {
  userId: string;
  vehicleId: string;
  onComplete: () => void;
  onCancel: () => void;
  onDeleted: () => void;
}

export function VehicleEditor({
  userId,
  vehicleId,
  onComplete,
  onCancel,
  onDeleted,
}: VehicleEditorProps) {
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const refreshVehicles = useVehicleContextStore((state) => state.refreshVehicles);

  const [values, setValues] = useState<VehicleFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [plateLabel, setPlateLabel] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const vehicle = await getVehicleById(vehicleId, userId);
        if (cancelled) {
          return;
        }
        setValues(vehicleToFormValues(vehicle));
        setPlateLabel(formatPlate(vehicle.plate));
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el vehículo.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, userId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values) {
      return;
    }

    setSubmitError(null);

    const fieldErrors = validateVehicleForm(values);
    const plateError = getPlateValidationError(values.plate);
    if (plateError) {
      fieldErrors.plate = plateError;
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await updateVehicle(vehicleId, userId, {
        type: values.type,
        brand: values.brand,
        line: values.line,
        modelYear: Number(values.modelYear),
        plate: values.plate,
        cityCode: values.cityCode,
        currentOdometerKm: Number(values.currentOdometerKm),
        tireTreadDepthMm: Number(values.tireTreadDepthMm),
      });
      await refreshVehicles(userId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof VehicleServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo actualizar el vehículo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Eliminar el vehículo ${plateLabel}?\n\nSe borrarán también tanqueos, mantenimientos, cumplimiento e impuestos asociados. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) {
      return;
    }

    setSubmitError(null);
    setIsDeleting(true);

    try {
      await deleteVehicle(vehicleId, userId);
      await refreshVehicles(userId);
      bumpDashboard();
      onDeleted();
    } catch (error) {
      if (error instanceof VehicleServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo eliminar el vehículo.');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (loadError) {
    return <AppPageError message={loadError} />;
  }

  if (!values) {
    return <AppPageLoading />;
  }

  const isBusy = isSubmitting || isDeleting;

  return (
    <AppPageBody
      footer={
        <BottomActions>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                className="min-h-12 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="vehicle-editor-form"
                disabled={isBusy}
                className="min-h-12 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isBusy}
              className="min-h-12 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando…' : 'Eliminar vehículo'}
            </button>
          </div>
        </BottomActions>
      }
    >
      <VehicleContextBanner vehicleId={vehicleId} />
      <p className="mb-4 text-sm text-slate-400">
        Actualiza los datos del vehículo. El odómetro no puede quedar por debajo de lo registrado en
        tanqueos o mantenimientos.
      </p>
      <form id="vehicle-editor-form" onSubmit={(e) => void handleSubmit(e)}>
        <VehicleForm
          values={values}
          errors={errors}
          disabled={isBusy}
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
