import { useEffect, useState, type FormEvent } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import {
  deleteTaxRecord,
  getAvailableTaxYears,
  getTaxRecordById,
  saveTaxRecord,
  TaxRecordServiceError,
} from '../../services/taxRecordService';
import { db } from '../../services/db';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { toDateInputValue } from '../../utils/taxDisplay';
import type { TaxRecord } from '../../types';
import { TaxForm } from './TaxForm';
import { createEmptyTaxForm, validateTaxForm, type TaxFormValues } from './taxFormUtils';

interface TaxRecordRegistrationProps {
  vehicleId: string;
  recordId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

function recordToFormValues(record: TaxRecord): TaxFormValues {
  return {
    taxYear: String(record.taxYear),
    dueDate: toDateInputValue(record.dueDate),
    hasDiscountDueDate: record.discountDueDate !== undefined,
    discountDueDate: record.discountDueDate
      ? toDateInputValue(record.discountDueDate)
      : '',
    costCop: String(record.costCop),
    status: record.status,
    paymentDate: record.paymentDate ? toDateInputValue(record.paymentDate) : toDateInputValue(),
  };
}

export function TaxRecordRegistration({
  vehicleId,
  recordId,
  onComplete,
  onCancel,
}: TaxRecordRegistrationProps) {
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const isEditing = Boolean(recordId);

  const [values, setValues] = useState<TaxFormValues | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [vehicleRecord, years, existingRecord] = await Promise.all([
          db.vehicles.get(vehicleId),
          getAvailableTaxYears(vehicleId),
          recordId ? getTaxRecordById(recordId) : Promise.resolve(undefined),
        ]);

        if (cancelled) {
          return;
        }

        if (!vehicleRecord) {
          setLoadError('Vehículo no encontrado.');
          return;
        }

        if (recordId && !existingRecord) {
          setLoadError('Impuesto no encontrado.');
          return;
        }

        if (existingRecord) {
          setValues(recordToFormValues(existingRecord));
          setAvailableYears([existingRecord.taxYear]);
        } else if (years.length > 0) {
          setAvailableYears(years);
          setValues(createEmptyTaxForm(years[0]));
        } else {
          setLoadError('No hay años disponibles para registrar.');
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
  }, [vehicleId, recordId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values) {
      return;
    }

    setSubmitError(null);
    const fieldErrors = validateTaxForm(values);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await saveTaxRecord(
        {
          vehicleId,
          taxYear: Number(values.taxYear),
          dueDate: values.dueDate,
          costCop: Number(values.costCop),
          status: values.status,
          ...(values.hasDiscountDueDate && values.discountDueDate
            ? { discountDueDate: values.discountDueDate }
            : {}),
          ...(values.status === 'PAID' ? { paymentDate: values.paymentDate } : {}),
        },
        recordId,
      );

      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof TaxRecordServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo guardar el impuesto.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!recordId || !window.confirm('¿Eliminar este registro de impuesto?')) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deleteTaxRecord(recordId, vehicleId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof TaxRecordServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo eliminar el impuesto.');
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
                form="tax-record-form"
                disabled={isSubmitting}
                className="min-h-12 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando…' : isEditing ? 'Actualizar' : 'Guardar impuesto'}
              </button>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isSubmitting}
                className="min-h-12 w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Eliminar registro
              </button>
            )}
          </div>
        </BottomActions>
      }
    >
      <VehicleContextBanner vehicleId={vehicleId} />
      <form id="tax-record-form" onSubmit={(e) => void handleSubmit(e)}>
        <TaxForm
          values={values}
          errors={errors}
          disabled={isSubmitting}
          isEditing={isEditing}
          availableYears={availableYears}
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
