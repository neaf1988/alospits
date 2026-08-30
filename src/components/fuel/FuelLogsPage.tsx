import { useEffect, useState } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import { getFuelLogsByVehicle } from '../../services/fuelLogService';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { calculatePricePerGallon } from './fuelLogFormUtils';
import type { FuelLog } from '../../types';

interface FuelLogsPageProps {
  vehicleId: string;
  onAddFuelLog: () => void;
  onEditFuelLog: (logId: string) => void;
}

function formatFuelTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FuelLogsPage({
  vehicleId,
  onAddFuelLog,
  onEditFuelLog,
}: FuelLogsPageProps) {
  const revision = useDashboardRefreshStore((state) => state.revision);

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const fuelLogs = await getFuelLogsByVehicle(vehicleId);

        if (cancelled) {
          return;
        }

        setLogs(fuelLogs);
        setIsLoaded(true);
      } catch {
        if (!cancelled) {
          setLoadError('No se pudieron cargar los tanqueos.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, revision]);

  if (loadError) {
    return <AppPageError message={loadError} />;
  }

  if (!isLoaded) {
    return <AppPageLoading />;
  }

  return (
    <AppPageBody
      footer={
        <BottomActions>
          <button
            type="button"
            onClick={onAddFuelLog}
            className="min-h-12 w-full rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted"
          >
            + Registrar tanqueo
          </button>
        </BottomActions>
      }
    >
      <VehicleContextBanner vehicleId={vehicleId} />

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-4 text-center">
          <p className="text-sm font-medium text-slate-200">Sin tanqueos registrados</p>
          <p className="mt-1 text-xs text-slate-400">
            Registra cargas de combustible para ver historial, rendimiento y costos.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => {
            const pricePerGallon = calculatePricePerGallon(
              String(log.gallons),
              String(log.totalCostCop),
            );

            return (
              <li key={log.id}>
                <button
                  type="button"
                  onClick={() => onEditFuelLog(log.id)}
                  className="w-full rounded-xl border border-slate-700/60 bg-pit-surface p-4 text-left transition-colors hover:border-pit-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100">
                        {log.gallons.toFixed(2)} gal
                        {log.isFullTank && (
                          <span className="ml-2 text-xs font-normal text-emerald-400">
                            Tanque lleno
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatFuelTimestamp(log.timestamp)} ·{' '}
                        {log.odometerKm.toLocaleString('es-CO')} km
                      </p>
                      {log.stationName && (
                        <p className="mt-0.5 text-xs text-slate-500">{log.stationName}</p>
                      )}
                      {pricePerGallon !== null && (
                        <p className="mt-2 text-xs text-pit-accent-muted">
                          ${Math.round(pricePerGallon).toLocaleString('es-CO')}/gal
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-medium text-pit-accent-muted">
                      ${log.totalCostCop.toLocaleString('es-CO')}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppPageBody>
  );
}
