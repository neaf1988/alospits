import type { DashboardAlert } from '../../utils/dashboardAlerts';

export const ALERT_SEVERITY_STYLES: Record<DashboardAlert['severity'], string> = {
  critical: 'border-red-500/50 bg-red-500/10 text-red-200',
  warning: 'border-amber-500/50 bg-amber-500/10 text-amber-100',
  info: 'border-sky-500/50 bg-sky-500/10 text-sky-100',
};

const SEVERITY_LABELS: Record<DashboardAlert['severity'], string> = {
  critical: 'Urgente',
  warning: 'Atención',
  info: 'Información',
};

interface AlertListProps {
  alerts: DashboardAlert[];
  grouped?: boolean;
  emptyMessage?: string;
}

export function AlertList({ alerts, grouped = false, emptyMessage }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <p className="text-sm font-medium text-emerald-200">Sin alertas activas</p>
        {emptyMessage && <p className="mt-1 text-xs text-emerald-300/80">{emptyMessage}</p>}
      </div>
    );
  }

  if (!grouped) {
    return (
      <ul className="space-y-2" aria-label="Alertas">
        {alerts.map((alert) => (
          <AlertListItem key={alert.id} alert={alert} />
        ))}
      </ul>
    );
  }

  const groups: DashboardAlert['severity'][] = ['critical', 'warning', 'info'];

  return (
    <div className="space-y-4" aria-label="Alertas agrupadas">
      {groups.map((severity) => {
        const groupAlerts = alerts.filter((alert) => alert.severity === severity);
        if (groupAlerts.length === 0) {
          return null;
        }

        return (
          <section key={severity}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {SEVERITY_LABELS[severity]} ({groupAlerts.length})
            </h3>
            <ul className="space-y-2">
              {groupAlerts.map((alert) => (
                <AlertListItem key={alert.id} alert={alert} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function AlertListItem({ alert }: { alert: DashboardAlert }) {
  return (
    <li className={`rounded-lg border px-3 py-2.5 ${ALERT_SEVERITY_STYLES[alert.severity]}`}>
      <p className="text-sm font-medium">{alert.title}</p>
      <p className="mt-0.5 text-xs opacity-90">{alert.message}</p>
    </li>
  );
}
