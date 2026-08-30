import type { DashboardAlert } from '../../utils/dashboardAlerts';
import { AlertList } from '../alerts/AlertList';

interface DashboardAlertsProps {
  alerts: DashboardAlert[];
}

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  return (
    <AlertList
      alerts={alerts}
      emptyMessage="Cumplimiento normativo y movilidad dentro de parámetros."
    />
  );
}
