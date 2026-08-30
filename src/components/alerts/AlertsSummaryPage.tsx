import { AppPageBody, AppPageLoading } from '../layout/AppShell';
import { useVehicleAlerts } from '../../hooks/useVehicleAlerts';
import { formatPlate } from '../../utils/vehicleDisplay';
import { AlertList } from './AlertList';

export function AlertsSummaryPage() {
  const { alerts, alertCount, vehicle, isLoading } = useVehicleAlerts();

  if (isLoading) {
    return <AppPageLoading />;
  }

  return (
    <AppPageBody>
      {vehicle && (
        <section className="mb-4 rounded-xl border border-slate-700/60 bg-pit-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Vehículo en contexto</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{formatPlate(vehicle.plate)}</p>
          <p className="text-sm text-slate-400">
            {alertCount === 0
              ? 'Todo al día — no hay pendientes.'
              : `${alertCount} alerta${alertCount === 1 ? '' : 's'} pendiente${alertCount === 1 ? '' : 's'}.`}
          </p>
        </section>
      )}

      <AlertList
        alerts={alerts}
        grouped
        emptyMessage="Cumplimiento normativo, licencia, impuestos y movilidad dentro de parámetros."
      />
    </AppPageBody>
  );
}
