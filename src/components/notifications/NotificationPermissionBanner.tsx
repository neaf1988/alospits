import { useState } from 'react';
import { STORAGE_KEYS } from '../../constants/storage';
import {
  getNotificationPermission,
  getNotificationPreferences,
  requestNotificationPermission,
  saveNotificationPreferences,
} from '../../services/notificationService';

export function NotificationPermissionBanner() {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [prefs, setPrefs] = useState(getNotificationPreferences());
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.notificationBannerDismissed) === '1',
  );
  const [isRequesting, setIsRequesting] = useState(false);

  if (isDismissed || permission === 'unsupported') {
    return null;
  }

  if (permission === 'granted' && prefs.enabled) {
    return null;
  }

  async function handleEnable() {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === 'granted') {
        const updated = { ...prefs, enabled: true };
        saveNotificationPreferences(updated);
        setPrefs(updated);
        setIsDismissed(true);
        localStorage.setItem(STORAGE_KEYS.notificationBannerDismissed, '1');
      }
    } finally {
      setIsRequesting(false);
    }
  }

  function handleDismiss() {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.notificationBannerDismissed, '1');
  }

  const isDenied = permission === 'denied';

  return (
    <section
      className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4"
      aria-label="Activar notificaciones"
    >
      <p className="text-sm font-semibold text-sky-200">Alertas y pico y placa</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        {isDenied
          ? 'Las notificaciones están bloqueadas en el navegador. Habilítalas en ajustes del sitio para recibir avisos de vencimiento (30, 15, 5 y 1 día) y pico y placa desde las 6:00 AM.'
          : 'Activa notificaciones para recibir avisos de vencimiento (30, 15, 5 y 1 día) y pico y placa desde las 6:00 AM.'}
      </p>
      <div className="mt-3 flex gap-2">
        {!isDenied && (
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={isRequesting}
            className="min-h-10 flex-1 rounded-lg bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-200 ring-1 ring-sky-500/40 hover:bg-sky-500/30 disabled:opacity-50"
          >
            {isRequesting ? 'Solicitando…' : 'Activar notificaciones'}
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-10 rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800"
        >
          Ahora no
        </button>
      </div>
    </section>
  );
}
