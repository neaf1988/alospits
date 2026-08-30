import { useEffect, useState, type FormEvent } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import {
  deletePicoPlacaSchedule,
  getPicoPlacaScheduleById,
  PicoPlacaServiceError,
  savePicoPlacaSchedule,
} from '../../services/picoPlacaService';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { PicoPlacaScheduleForm } from './PicoPlacaScheduleForm';
import {
  createEmptyPicoPlacaForm,
  formValuesToDayRules,
  scheduleToFormValues,
  validatePicoPlacaForm,
  type PicoPlacaFormValues,
} from './picoPlacaFormUtils';

interface PicoPlacaScheduleEditorProps {
  scheduleId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function PicoPlacaScheduleEditor({
  scheduleId,
  onComplete,
  onCancel,
}: PicoPlacaScheduleEditorProps) {
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const isEditing = Boolean(scheduleId);

  const [values, setValues] = useState<PicoPlacaFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (scheduleId) {
          const schedule = await getPicoPlacaScheduleById(scheduleId);
          if (!schedule) {
            setLoadError('Configuración no encontrada.');
            return;
          }
          if (!cancelled) {
            setValues(
              scheduleToFormValues(
                schedule.cityCode,
                schedule.vehicleType,
                schedule.enabled,
                schedule.dayRules,
              ),
            );
          }
          return;
        }

        if (!cancelled) {
          setValues(createEmptyPicoPlacaForm());
        }
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
  }, [scheduleId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values) {
      return;
    }

    setSubmitError(null);
    const fieldErrors = validatePicoPlacaForm(values);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await savePicoPlacaSchedule(
        {
          cityCode: values.cityCode,
          vehicleType: values.vehicleType,
          enabled: values.enabled,
          dayRules: formValuesToDayRules(values),
        },
        scheduleId,
      );
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof PicoPlacaServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo guardar la configuración.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!scheduleId || !window.confirm('¿Eliminar esta configuración de pico y placa?')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deletePicoPlacaSchedule(scheduleId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof PicoPlacaServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo eliminar la configuración.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return <AppPageError message={loadError} onRetry={onCancel} />;
  }

  if (!values) {
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
                form="pico-placa-form"
                disabled={isSubmitting}
                className="min-h-12 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando…' : isEditing ? 'Actualizar' : 'Guardar configuración'}
              </button>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Eliminar configuración
              </button>
            )}
          </div>
        </BottomActions>
      }
    >
      <form id="pico-placa-form" onSubmit={(e) => void handleSubmit(e)}>
        <PicoPlacaScheduleForm
          values={values}
          errors={errors}
          disabled={isSubmitting}
          isEditing={isEditing}
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
