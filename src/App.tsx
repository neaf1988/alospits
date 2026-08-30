import { useState, type ReactNode } from 'react';
import {
  AppPageBody,
  AppPageError,
  AppPageLoading,
  AppShell,
} from './components/layout/AppShell';
import type { WaffleMenuView } from './components/layout/AppWaffleMenu';
import { VehicleDashboard } from './components/dashboard/VehicleDashboard';
import { FuelLogRegistration, FuelLogsPage } from './components/fuel';
import { ComplianceItemRegistration, CompliancePage } from './components/compliance';
import { MaintenanceLogRegistration, MaintenanceLogsPage } from './components/maintenance';
import { TaxRecordRegistration, TaxRecordsPage } from './components/tax';
import { DriverLicenseEditor, DriverLicensesPage } from './components/driverLicenses';
import { PicoPlacaConfigPage, PicoPlacaScheduleEditor } from './components/picoPlaca';
import { VehicleEditor } from './components/vehicle';
import { AlertsSummaryPage } from './components/alerts';
import { AccountPage } from './components/account';
import { VehicleOnboarding } from './components/onboarding/VehicleOnboarding';
import { useVehicleContextInit } from './hooks/useVehicleContextInit';
import { useVehicleAlerts } from './hooks/useVehicleAlerts';
import { useSyncProcessor } from './hooks/useSyncProcessor';
import type { ComplianceItemCategory } from './services/complianceItemService';
import { getDriverLicenses } from './services/driverLicenseService';
import { useActiveVehicleId, useVehicleContextStore } from './stores/vehicleContextStore';
import type { DriverLicenseClass, DriverLicenseEntry } from './types';
import { seedDevVehicles } from './utils/devSeedVehicles';

type AppView =
  | 'dashboard'
  | 'add-vehicle'
  | 'fuel-logs'
  | 'fuel-log-form'
  | 'compliance'
  | 'compliance-item-form'
  | 'maintenance-logs'
  | 'maintenance-form'
  | 'tax-records'
  | 'tax-form'
  | 'pico-placa-config'
  | 'pico-placa-form'
  | 'driver-licenses'
  | 'driver-license-form'
  | 'edit-vehicle'
  | 'account'
  | 'alerts';

interface ShellMeta {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  showVehicleSelector?: boolean;
}

function getShellMeta(view: AppView): ShellMeta {
  switch (view) {
    case 'dashboard':
      return { showVehicleSelector: true };
    case 'add-vehicle':
      return {
        eyebrow: 'Vehículos',
        title: 'Registrar vehículo',
        subtitle: 'Hasta 2 vehículos por usuario',
      };
    case 'fuel-logs':
      return {
        eyebrow: 'Combustible',
        title: 'Tanqueos',
        subtitle: 'Historial y rendimiento',
      };
    case 'fuel-log-form':
      return {
        eyebrow: 'Combustible',
        title: 'Tanqueo',
        subtitle: 'Vehículo activo',
      };
    case 'compliance':
      return {
        eyebrow: 'Normativa',
        title: 'Cumplimiento',
        subtitle: 'Documentos, kit de seguridad y llantas',
      };
    case 'compliance-item-form':
      return {
        eyebrow: 'Normativa',
        title: 'Registro de cumplimiento',
        subtitle: 'Vehículo activo',
      };
    case 'maintenance-logs':
      return {
        eyebrow: 'Taller',
        title: 'Mantenimientos',
        subtitle: 'Vehículo activo',
      };
    case 'maintenance-form':
      return {
        eyebrow: 'Taller',
        title: 'Mantenimiento',
        subtitle: 'Vehículo activo',
      };
    case 'tax-records':
      return {
        eyebrow: 'Impuestos',
        title: 'Impuesto vehicular',
        subtitle: 'Vehículo activo',
      };
    case 'tax-form':
      return {
        eyebrow: 'Impuestos',
        title: 'Impuesto vehicular',
        subtitle: 'Vehículo activo',
      };
    case 'pico-placa-config':
      return {
        eyebrow: 'Movilidad',
        title: 'Pico y placa',
        subtitle: 'Configuración por ciudad y tipo',
      };
    case 'pico-placa-form':
      return {
        eyebrow: 'Movilidad',
        title: 'Calendario pico y placa',
        subtitle: 'Días y dígitos restringidos',
      };
    case 'driver-licenses':
      return {
        eyebrow: 'Conductor',
        title: 'Licencias de conducción',
        subtitle: 'Categorías y vencimientos por tipo de vehículo',
      };
    case 'driver-license-form':
      return {
        eyebrow: 'Conductor',
        title: 'Editar licencia',
        subtitle: 'Fecha de vencimiento y alertas',
      };
    case 'edit-vehicle':
      return {
        eyebrow: 'Vehículos',
        title: 'Editar vehículo',
        subtitle: 'Datos del vehículo activo',
        showVehicleSelector: false,
      };
    case 'account':
      return {
        eyebrow: 'Cuenta',
        title: 'Mi cuenta',
        subtitle: 'Perfil local y respaldo',
      };
    case 'alerts':
      return {
        eyebrow: 'Notificaciones',
        title: 'Alertas pendientes',
        subtitle: 'Resumen del vehículo activo',
      };
    default:
      return {};
  }
}

function App() {
  const { userId, isReady, error } = useVehicleContextInit();
  useSyncProcessor(userId);
  const activeVehicleId = useActiveVehicleId();
  const vehicles = useVehicleContextStore((state) => state.vehicles);
  const { alertCount } = useVehicleAlerts();
  const hydrate = useVehicleContextStore((state) => state.hydrate);
  const [view, setView] = useState<AppView>('dashboard');
  const [editingComplianceItemId, setEditingComplianceItemId] = useState<string | null>(null);
  const [complianceCategory, setComplianceCategory] = useState<ComplianceItemCategory>('document');
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [editingFuelLogId, setEditingFuelLogId] = useState<string | null>(null);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [editingPicoPlacaScheduleId, setEditingPicoPlacaScheduleId] = useState<string | null>(null);
  const [licenseFormEntry, setLicenseFormEntry] = useState<{
    licenseClass: DriverLicenseClass;
    entry: DriverLicenseEntry;
  } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const globalViews: AppView[] = [
    'dashboard',
    'add-vehicle',
    'pico-placa-config',
    'pico-placa-form',
    'driver-licenses',
    'driver-license-form',
    'account',
  ];

  const hasNoVehicles = isReady && vehicles.length === 0;
  const showAlertBadge = !hasNoVehicles && Boolean(activeVehicleId);
  const activeViewKey =
    hasNoVehicles && !globalViews.includes(view) ? 'add-vehicle' : view;

  const shellMeta =
    hasNoVehicles && !globalViews.includes(view)
      ? {
          eyebrow: 'Bienvenido a A Los Pits',
          title: 'Registra tu primer vehículo',
          subtitle: 'Datos básicos de tu carro o moto',
        }
      : view === 'add-vehicle' && vehicles.length === 1
        ? {
            eyebrow: 'Vehículos',
            title: 'Registrar segundo vehículo',
            subtitle: 'Hasta 2 vehículos por usuario',
          }
        : getShellMeta(activeViewKey as AppView);

  function goToDashboard() {
    setView('dashboard');
    setEditingComplianceItemId(null);
    setEditingMaintenanceId(null);
    setEditingFuelLogId(null);
    setEditingTaxId(null);
    setEditingPicoPlacaScheduleId(null);
    setLicenseFormEntry(null);
  }

  function openEditDriverLicense(licenseClass: DriverLicenseClass) {
    if (!userId) {
      return;
    }
    void getDriverLicenses(userId).then((licenses) => {
      setLicenseFormEntry({ licenseClass, entry: licenses[licenseClass] });
      setView('driver-license-form');
    });
  }

  function openAddComplianceItem(category: ComplianceItemCategory) {
    setComplianceCategory(category);
    setEditingComplianceItemId(null);
    setView('compliance-item-form');
  }

  function openEditComplianceItem(itemId: string) {
    setEditingComplianceItemId(itemId);
    setView('compliance-item-form');
  }

  function openAddFuelLog() {
    setEditingFuelLogId(null);
    setView('fuel-log-form');
  }

  function openEditFuelLog(logId: string) {
    setEditingFuelLogId(logId);
    setView('fuel-log-form');
  }

  function openAddMaintenance() {
    setEditingMaintenanceId(null);
    setView('maintenance-form');
  }

  function openEditMaintenance(logId: string) {
    setEditingMaintenanceId(logId);
    setView('maintenance-form');
  }

  function openAddTax() {
    setEditingTaxId(null);
    setView('tax-form');
  }

  function openEditTax(recordId: string) {
    setEditingTaxId(recordId);
    setView('tax-form');
  }

  function openAddPicoPlacaSchedule() {
    setEditingPicoPlacaScheduleId(null);
    setView('pico-placa-form');
  }

  function openEditPicoPlacaSchedule(scheduleId: string) {
    setEditingPicoPlacaScheduleId(scheduleId);
    setView('pico-placa-form');
  }

  function handleMenuNavigate(menuView: WaffleMenuView) {
    const menuGlobalViews: WaffleMenuView[] = [
      'dashboard',
      'add-vehicle',
      'pico-placa-config',
      'driver-licenses',
      'account',
    ];
    if (hasNoVehicles && !menuGlobalViews.includes(menuView)) {
      return;
    }
    if (!activeVehicleId && !menuGlobalViews.includes(menuView)) {
      return;
    }
    setView(menuView);
    setEditingComplianceItemId(null);
    setEditingMaintenanceId(null);
    setEditingFuelLogId(null);
    setEditingTaxId(null);
    setEditingPicoPlacaScheduleId(null);
    setLicenseFormEntry(null);
  }

  async function handleVehicleSaved() {
    if (!userId) {
      return;
    }
    await hydrate(userId);
    goToDashboard();
  }

  async function handleVehicleDeleted() {
    if (!userId) {
      return;
    }
    await hydrate(userId);
    goToDashboard();
  }

  async function handleDevSeed() {
    if (!userId) {
      return;
    }
    await seedDevVehicles(userId);
    await hydrate(userId);
  }

  async function handleAccountReset() {
    if (!userId) {
      return;
    }
    await hydrate(userId);
    setView('dashboard');
  }

  function renderContent(): ReactNode {
    if (!userId) {
      return <AppPageLoading />;
    }

    if (view === 'account') {
      return (
        <AppPageBody>
          <AccountPage userId={userId} onResetComplete={() => void handleAccountReset()} />
        </AppPageBody>
      );
    }

    if (view === 'pico-placa-config') {
      return (
        <PicoPlacaConfigPage
          onAddSchedule={openAddPicoPlacaSchedule}
          onEditSchedule={openEditPicoPlacaSchedule}
        />
      );
    }

    if (view === 'pico-placa-form') {
      return (
        <PicoPlacaScheduleEditor
          scheduleId={editingPicoPlacaScheduleId ?? undefined}
          onComplete={() => {
            setEditingPicoPlacaScheduleId(null);
            setView('pico-placa-config');
          }}
          onCancel={() => {
            setEditingPicoPlacaScheduleId(null);
            setView('pico-placa-config');
          }}
        />
      );
    }

    if (view === 'driver-licenses') {
      return (
        <AppPageBody>
          <DriverLicensesPage userId={userId} onEditLicense={openEditDriverLicense} />
        </AppPageBody>
      );
    }

    if (view === 'driver-license-form' && licenseFormEntry) {
      return (
        <AppPageBody>
          <DriverLicenseEditor
            userId={userId}
            licenseClass={licenseFormEntry.licenseClass}
            initialEntry={licenseFormEntry.entry}
            onComplete={() => {
              setLicenseFormEntry(null);
              setView('driver-licenses');
            }}
            onCancel={() => {
              setLicenseFormEntry(null);
              setView('driver-licenses');
            }}
          />
        </AppPageBody>
      );
    }

    if (hasNoVehicles) {
      return (
        <VehicleOnboarding userId={userId} mode="first" onComplete={() => void handleVehicleSaved()} />
      );
    }

    if (view === 'add-vehicle' && vehicles.length === 1) {
      return (
        <VehicleOnboarding
          userId={userId}
          mode="second"
          onComplete={() => void handleVehicleSaved()}
          onCancel={goToDashboard}
        />
      );
    }

    if (!activeVehicleId) {
      return <AppPageError message="Selecciona un vehículo activo." />;
    }

    switch (view) {
      case 'alerts':
        return <AlertsSummaryPage />;
      case 'dashboard':
        return (
          <AppPageBody>
            <VehicleDashboard
              onManageFuelLogs={() => setView('fuel-logs')}
              onManageCompliance={() => setView('compliance')}
              onManageMaintenance={() => setView('maintenance-logs')}
              onManageTaxes={() => setView('tax-records')}
              onManageDriverLicenses={() => setView('driver-licenses')}
            />
          </AppPageBody>
        );
      case 'fuel-logs':
        return (
          <FuelLogsPage
            vehicleId={activeVehicleId}
            onAddFuelLog={openAddFuelLog}
            onEditFuelLog={openEditFuelLog}
          />
        );
      case 'fuel-log-form':
        return (
          <FuelLogRegistration
            userId={userId}
            vehicleId={activeVehicleId}
            logId={editingFuelLogId ?? undefined}
            onComplete={() => {
              setEditingFuelLogId(null);
              setView('fuel-logs');
            }}
            onCancel={() => {
              setEditingFuelLogId(null);
              setView('fuel-logs');
            }}
          />
        );
      case 'compliance':
        return (
          <CompliancePage
            userId={userId}
            vehicleId={activeVehicleId}
            onAddItem={openAddComplianceItem}
            onEditItem={openEditComplianceItem}
          />
        );
      case 'compliance-item-form':
        return (
          <ComplianceItemRegistration
            vehicleId={activeVehicleId}
            itemId={editingComplianceItemId ?? undefined}
            category={complianceCategory}
            onComplete={() => {
              setEditingComplianceItemId(null);
              setView('compliance');
            }}
            onCancel={() => {
              setEditingComplianceItemId(null);
              setView('compliance');
            }}
          />
        );
      case 'maintenance-logs':
        return (
          <MaintenanceLogsPage
            vehicleId={activeVehicleId}
            onAddMaintenance={openAddMaintenance}
            onEditMaintenance={openEditMaintenance}
          />
        );
      case 'maintenance-form':
        return (
          <MaintenanceLogRegistration
            userId={userId}
            vehicleId={activeVehicleId}
            logId={editingMaintenanceId ?? undefined}
            onComplete={() => {
              setEditingMaintenanceId(null);
              setView('maintenance-logs');
            }}
            onCancel={() => {
              setEditingMaintenanceId(null);
              setView('maintenance-logs');
            }}
          />
        );
      case 'tax-records':
        return (
          <TaxRecordsPage
            vehicleId={activeVehicleId}
            onAddTax={openAddTax}
            onEditTax={openEditTax}
          />
        );
      case 'tax-form':
        return (
          <TaxRecordRegistration
            vehicleId={activeVehicleId}
            recordId={editingTaxId ?? undefined}
            onComplete={() => {
              setEditingTaxId(null);
              setView('tax-records');
            }}
            onCancel={() => {
              setEditingTaxId(null);
              setView('tax-records');
            }}
          />
        );
      case 'edit-vehicle':
        return (
          <VehicleEditor
            userId={userId}
            vehicleId={activeVehicleId}
            onComplete={goToDashboard}
            onCancel={goToDashboard}
            onDeleted={() => void handleVehicleDeleted()}
          />
        );
      default:
        return null;
    }
  }

  if (!isReady || !userId) {
    return (
      <div className="flex h-dvh items-center justify-center bg-pit-bg">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-slate-800/80" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <>
      <AppShell
        activeView={activeViewKey}
        isMenuOpen={isMenuOpen}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
        onMenuNavigate={handleMenuNavigate}
        canAddSecondVehicle={vehicles.length === 1}
        userId={userId}
        showVehicleSelector={shellMeta.showVehicleSelector}
        onAddVehicle={() => setView('add-vehicle')}
        onEditVehicle={
          activeVehicleId ? () => setView('edit-vehicle') : undefined
        }
        error={error}
        pageEyebrow={shellMeta.eyebrow}
        pageTitle={shellMeta.title}
        pageSubtitle={shellMeta.subtitle}
        showAlertBadge={showAlertBadge}
        alertCount={alertCount}
        onOpenAlerts={() => setView('alerts')}
      >
        {renderContent()}
      </AppShell>
      {import.meta.env.DEV && hasNoVehicles && (
        <button
          type="button"
          onClick={() => void handleDevSeed()}
          className="fixed bottom-4 right-4 z-[60] rounded-lg border border-dashed border-slate-600 bg-slate-900/90 px-3 py-2 text-xs text-slate-500"
        >
          [Dev] Seed
        </button>
      )}
    </>
  );
}

export default App;
