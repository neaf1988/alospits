import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { AlertSettingsPanel } from './AlertSettingsPanel';
import { STORAGE_KEYS } from '../../constants/storage';
import {
  AccountServiceError,
  exportAccountBackup,
  getUserProfile,
  importAccountBackup,
  resetLocalAccount,
  summarizeBackup,
  updateDisplayName,
  type BackupSummary,
} from '../../services/accountService';
import { getPendingSyncCount } from '../../services/syncOutboxService';
import { isSyncApiConfigured } from '../../services/syncProcessorService';
import { getTheme, setTheme, type ThemeMode } from '../../stores/themeStore';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { useVehicleContextStore } from '../../stores/vehicleContextStore';
import type { UserProfile } from '../../types';

interface AccountPageProps {
  userId: string;
  onResetComplete: () => void;
}

function formatBackupSummary(summary: BackupSummary): string {
  const parts = [
    `${summary.vehicles} vehículo${summary.vehicles === 1 ? '' : 's'}`,
    `${summary.fuelLogs} tanqueo${summary.fuelLogs === 1 ? '' : 's'}`,
    `${summary.maintenanceLogs} mantenimiento${summary.maintenanceLogs === 1 ? '' : 's'}`,
    `${summary.legalDocuments} documento${summary.legalDocuments === 1 ? '' : 's'}`,
    `${summary.taxRecords} impuesto${summary.taxRecords === 1 ? '' : 's'}`,
  ];

  if (summary.picoPlacaSchedules > 0) {
    parts.push(
      `${summary.picoPlacaSchedules} calendario${summary.picoPlacaSchedules === 1 ? '' : 's'} pico y placa`,
    );
  }

  return parts.join(', ');
}

function readLastBackupAt(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.lastBackupAt);
  } catch {
    return null;
  }
}

async function saveBackupFile(json: string, filename: string): Promise<'shared' | 'downloaded'> {
  const file = new File([json], filename, { type: 'application/json' });

  if (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: 'Respaldo A Los Pits',
      text: 'Respaldo de datos de A Los Pits',
    });
    return 'shared';
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

export function AccountPage({ userId, onResetComplete }: AccountPageProps) {
  const hydrate = useVehicleContextStore((state) => state.hydrate);
  const bumpDashboard = useDashboardRefreshStore((state) => state.bump);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [theme, setThemeState] = useState<ThemeMode>(() => getTheme());
  const [pendingSync, setPendingSync] = useState(0);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => readLastBackupAt());
  const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [userProfile, pendingCount] = await Promise.all([
          getUserProfile(userId),
          getPendingSyncCount(userId),
        ]);

        if (cancelled) {
          return;
        }

        if (!userProfile) {
          setLoadError('Perfil no encontrado.');
          return;
        }

        setProfile(userProfile);
        setDisplayName(userProfile.displayName ?? '');
        setPendingSync(pendingCount);
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar la cuenta.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSaveName() {
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const updated = await updateDisplayName(userId, displayName);
      setProfile(updated);
      setStatusMessage('Nombre actualizado.');
    } catch (error) {
      if (error instanceof AccountServiceError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('No se pudo guardar el nombre.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleExport() {
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setBackupSummary(null);

    try {
      const backup = await exportAccountBackup(userId);
      const summary = summarizeBackup(backup);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `alospits-backup-${date}.json`;
      const json = JSON.stringify(backup, null, 2);
      const method = await saveBackupFile(json, filename);

      const exportedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.lastBackupAt, exportedAt);
      setLastBackupAt(exportedAt);
      setBackupSummary(summary);
      setStatusMessage(
        method === 'shared'
          ? `Respaldo compartido (${formatBackupSummary(summary)}).`
          : `Respaldo descargado (${formatBackupSummary(summary)}).`,
      );
    } catch (error) {
      if (error instanceof AccountServiceError) {
        setErrorMessage(error.message);
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        setStatusMessage('Compartir cancelado.');
      } else {
        setErrorMessage('No se pudo exportar el respaldo.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (
      !window.confirm(
        'Importar reemplazará todos los datos locales actuales en este dispositivo. ¿Continuar?',
      )
    ) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setBackupSummary(null);

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = await importAccountBackup(userId, parsed);
      await hydrate(userId);
      const updated = await getUserProfile(userId);
      const pendingCount = await getPendingSyncCount(userId);
      setProfile(updated ?? null);
      setPendingSync(pendingCount);
      setThemeState(getTheme());
      setBackupSummary(result.summary);
      bumpDashboard();
      setStatusMessage(
        `Respaldo importado: ${formatBackupSummary(result.summary)}.${
          result.preferencesRestored ? ' Preferencias restauradas.' : ''
        }`,
      );
    } catch (error) {
      if (error instanceof AccountServiceError) {
        setErrorMessage(error.message);
      } else if (error instanceof SyntaxError) {
        setErrorMessage('El archivo no es JSON válido.');
      } else {
        setErrorMessage('No se pudo importar el respaldo.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReset() {
    if (
      !window.confirm(
        'Se borrarán vehículos, tanqueos, mantenimientos y demás datos locales. Esta acción no se puede deshacer.',
      )
    ) {
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await resetLocalAccount(userId);
      onResetComplete();
    } catch (error) {
      if (error instanceof AccountServiceError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('No se pudo restablecer la cuenta.');
      }
    } finally {
      setIsBusy(false);
    }
  }

  if (loadError) {
    return <AppPageError message={loadError} />;
  }

  if (!profile) {
    return <AppPageLoading />;
  }

  return (
    <AppPageBody>
      <section className="rounded-xl border border-pit-accent/30 bg-pit-accent/5 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Migrar a otro teléfono o navegador</h2>
        <p className="mt-1 text-xs text-slate-400">
          Sin servidor, tus datos viven solo en este dispositivo. Usa un respaldo JSON para
          trasladarlos.
        </p>

        <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-slate-300">
          <li>En el dispositivo actual, pulsa <strong className="font-medium">Exportar respaldo</strong>.</li>
          <li>Envía el archivo (.json) por WhatsApp, correo, Drive u otro medio.</li>
          <li>En el nuevo dispositivo, abre A Los Pits → Mi cuenta → Importar respaldo.</li>
        </ol>

        <p className="mt-3 text-xs text-slate-500">
          Incluye vehículos, tanqueos, mantenimientos, cumplimiento, impuestos, licencias, pico y
          placa y preferencias (tema y alertas).
        </p>

        {lastBackupAt && (
          <p className="mt-2 text-xs text-slate-500">
            Último respaldo:{' '}
            {new Date(lastBackupAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isBusy}
            className="min-h-10 flex-1 rounded-lg bg-pit-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
          >
            Exportar respaldo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="min-h-10 flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Importar respaldo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void handleImportFile(event)}
          />
        </div>

        {backupSummary && (
          <p className="mt-3 text-xs text-emerald-400/90">
            Contenido: {formatBackupSummary(backupSummary)}
          </p>
        )}
      </section>

      <section className="mt-4 rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <h2 className="text-sm font-semibold text-slate-100">Perfil local</h2>
        <p className="mt-1 text-xs text-slate-400">
          Datos almacenados en este dispositivo hasta conectar autenticación remota.
        </p>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-400">Nombre para mostrar</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={isBusy}
            maxLength={80}
            placeholder="Tu nombre"
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleSaveName()}
          disabled={isBusy}
          className="mt-3 min-h-10 rounded-lg bg-pit-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted disabled:opacity-50"
        >
          Guardar nombre
        </button>

        <p className="mt-3 text-xs text-slate-500">ID local: {profile.id.slice(0, 8)}…</p>
      </section>

      <section className="mt-4 rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <h2 className="text-sm font-semibold text-slate-100">Apariencia</h2>
        <p className="mt-1 text-xs text-slate-400">Tema claro u oscuro (spec 01).</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['dark', 'light'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setTheme(mode);
                setThemeState(mode);
              }}
              className={[
                'min-h-10 rounded-lg border px-3 py-2 text-sm font-medium',
                theme === mode
                  ? 'border-pit-accent bg-pit-accent/20 text-pit-accent'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-800',
              ].join(' ')}
            >
              {mode === 'dark' ? 'Oscuro' : 'Claro'}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4">
        <AlertSettingsPanel
          onSaved={() => {
            bumpDashboard();
          }}
        />
      </div>

      {isSyncApiConfigured() && (
        <section className="mt-4 rounded-xl border border-slate-700/60 bg-pit-surface p-4">
          <h2 className="text-sm font-semibold text-slate-100">Sincronización</h2>
          <p className="mt-2 text-sm text-slate-300">
            {pendingSync === 0
              ? 'No hay cambios pendientes de enviar.'
              : `${pendingSync} cambio${pendingSync === 1 ? '' : 's'} pendiente${pendingSync === 1 ? '' : 's'} de sincronizar.`}
          </p>
        </section>
      )}

      <section className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <h2 className="text-sm font-semibold text-red-300">Zona de peligro</h2>
        <p className="mt-1 text-xs text-slate-400">
          Borra todos los datos locales de este usuario en el dispositivo.
        </p>
        <button
          type="button"
          onClick={() => void handleReset()}
          disabled={isBusy}
          className="mt-3 min-h-10 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        >
          Restablecer datos locales
        </button>
      </section>

      {statusMessage && (
        <p className="mt-4 text-sm text-emerald-400" role="status">
          {statusMessage}
        </p>
      )}
      {errorMessage && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
    </AppPageBody>
  );
}
