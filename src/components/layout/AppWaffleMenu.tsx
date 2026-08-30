import { useEffect } from 'react';

export type WaffleMenuView =
  | 'dashboard'
  | 'fuel-logs'
  | 'maintenance-logs'
  | 'compliance'
  | 'tax-records'
  | 'pico-placa-config'
  | 'driver-licenses'
  | 'add-vehicle'
  | 'account';

interface MenuItem {
  id: WaffleMenuView;
  label: string;
  description?: string;
  accent?: boolean;
}

interface AppWaffleMenuProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  activeView: WaffleMenuView;
  onNavigate: (view: WaffleMenuView) => void;
  canAddSecondVehicle?: boolean;
}

function WaffleIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="1.75" />
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="19" cy="5" r="1.75" />
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
      <circle cx="5" cy="19" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
      <circle cx="19" cy="19" r="1.75" />
    </svg>
  );
}

const BASE_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Inicio', description: 'Dashboard del vehículo activo' },
  { id: 'fuel-logs', label: 'Tanqueos', description: 'Historial, edición y combustible' },
  {
    id: 'maintenance-logs',
    label: 'Mantenimientos',
    description: 'Historial y próximos servicios',
  },
  {
    id: 'compliance',
    label: 'Cumplimiento',
    description: 'Documentos, kit de seguridad y llantas',
  },
  { id: 'tax-records', label: 'Impuestos', description: 'Impuesto vehicular departamental' },
  {
    id: 'driver-licenses',
    label: 'Licencias de conducción',
    description: 'Categorías A1–B3 y vencimientos',
  },
  {
    id: 'pico-placa-config',
    label: 'Pico y placa',
    description: 'Calendario por ciudad y tipo',
  },
  { id: 'account', label: 'Mi cuenta', description: 'Perfil local y respaldo JSON' },
];

export function AppWaffleMenu({
  isOpen,
  onOpen,
  onClose,
  activeView,
  onNavigate,
  canAddSecondVehicle,
}: AppWaffleMenuProps) {
  const items: MenuItem[] = canAddSecondVehicle
    ? [
        ...BASE_ITEMS,
        {
          id: 'add-vehicle',
          label: 'Registrar 2.º vehículo',
          description: 'Hasta 2 vehículos por usuario',
          accent: true,
        },
      ]
    : BASE_ITEMS;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  function handleNavigate(view: WaffleMenuView) {
    onNavigate(view);
    onClose();
  }

  return (
    <>
      <button
        type="button"
        onClick={isOpen ? onClose : onOpen}
        aria-expanded={isOpen}
        aria-controls="app-waffle-menu"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
        className={[
          'flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border transition-colors',
          isOpen
            ? 'border-pit-accent bg-pit-accent/20 text-pit-accent'
            : 'border-slate-600 bg-slate-800/80 text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800',
        ].join(' ')}
      >
        <WaffleIcon />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex" role="presentation">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <nav
            id="app-waffle-menu"
            aria-label="Navegación principal"
            className="relative flex h-full w-[min(100%,20rem)] flex-col border-r border-slate-700/60 bg-pit-surface shadow-2xl"
          >
            <div className="border-b border-slate-700/60 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <p className="text-xs font-medium uppercase tracking-wide text-pit-accent">
                A Los Pits
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-100">Menú</h2>
            </div>

            <ul className="flex-1 overflow-y-auto p-3">
              {items.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <li key={item.id} className="mb-1">
                    <button
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={[
                        'min-h-12 w-full rounded-xl px-4 py-3 text-left transition-colors',
                        isActive
                          ? 'bg-pit-accent/20 ring-2 ring-pit-accent'
                          : item.accent
                            ? 'bg-slate-800/40 hover:bg-slate-800'
                            : 'hover:bg-slate-800/80',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'block text-sm font-semibold',
                          isActive ? 'text-pit-accent' : 'text-slate-100',
                        ].join(' ')}
                      >
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                          {item.description}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-slate-700/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 w-full rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function resolveWaffleActiveView(view: string): WaffleMenuView {
  if (view === 'dashboard' || view === 'alerts') {
    return 'dashboard';
  }
  if (view.startsWith('fuel-log') || view === 'fuel-logs') {
    return 'fuel-logs';
  }
  if (view.startsWith('maintenance')) {
    return 'maintenance-logs';
  }
  if (view.startsWith('compliance') || view.startsWith('legal')) {
    return 'compliance';
  }
  if (view.startsWith('tax')) {
    return 'tax-records';
  }
  if (view.startsWith('driver-license')) {
    return 'driver-licenses';
  }
  if (view === 'edit-vehicle') {
    return 'dashboard';
  }
  if (view.startsWith('pico-placa')) {
    return 'pico-placa-config';
  }
  if (view === 'add-vehicle') {
    return 'add-vehicle';
  }
  if (view === 'account') {
    return 'account';
  }
  return 'dashboard';
}

export { resolveWaffleActiveView };
