import { useEffect, useState, type FormEvent } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import {
  COMPLIANCE_SAFETY_TYPES,
} from '../../constants/complianceItems';
import {
  ComplianceItemServiceError,
  deleteComplianceItem,
  getAvailableComplianceItemTypesByCategory,
  getComplianceItemById,
  saveComplianceItem,
  type ComplianceItemCategory,
} from '../../services/complianceItemService';
import { db } from '../../services/db';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { toDateInputValue } from '../../utils/complianceDisplay';
import type { ComplianceItem, ComplianceItemType, Vehicle } from '../../types';
import {
  getTecnomecanicaSuggestionMessage,
} from '../../utils/complianceNormativaUtils';
import { ComplianceItemForm } from './ComplianceItemForm';
import {
  createEmptyComplianceItemForm,
  validateComplianceItemForm,
  type ComplianceItemFormValues,
} from './complianceItemFormUtils';

interface ComplianceItemRegistrationProps {
  vehicleId: string;
  itemId?: string;
  category?: ComplianceItemCategory;
  onComplete: () => void;
  onCancel: () => void;
}

function itemToFormValues(item: ComplianceItem): ComplianceItemFormValues {
  return {
    type: item.type,
    expiryDate: toDateInputValue(item.expiryDate),
    costCop: item.costCop !== undefined ? String(item.costCop) : '',
    notes: item.notes ?? '',
    alertDaysBefore: String(item.alertDaysBefore),
  };
}

export function ComplianceItemRegistration({
  vehicleId,
  itemId,
  category = 'document',
  onComplete,
  onCancel,
}: ComplianceItemRegistrationProps) {
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const isEditing = Boolean(itemId);
  const isSafety = category === 'safety';

  const [values, setValues] = useState<ComplianceItemFormValues | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [availableTypes, setAvailableTypes] = useState<ComplianceItemType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [vehicleRecord, types, existingItem] = await Promise.all([
          db.vehicles.get(vehicleId),
          itemId
            ? Promise.resolve([] as ComplianceItemType[])
            : getAvailableComplianceItemTypesByCategory(vehicleId, category),
          itemId ? getComplianceItemById(itemId) : Promise.resolve(undefined),
        ]);

        if (cancelled) {
          return;
        }

        if (!vehicleRecord) {
          setLoadError('Vehículo no encontrado.');
          return;
        }

        setVehicle(vehicleRecord);

        if (itemId && !existingItem) {
          setLoadError('Registro no encontrado.');
          return;
        }

        if (existingItem) {
          setAvailableTypes([existingItem.type]);
          setValues(itemToFormValues(existingItem));
        } else if (types.length > 0) {
          setAvailableTypes(types);
          setValues(createEmptyComplianceItemForm(types[0], vehicleRecord));
        } else {
          setLoadError('No hay más elementos por registrar en esta categoría.');
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
  }, [vehicleId, itemId, category]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values) {
      return;
    }

    setSubmitError(null);
    const fieldErrors = validateComplianceItemForm(values);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const costTrimmed = values.costCop.trim();
      await saveComplianceItem(
        {
          vehicleId,
          type: values.type,
          expiryDate: values.expiryDate,
          alertDaysBefore: Number(values.alertDaysBefore),
          ...(costTrimmed ? { costCop: Number(values.costCop) } : {}),
          ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
        },
        itemId,
      );

      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof ComplianceItemServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo guardar el registro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    const label = isSafety ? 'elemento' : 'documento';
    if (!itemId || !window.confirm(`¿Eliminar este ${label}?`)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deleteComplianceItem(itemId, vehicleId);
      bumpDashboard();
      onComplete();
    } catch (error) {
      if (error instanceof ComplianceItemServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo eliminar el registro.');
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

  const saveLabel = isEditing
    ? 'Actualizar'
    : isSafety || COMPLIANCE_SAFETY_TYPES.includes(values.type)
      ? 'Guardar elemento'
      : 'Guardar documento';

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
                form="compliance-item-form"
                disabled={isSubmitting}
                className="min-h-12 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando…' : saveLabel}
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
      {!isEditing && values.type === 'TECNOMECANICA' && vehicle && (
        <p className="mb-4 rounded-lg border border-pit-accent/30 bg-pit-accent/5 px-3 py-2 text-xs text-slate-300">
          {getTecnomecanicaSuggestionMessage(vehicle)}
        </p>
      )}
      <form id="compliance-item-form" onSubmit={(e) => void handleSubmit(e)}>
        <ComplianceItemForm
          values={values}
          errors={errors}
          disabled={isSubmitting}
          isEditing={isEditing}
          availableTypes={availableTypes}
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
