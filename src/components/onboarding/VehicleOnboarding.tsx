import { useState, type FormEvent } from 'react';
import { AppPageBody } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { createVehicle, VehicleServiceError } from '../../services/vehicleService';
import { getPlateValidationError } from '../../utils/plateValidation';
import { VehicleForm, EMPTY_VEHICLE_FORM, validateVehicleForm } from './VehicleForm';
import type { VehicleFormValues } from './vehicleFormUtils';

interface VehicleOnboardingProps {
  userId: string;
  mode: 'first' | 'second';
  onComplete: () => void;
  onCancel?: () => void;
}

export function VehicleOnboarding({
  userId,
  mode,
  onComplete,
  onCancel,
}: VehicleOnboardingProps) {
  const [values, setValues] = useState<VehicleFormValues>(EMPTY_VEHICLE_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFirst = mode === 'first';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
      await createVehicle({
        userId,
        type: values.type,
        brand: values.brand,
        line: values.line,
        modelYear: Number(values.modelYear),
        plate: values.plate,
        cityCode: values.cityCode,
        currentOdometerKm: Number(values.currentOdometerKm),
        tireTreadDepthMm: Number(values.tireTreadDepthMm),
      });
      onComplete();
    } catch (error) {
      if (error instanceof VehicleServiceError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('No se pudo registrar el vehículo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppPageBody
      footer={
        <BottomActions>
          <div className={onCancel ? 'grid grid-cols-2 gap-2' : undefined}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="min-h-12 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              form="vehicle-onboarding-form"
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando…' : isFirst ? 'Comenzar' : 'Registrar vehículo'}
            </button>
          </div>
        </BottomActions>
      }
    >
      {!isFirst && (
        <p className="mb-4 text-sm text-slate-400">
          Puedes gestionar hasta 2 vehículos y conmutar entre ellos al instante.
        </p>
      )}
      {isFirst && (
        <p className="mb-4 text-sm text-slate-400">
          Para empezar necesitamos los datos básicos de tu carro o moto. Todo se guarda offline en
          tu dispositivo.
        </p>
      )}
      <form id="vehicle-onboarding-form" onSubmit={(e) => void handleSubmit(e)}>
        <VehicleForm
          values={values}
          errors={errors}
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
