import { useEffect, useState } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import { getMaintenanceLogsByVehicle } from '../../services/maintenanceLogService';
import { db } from '../../services/db';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import {
  formatServiceDate,
  getNextServiceSummary,
  hasUpcomingTarget,
} from '../../utils/maintenanceDisplay';
import { getUpcomingMaintenances } from '../../utils/maintenanceProjection';
import type { FuelLog, MaintenanceLog } from '../../types';

interface MaintenanceLogsPageProps {
  vehicleId: string;
  onAddMaintenance: () => void;
  onEditMaintenance: (logId: string) => void;
}

export function MaintenanceLogsPage({
  vehicleId,
  onAddMaintenance,
  onEditMaintenance,
}: MaintenanceLogsPageProps) {
  const revision = useDashboardRefreshStore((state) => state.revision);

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [currentOdometerKm, setCurrentOdometerKm] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [vehicleRecord, maintenanceLogs, vehicleFuelLogs] = await Promise.all([
          db.vehicles.get(vehicleId),
          getMaintenanceLogsByVehicle(vehicleId),
          db.fuelLogs.where('vehicleId').equals(vehicleId).toArray(),
        ]);

        if (cancelled) {
          return;
        }

        if (!vehicleRecord) {
          setLoadError('Vehículo no encontrado.');
          return;
        }

        setCurrentOdometerKm(vehicleRecord.currentOdometerKm);
        setLogs(maintenanceLogs);
        setFuelLogs(vehicleFuelLogs);
        setIsLoaded(true);
      } catch {
        if (!cancelled) {
          setLoadError('No se pudieron cargar los mantenimientos.');
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

  const upcoming = getUpcomingMaintenances(currentOdometerKm, logs, fuelLogs);

  return (
    <AppPageBody
      footer={
        <BottomActions>
          <button
            type="button"
            onClick={onAddMaintenance}
            className="min-h-12 w-full rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted"
          >
            + Registrar mantenimiento
          </button>
        </BottomActions>
      }
    >
      <VehicleContextBanner vehicleId={vehicleId} />

      {upcoming.length > 0 && (
        <section className="mb-4 rounded-xl border border-pit-accent/30 bg-pit-accent/5 p-4">
          <h2 className="text-sm font-semibold text-pit-accent-muted">Próximos servicios</h2>
          <ul className="mt-2 space-y-2">
            {upcoming.slice(0, 3).map((item) => (
              <li key={item.log.id} className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">{item.log.title}</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {getNextServiceSummary(item)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-4 text-center">
          <p className="text-sm font-medium text-slate-200">Sin mantenimientos registrados</p>
          <p className="mt-1 text-xs text-slate-400">
            Registra servicios, repuestos y próximos objetivos por km o fecha.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li key={log.id}>
              <button
                type="button"
                onClick={() => onEditMaintenance(log.id)}
                className="w-full rounded-xl border border-slate-700/60 bg-pit-surface p-4 text-left transition-colors hover:border-pit-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">{log.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatServiceDate(log.serviceDate)} ·{' '}
                      {log.odometerKm.toLocaleString('es-CO')} km
                    </p>
                    {log.workshopName && (
                      <p className="mt-0.5 text-xs text-slate-500">{log.workshopName}</p>
                    )}
                    {hasUpcomingTarget(log) && (
                      <p className="mt-2 text-xs text-pit-accent-muted">
                        Próximo:{' '}
                        {log.nextServiceKmTarget !== undefined &&
                          `${log.nextServiceKmTarget.toLocaleString('es-CO')} km`}
                        {log.nextServiceKmTarget !== undefined &&
                          log.nextServiceDateTarget &&
                          ' · '}
                        {log.nextServiceDateTarget &&
                          formatServiceDate(log.nextServiceDateTarget)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-pit-accent-muted">
                    ${log.costCop.toLocaleString('es-CO')}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppPageBody>
  );
}
