import { useEffect, useState } from 'react';
import { LICENSE_ALERT_DAY_PRESETS } from '../../constants/driverLicenses';
import {
  DriverLicenseServiceError,
  getDriverLicenses,
  saveDriverLicenses,
} from '../../services/driverLicenseService';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import type { DriverLicenseClass, DriverLicenseEntry, DriverLicenses } from '../../types';
import {
  getDriverLicenseDescription,
  getDriverLicenseExpiryText,
  getDriverLicenseLabel,
  getDriverLicenseStatus,
  getDriverLicenseStatusLabel,
  DRIVER_LICENSE_STATUS_STYLES,
} from '../../utils/driverLicenseDisplay';

interface DriverLicenseEditorProps {
  userId: string;
  licenseClass: DriverLicenseClass;
  initialEntry: DriverLicenseEntry;
  onComplete: () => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-pit-accent focus:outline-none focus:ring-1 focus:ring-pit-accent';

export function DriverLicenseEditor({
  userId,
  licenseClass,
  initialEntry,
  onComplete,
  onCancel,
}: DriverLicenseEditorProps) {
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const [active, setActive] = useState(initialEntry.active);
  const [expiryDate, setExpiryDate] = useState(initialEntry.expiryDate ?? '');
  const [alertDaysBefore, setAlertDaysBefore] = useState(String(initialEntry.alertDaysBefore));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const current = await getDriverLicenses(userId);
      const updated: DriverLicenses = {
        ...current,
        [licenseClass]: {
          active,
          expiryDate: active ? expiryDate || null : null,
          alertDaysBefore: Number(alertDaysBefore),
        },
      };

      await saveDriverLicenses(userId, updated);
      bumpDashboard();
      onComplete();
    } catch (err) {
      setError(
        err instanceof DriverLicenseServiceError
          ? err.message
          : 'No se pudo guardar la licencia.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
        <p className="text-lg font-semibold text-slate-100">
          Licencia {getDriverLicenseLabel(licenseClass)}
        </p>
        <p className="mt-1 text-sm text-slate-400">{getDriverLicenseDescription(licenseClass)}</p>
      </div>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3">
        <input
          type="checkbox"
          checked={active}
          disabled={isSaving}
          onChange={(e) => setActive(e.target.checked)}
          className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-pit-accent focus:ring-pit-accent"
        />
        <span className="text-sm font-medium text-slate-200">Tengo esta categoría activa</span>
      </label>

      {active && (
        <>
          <div>
            <label htmlFor="license-expiry" className="mb-1 block text-xs font-medium text-slate-400">
              Fecha de vencimiento
            </label>
            <input
              id="license-expiry"
              type="date"
              required
              className={inputClass}
              value={expiryDate}
              disabled={isSaving}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="license-alert" className="mb-1 block text-xs font-medium text-slate-400">
              Alertar días antes
            </label>
            <select
              id="license-alert"
              className={inputClass}
              value={alertDaysBefore}
              disabled={isSaving}
              onChange={(e) => setAlertDaysBefore(e.target.value)}
            >
              {LICENSE_ALERT_DAY_PRESETS.map((days) => (
                <option key={days} value={String(days)}>
                  {days} días antes
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="min-h-12 flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-12 flex-1 rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent/90 disabled:opacity-50"
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

interface DriverLicensesPageProps {
  userId: string;
  onEditLicense: (licenseClass: DriverLicenseClass) => void;
}

function LicenseGroup({
  title,
  licenseClasses,
  licenses,
  onEditLicense,
}: {
  title: string;
  licenseClasses: DriverLicenseClass[];
  licenses: DriverLicenses;
  onEditLicense: (licenseClass: DriverLicenseClass) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <ul className="space-y-2">
        {licenseClasses.map((licenseClass) => {
          const entry = licenses[licenseClass];
          const status = getDriverLicenseStatus(entry);
          const displayStatus = status ?? 'inactive';

          return (
            <li key={licenseClass}>
              <button
                type="button"
                onClick={() => onEditLicense(licenseClass)}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-left transition-colors hover:border-pit-accent/40 hover:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">
                      {getDriverLicenseLabel(licenseClass)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getDriverLicenseDescription(licenseClass)}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {getDriverLicenseExpiryText(entry)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${DRIVER_LICENSE_STATUS_STYLES[displayStatus]}`}
                  >
                    {getDriverLicenseStatusLabel(status)}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DriverLicensesPage({ userId, onEditLicense }: DriverLicensesPageProps) {
  const revision = useDashboardRefreshStore((state) => state.revision);
  const [licenses, setLicenses] = useState<DriverLicenses | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getDriverLicenses(userId);
        if (!cancelled) {
          setLicenses(data);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setLoadError('No se pudieron cargar las licencias de conducción.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, revision]);

  if (loadError) {
    return <p className="text-sm text-red-400">{loadError}</p>;
  }

  if (!licenses) {
    return (
      <div className="space-y-3" aria-label="Cargando licencias">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        En Colombia cada subcategoría (A1, A2, B1, B2, B3) tiene su propia fecha de vencimiento.
        Registra solo las categorías que tienes activas.
      </p>

      <LicenseGroup
        title="Motos"
        licenseClasses={['A1', 'A2']}
        licenses={licenses}
        onEditLicense={onEditLicense}
      />

      <LicenseGroup
        title="Carros"
        licenseClasses={['B1', 'B2', 'B3']}
        licenses={licenses}
        onEditLicense={onEditLicense}
      />
    </div>
  );
}
