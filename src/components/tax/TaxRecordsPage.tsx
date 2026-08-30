import { useEffect, useState } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import {
  getAvailableTaxYears,
  getTaxRecordsByVehicle,
  markTaxRecordAsPaid,
  TaxRecordServiceError,
} from '../../services/taxRecordService';
import { db } from '../../services/db';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import {
  formatTaxDate,
  getTaxDisplayStatus,
  getTaxDisplayStatusLabel,
  getTaxSummary,
  sortTaxRecordsByUrgency,
  TAX_STATUS_STYLES,
  toDateInputValue,
} from '../../utils/taxDisplay';
import type { TaxRecord } from '../../types';

interface TaxRecordsPageProps {
  vehicleId: string;
  onAddTax: () => void;
  onEditTax: (recordId: string) => void;
}

export function TaxRecordsPage({ vehicleId, onAddTax, onEditTax }: TaxRecordsPageProps) {
  const revision = useDashboardRefreshStore((state) => state.revision);
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);

  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [canAdd, setCanAdd] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [vehicleRecord, taxRecords, availableYears] = await Promise.all([
          db.vehicles.get(vehicleId),
          getTaxRecordsByVehicle(vehicleId),
          getAvailableTaxYears(vehicleId),
        ]);

        if (cancelled) {
          return;
        }

        if (!vehicleRecord) {
          setLoadError('Vehículo no encontrado.');
          return;
        }

        setRecords(sortTaxRecordsByUrgency(taxRecords));
        setCanAdd(availableYears.length > 0);
        setIsLoaded(true);
      } catch {
        if (!cancelled) {
          setLoadError('No se pudieron cargar los impuestos.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, revision]);

  async function handleMarkAsPaid(recordId: string) {
    setActionError(null);
    setMarkingPaidId(recordId);

    try {
      await markTaxRecordAsPaid(recordId, vehicleId, toDateInputValue());
      bumpDashboard();
      const updated = await getTaxRecordsByVehicle(vehicleId);
      setRecords(sortTaxRecordsByUrgency(updated));
    } catch (error) {
      if (error instanceof TaxRecordServiceError) {
        setActionError(error.message);
      } else {
        setActionError('No se pudo marcar como pagado.');
      }
    } finally {
      setMarkingPaidId(null);
    }
  }

  if (loadError) {
    return <AppPageError message={loadError} />;
  }

  if (!isLoaded) {
    return <AppPageLoading />;
  }

  const pendingCount = records.filter((record) => record.status === 'PENDING').length;

  return (
    <AppPageBody
      footer={
        canAdd ? (
          <BottomActions>
            <button
              type="button"
              onClick={onAddTax}
              className="min-h-12 w-full rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted"
            >
              + Registrar impuesto
            </button>
          </BottomActions>
        ) : undefined
      }
    >
      <VehicleContextBanner vehicleId={vehicleId} />

      {pendingCount > 0 && (
        <p className="mb-3 text-sm text-slate-400">{pendingCount} impuesto(s) pendiente(s)</p>
      )}

      {actionError && (
        <p className="mb-3 text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-4 text-center">
          <p className="text-sm font-medium text-slate-200">Sin impuestos registrados</p>
          <p className="mt-1 text-xs text-slate-400">
            Registra el impuesto departamental con fechas de vencimiento y pronto pago.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {records.map((record) => {
            const displayStatus = getTaxDisplayStatus(record);
            return (
              <li
                key={record.id}
                className="rounded-xl border border-slate-700/60 bg-pit-surface p-4"
              >
                <button
                  type="button"
                  onClick={() => onEditTax(record.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100">Impuesto {record.taxYear}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Límite: {formatTaxDate(record.dueDate)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{getTaxSummary(record)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${TAX_STATUS_STYLES[displayStatus]}`}
                      >
                        {getTaxDisplayStatusLabel(displayStatus)}
                      </span>
                      <p className="mt-2 text-sm font-medium text-pit-accent-muted">
                        ${record.costCop.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </button>

                {record.status === 'PENDING' && (
                  <button
                    type="button"
                    disabled={markingPaidId === record.id}
                    onClick={() => void handleMarkAsPaid(record.id)}
                    className="mt-3 min-h-12 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {markingPaidId === record.id ? 'Marcando…' : 'Marcar como pagado hoy'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppPageBody>
  );
}
