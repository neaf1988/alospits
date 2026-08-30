import { useEffect, useState } from 'react';
import {
  DEFAULT_ALERT_SETTINGS,
  type AlertSettings,
} from '../../constants/alertSettings';
import {
  getAlertSettings,
  saveAlertSettings,
} from '../../services/alertSettingsService';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../../services/notificationService';
import { PUSH_NOTIFICATIONS_ENABLED } from '../../constants/notifications';
import type { NotificationPreferences } from '../../constants/notifications';

interface AlertSettingsPanelProps {
  onSaved?: () => void;
}

export function AlertSettingsPanel({ onSaved }: AlertSettingsPanelProps) {
  const [settings, setSettings] = useState<AlertSettings>({ ...DEFAULT_ALERT_SETTINGS });
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    enabled: true,
    picoPlacaEnabled: true,
    expiryAlertsEnabled: true,
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(getAlertSettings());
    setNotificationPrefs(getNotificationPreferences());
  }, []);

  function handleSave() {
    saveAlertSettings(settings);
    if (PUSH_NOTIFICATIONS_ENABLED) {
      saveNotificationPreferences(notificationPrefs);
    }
    setStatusMessage('Preferencias de alertas guardadas.');
    onSaved?.();
  }

  return (
    <section className="rounded-xl border border-slate-700/60 bg-pit-surface p-4">
      <h2 className="text-sm font-semibold text-slate-100">Alertas in-app</h2>
      <p className="mt-1 text-xs text-slate-400">
        Umbrales del dashboard. Los hitos 30/15/5/1 días se configuran por ítem al registrarlo.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">
            Días de alerta por defecto (cumplimiento)
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={settings.defaultComplianceAlertDays}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                defaultComplianceAlertDays: Number(event.target.value),
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-400">
            Impuestos pendientes (días antes)
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={settings.taxAlertDaysBefore}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                taxAlertDaysBefore: Number(event.target.value),
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-400">
            Mantenimiento por km (aviso si faltan ≤ km)
          </span>
          <input
            type="number"
            min={50}
            max={5000}
            step={1}
            value={settings.maintenanceKmWarning}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                maintenanceKmWarning: Number(event.target.value),
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-400">
            Mantenimiento por fecha (días antes)
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={settings.maintenanceDaysWarning}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                maintenanceDaysWarning: Number(event.target.value),
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100"
          />
        </label>
      </div>

      {PUSH_NOTIFICATIONS_ENABLED ? (
        <div className="mt-4 space-y-2 border-t border-slate-700/60 pt-4">
          <p className="text-xs font-medium text-slate-400">Notificaciones push</p>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={notificationPrefs.enabled}
              onChange={(event) =>
                setNotificationPrefs((current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
            />
            Activar notificaciones
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={notificationPrefs.picoPlacaEnabled}
              disabled={!notificationPrefs.enabled}
              onChange={(event) =>
                setNotificationPrefs((current) => ({
                  ...current,
                  picoPlacaEnabled: event.target.checked,
                }))
              }
            />
            Pico y placa (6:00 AM)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={notificationPrefs.expiryAlertsEnabled}
              disabled={!notificationPrefs.enabled}
              onChange={(event) =>
                setNotificationPrefs((current) => ({
                  ...current,
                  expiryAlertsEnabled: event.target.checked,
                }))
              }
            />
            Vencimientos (30/15/5/1 días)
          </label>
        </div>
      ) : (
        <p className="mt-4 border-t border-slate-700/60 pt-4 text-xs text-slate-500">
          Las notificaciones push están desactivadas hasta conectar backend.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="mt-4 min-h-10 rounded-lg bg-pit-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted"
      >
        Guardar alertas
      </button>

      {statusMessage && (
        <p className="mt-3 text-sm text-emerald-400" role="status">
          {statusMessage}
        </p>
      )}
    </section>
  );
}
