import type { ReactNode } from 'react';
import { NotificationBadge } from '../alerts/NotificationBadge';
import { AppWaffleMenu, resolveWaffleActiveView, type WaffleMenuView } from './AppWaffleMenu';
import { VehicleSelector } from '../VehicleSelector';

export interface AppShellProps {
  activeView: string;
  isMenuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onMenuNavigate: (view: WaffleMenuView) => void;
  canAddSecondVehicle?: boolean;
  userId?: string;
  showVehicleSelector?: boolean;
  onAddVehicle?: () => void;
  onEditVehicle?: () => void;
  error?: string | null;
  pageEyebrow?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  alertCount?: number;
  showAlertBadge?: boolean;
  onOpenAlerts?: () => void;
  children: ReactNode;
}

export function AppShell({
  activeView,
  isMenuOpen,
  onMenuOpen,
  onMenuClose,
  onMenuNavigate,
  canAddSecondVehicle,
  userId,
  showVehicleSelector,
  onAddVehicle,
  onEditVehicle,
  error,
  pageEyebrow,
  pageTitle,
  pageSubtitle,
  alertCount = 0,
  showAlertBadge = false,
  onOpenAlerts,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-pit-bg">
      <header className="shrink-0 border-b border-slate-700/60 bg-pit-surface px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start gap-3">
          <AppWaffleMenu
            isOpen={isMenuOpen}
            onOpen={onMenuOpen}
            onClose={onMenuClose}
            activeView={resolveWaffleActiveView(activeView)}
            onNavigate={onMenuNavigate}
            canAddSecondVehicle={canAddSecondVehicle}
          />
          <div className="min-w-0 flex-1 pt-1">
            {pageEyebrow ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-pit-accent">
                  {pageEyebrow}
                </p>
                <h1 className="mt-0.5 truncate text-lg font-semibold text-slate-100">
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className="mt-0.5 truncate text-sm text-slate-400">{pageSubtitle}</p>
                )}
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold tracking-tight text-pit-accent">
                  {pageTitle ?? 'A Los Pits'}
                </h1>
                <p className="text-xs text-slate-500">
                  {pageSubtitle ?? 'Dashboard automotriz · Colombia'}
                </p>
              </>
            )}
          </div>
          {showAlertBadge && onOpenAlerts && (
            <NotificationBadge count={alertCount} onClick={onOpenAlerts} />
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {showVehicleSelector && userId && onAddVehicle && (
          <div className="mt-3">
            <VehicleSelector
              userId={userId}
              onAddVehicle={onAddVehicle}
              onEditVehicle={onEditVehicle}
            />
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

/** Contenedor estándar para pantallas con scroll + pie opcional */
export function AppPageBody({
  children,
  footer,
  noPadding,
}: {
  children: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}) {
  return (
    <>
      <main
        className={[
          'min-h-0 flex-1 overflow-y-auto',
          noPadding ? undefined : 'px-4 py-4',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>
      {footer}
    </>
  );
}

export function AppPageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="h-12 w-48 animate-pulse rounded-lg bg-slate-800/80" aria-label="Cargando" />
    </div>
  );
}

export function AppPageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-12 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
