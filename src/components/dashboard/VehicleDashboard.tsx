import { useVehicleDashboard } from '../../hooks/useVehicleDashboard';
import {
  COMPLIANCE_DOCUMENT_TYPES,
  COMPLIANCE_SAFETY_TYPES,
} from '../../constants/complianceItems';
import {
  formatEfficiency,
  formatCopPerKm,
  formatDailyKm,
} from '../../utils/fuelMetrics';
import {
  formatOdometer,
  formatPlate,
  getVehicleDisplayName,
  getVehicleTypeLabel,
} from '../../utils/vehicleDisplay';
import {
  COMPLIANCE_STATUS_STYLES,
  formatExpiryDate,
  getComplianceItemLabel,
  getComplianceItemStatus,
  getComplianceItemStatusLabel,
  getExpiryCountdownText,
  sortComplianceItemsByUrgency,
} from '../../utils/complianceDisplay';
import {
  formatServiceDate,
  getNextServiceSummary,
} from '../../utils/maintenanceDisplay';
import { getUpcomingMaintenances } from '../../utils/maintenanceProjection';
import {
  formatTaxDate,
  getTaxDisplayStatus,
  getTaxDisplayStatusLabel,
  sortTaxRecordsByUrgency,
  TAX_STATUS_STYLES,
} from '../../utils/taxDisplay';
import {
  getTireTreadStatus,
  getTireTreadStatusLabel,
  TIRE_TREAD_STATUS_STYLES,
} from '../../utils/tireTreadDisplay';
import {
  DRIVER_LICENSE_STATUS_STYLES,
  getDriverLicenseDescription,
  getDriverLicenseExpiryText,
  getDriverLicenseLabel,
  getDriverLicenseStatusLabel,
  getLicenseStatusStyleKey,
  getRelevantActiveLicensesForVehicleType,
  getVehicleTypeLicenseNoun,
  sortDriverLicenseClassesByUrgency,
} from '../../utils/driverLicenseDisplay';
import { DashboardAlerts } from './DashboardAlerts';
import { MetricCard } from './DashboardCards';
import { VehicleLifeSheetExportButton } from '../lifeSheet';

interface VehicleDashboardProps {
  onManageFuelLogs?: () => void;
  onManageCompliance?: () => void;
  onManageMaintenance?: () => void;
  onManageTaxes?: () => void;
  onManageDriverLicenses?: () => void;
}

export function VehicleDashboard({
  onManageFuelLogs,
  onManageCompliance,
  onManageMaintenance,
  onManageTaxes,
  onManageDriverLicenses,
}: VehicleDashboardProps) {
  const {
    vehicle,
    fuelLogs,
    complianceItems,
    taxRecords,
    maintenanceLogs,
    driverLicenses,
    alerts,
    fuelEfficiencyKmPerGal,
    costPerKmCop,
    dailyKmAverage,
    isLoading,
    error,
  } = useVehicleDashboard();

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Cargando dashboard">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </p>
    );
  }

  if (!vehicle) {
    return null;
  }

  const pendingTaxes = taxRecords.filter((t) => t.status === 'PENDING').length;
  const sortedItems = sortComplianceItemsByUrgency(complianceItems);
  const documentItems = sortedItems.filter((item) =>
    COMPLIANCE_DOCUMENT_TYPES.includes(item.type),
  );
  const safetyItems = sortedItems.filter((item) => COMPLIANCE_SAFETY_TYPES.includes(item.type));
  const tireStatus = getTireTreadStatus(vehicle.tireTreadDepthMm);
  const sortedTaxes = sortTaxRecordsByUrgency(taxRecords);
  const upcomingMaintenance = getUpcomingMaintenances(
    vehicle.currentOdometerKm,
    maintenanceLogs,
    fuelLogs,
  );
  const activeLicenses =
    driverLicenses !== null
      ? sortDriverLicenseClassesByUrgency(
          getRelevantActiveLicensesForVehicleType(driverLicenses, vehicle.type),
          driverLicenses,
        )
      : [];
  const vehicleTypeLicenseNoun = getVehicleTypeLicenseNoun(vehicle.type);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-pit-accent/30 bg-gradient-to-br from-pit-surface to-slate-900 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">En contexto</p>
        <h2 className="mt-1 text-xl font-bold text-slate-100">{formatPlate(vehicle.plate)}</h2>
        <p className="text-sm text-slate-400">
          {getVehicleDisplayName(vehicle)} · {getVehicleTypeLabel(vehicle.type)} ·{' '}
          {vehicle.cityCode}
        </p>
        <VehicleLifeSheetExportButton vehicleId={vehicle.id} className="mt-4" />
      </section>

      <DashboardAlerts alerts={alerts} />

      <section className="rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Licencia de conducción
        </h2>
        {onManageDriverLicenses && (
          <button
            type="button"
            onClick={onManageDriverLicenses}
            className="mb-3 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800"
          >
            Gestionar licencias
          </button>
        )}
        {activeLicenses.length === 0 ? (
          <p className="text-sm text-amber-200/90">
            No hay licencia registrada para conducir este {vehicleTypeLicenseNoun}.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeLicenses.map((licenseClass) => {
              const entry = driverLicenses![licenseClass];
              const statusKey = getLicenseStatusStyleKey(entry);
              const status = statusKey === 'inactive' ? null : statusKey;

              return (
                <li
                  key={licenseClass}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      Licencia {getDriverLicenseLabel(licenseClass)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getDriverLicenseDescription(licenseClass)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {getDriverLicenseExpiryText(entry)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${DRIVER_LICENSE_STATUS_STYLES[statusKey]}`}
                  >
                    {getDriverLicenseStatusLabel(status)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Odómetro"
          value={formatOdometer(vehicle.currentOdometerKm)}
          variant="accent"
        />
        <MetricCard
          label="Km / día"
          value={dailyKmAverage !== null ? formatDailyKm(dailyKmAverage) : '—'}
          hint="Promedio histórico"
        />
        <MetricCard
          label="Rendimiento"
          value={
            fuelEfficiencyKmPerGal !== null
              ? formatEfficiency(fuelEfficiencyKmPerGal)
              : '—'
          }
          hint="Solo tanqueos llenos"
        />
        <MetricCard
          label="Costo / km"
          value={costPerKmCop !== null ? formatCopPerKm(costPerKmCop) : '—'}
          hint="Último tramo"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="Tanqueos" value={String(fuelLogs.length)} />
        <MetricCard label="Mantenim." value={String(maintenanceLogs.length)} />
        <MetricCard label="Cumplimiento" value={String(complianceItems.length)} />
      </div>

      <section className="rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Mantenimientos
        </h2>
        {onManageMaintenance && (
          <button
            type="button"
            onClick={onManageMaintenance}
            className="mb-3 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800"
          >
            Gestionar mantenimientos
          </button>
        )}
        {upcomingMaintenance.length > 0 && (
          <div className="mb-3 rounded-lg bg-pit-accent/10 px-3 py-2 ring-1 ring-pit-accent/20">
            <p className="text-xs font-medium text-pit-accent-muted">Próximo servicio</p>
            <p className="text-sm font-medium text-slate-100">
              {upcomingMaintenance[0].log.title}
            </p>
            <p className="text-xs text-slate-400">
              {getNextServiceSummary(upcomingMaintenance[0])}
            </p>
          </div>
        )}
        {maintenanceLogs.length === 0 ? (
          <p className="text-sm text-slate-500">
            Registra servicios e indica próximos objetivos por km o fecha.
          </p>
        ) : (
          <ul className="space-y-2">
            {maintenanceLogs.slice(0, 3).map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{log.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatServiceDate(log.serviceDate)} ·{' '}
                    {log.odometerKm.toLocaleString('es-CO')} km
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-pit-accent-muted">
                  ${log.costCop.toLocaleString('es-CO')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Impuesto vehicular
        </h2>
        {onManageTaxes && (
          <button
            type="button"
            onClick={onManageTaxes}
            className="mb-3 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800"
          >
            Gestionar impuestos ({pendingTaxes} pend.)
          </button>
        )}
        {sortedTaxes.length === 0 ? (
          <p className="text-sm text-slate-500">
            Registra el impuesto departamental con vencimiento y descuento por pronto pago.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedTaxes.slice(0, 3).map((record) => {
              const displayStatus = getTaxDisplayStatus(record);
              return (
                <li
                  key={record.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      Impuesto {record.taxYear}
                    </p>
                    <p className="text-xs text-slate-500">
                      Límite: {formatTaxDate(record.dueDate)}
                      {record.discountDueDate &&
                        ` · Pronto pago: ${formatTaxDate(record.discountDueDate)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${TAX_STATUS_STYLES[displayStatus]}`}
                  >
                    {getTaxDisplayStatusLabel(displayStatus)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Cumplimiento
        </h2>
        {onManageCompliance && (
          <button
            type="button"
            onClick={onManageCompliance}
            className="mb-3 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800"
          >
            Gestionar cumplimiento
          </button>
        )}

        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-slate-200">Llantas</p>
            <p className="text-xs text-slate-500">
              Labrado {vehicle.tireTreadDepthMm.toFixed(1)} mm
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${TIRE_TREAD_STATUS_STYLES[tireStatus]}`}
          >
            {getTireTreadStatusLabel(tireStatus)}
          </span>
        </div>

        {documentItems.length === 0 && safetyItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            Registra documentos, kit de seguridad y actualiza el labrado de llantas.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...documentItems, ...safetyItems].slice(0, 4).map((item) => {
              const status = getComplianceItemStatus(item);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {getComplianceItemLabel(item.type)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatExpiryDate(item.expiryDate)} · {getExpiryCountdownText(item)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ring-1 ${COMPLIANCE_STATUS_STYLES[status]}`}
                  >
                    {getComplianceItemStatusLabel(status)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-pit-surface p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Últimos tanqueos
        </h2>
        {onManageFuelLogs && (
          <button
            type="button"
            onClick={onManageFuelLogs}
            className="mb-3 min-h-12 w-full rounded-lg bg-pit-accent/20 px-4 py-2.5 text-sm font-semibold text-pit-accent ring-1 ring-pit-accent/40 hover:bg-pit-accent/30"
          >
            Gestionar tanqueos
          </button>
        )}
        {fuelLogs.length === 0 ? (
          <p className="text-sm text-slate-500">
            Registra tanqueos para ver rendimiento y costo por km.
          </p>
        ) : (
          <ul className="space-y-2">
            {fuelLogs.slice(0, 3).map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200">
                    {log.gallons.toFixed(2)} gal
                    {log.isFullTank && (
                      <span className="ml-2 text-xs text-emerald-400">Lleno</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleDateString('es-CO')} ·{' '}
                    {log.odometerKm.toLocaleString('es-CO')} km
                    {log.stationName ? ` · ${log.stationName}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-300">
                  ${log.totalCostCop.toLocaleString('es-CO')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
