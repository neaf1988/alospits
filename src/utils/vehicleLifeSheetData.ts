import { getCityName } from '../constants/cities';
import type {
  ComplianceItem,
  ComplianceItemType,
  FuelLog,
  MaintenanceLog,
  TaxRecord,
  Vehicle,
} from '../types';
import type {
  VehicleLifeSheetComplianceRow,
  VehicleLifeSheetFinancialSummary,
  VehicleLifeSheetMaintenanceRow,
  VehicleLifeSheetReport,
  VehicleLifeSheetSourceData,
} from '../types/vehicleLifeSheet';
import {
  formatExpiryDate,
  getComplianceItemLabel,
  getComplianceItemStatus,
  getComplianceItemStatusLabel,
} from './complianceDisplay';
import { formatServiceDate } from './maintenanceDisplay';
import {
  formatTaxDate,
  getTaxDisplayStatus,
  getTaxDisplayStatusLabel,
} from './taxDisplay';
import { getVehicleDisplayName, getVehicleTypeLabel } from './vehicleDisplay';

const LIFE_SHEET_COMPLIANCE_TYPES: ComplianceItemType[] = [
  'SOAT',
  'TECNOMECANICA',
  'SEGURO_TODO_RIESGO',
  'EXTINTOR',
  'BOTIQUIN',
];

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function calculateKmTraveled(
  vehicle: Vehicle,
  fuelLogs: FuelLog[],
  maintenanceLogs: MaintenanceLog[],
): number | null {
  const odometerReadings = [
    vehicle.currentOdometerKm,
    ...fuelLogs.map((log) => log.odometerKm),
    ...maintenanceLogs.map((log) => log.odometerKm),
  ];

  if (odometerReadings.length < 2) {
    return null;
  }

  const minKm = Math.min(...odometerReadings);
  const maxKm = Math.max(...odometerReadings);
  const traveled = maxKm - minKm;

  return traveled > 0 ? traveled : null;
}

function buildFinancialSummary(data: VehicleLifeSheetSourceData): VehicleLifeSheetFinancialSummary {
  const maintenanceTotalCop = sum(data.maintenanceLogs.map((log) => log.costCop));
  const fuelTotalCop = sum(data.fuelLogs.map((log) => log.totalCostCop));
  const taxTotalCop = sum(
    data.taxRecords.filter((record) => record.status === 'PAID').map((record) => record.costCop),
  );
  const complianceTotalCop = sum(
    data.complianceItems.map((item) => item.costCop ?? 0),
  );
  const totalInvestmentCop =
    maintenanceTotalCop + fuelTotalCop + taxTotalCop + complianceTotalCop;
  const kmTraveled = calculateKmTraveled(
    data.vehicle,
    data.fuelLogs,
    data.maintenanceLogs,
  );
  const globalCpkCop =
    kmTraveled !== null && kmTraveled > 0 ? totalInvestmentCop / kmTraveled : null;

  return {
    maintenanceTotalCop,
    fuelTotalCop,
    taxTotalCop,
    complianceTotalCop,
    totalInvestmentCop,
    kmTraveled,
    globalCpkCop,
  };
}

function buildMaintenanceRows(maintenanceLogs: MaintenanceLog[]): VehicleLifeSheetMaintenanceRow[] {
  return [...maintenanceLogs]
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
    .map((log) => ({
      serviceDate: formatServiceDate(log.serviceDate),
      odometerKm: log.odometerKm,
      title: log.title,
      details: log.details,
      workshopName: log.workshopName ?? '—',
      costCop: log.costCop,
    }));
}

function buildComplianceRows(complianceItems: ComplianceItem[]): VehicleLifeSheetComplianceRow[] {
  return LIFE_SHEET_COMPLIANCE_TYPES.map((type) => {
    const item = complianceItems.find((record) => record.type === type);
    if (!item) {
      return {
        label: getComplianceItemLabel(type),
        statusLabel: 'No registrado',
        expiryLabel: '—',
      };
    }

    const status = getComplianceItemStatus(item);
    return {
      label: getComplianceItemLabel(type),
      statusLabel: getComplianceItemStatusLabel(status),
      expiryLabel: formatExpiryDate(item.expiryDate),
    };
  });
}

function buildTaxStatusSummary(taxRecords: TaxRecord[]): string {
  if (taxRecords.length === 0) {
    return 'Sin registros de impuesto vehicular.';
  }

  const pending = taxRecords.filter((record) => record.status === 'PENDING');
  if (pending.length === 0) {
    return 'Todos los impuestos registrados están pagados.';
  }

  const sortedPending = [...pending].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const next = sortedPending[0];
  const displayStatus = getTaxDisplayStatus(next);

  return `Impuesto ${next.taxYear}: ${getTaxDisplayStatusLabel(displayStatus)} · vence ${formatTaxDate(next.dueDate)}`;
}

export function buildVehicleLifeSheetReport(data: VehicleLifeSheetSourceData): VehicleLifeSheetReport {
  return {
    generatedAt: new Date().toISOString(),
    vehicle: data.vehicle,
    cityName: getCityName(data.vehicle.cityCode),
    vehicleTypeLabel: getVehicleTypeLabel(data.vehicle.type),
    displayName: getVehicleDisplayName(data.vehicle),
    financialSummary: buildFinancialSummary(data),
    maintenanceRows: buildMaintenanceRows(data.maintenanceLogs),
    complianceRows: buildComplianceRows(data.complianceItems),
    taxStatusSummary: buildTaxStatusSummary(data.taxRecords),
  };
}

export function formatCopAmount(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CO')}`;
}

export function formatCpk(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return `$${Math.round(value).toLocaleString('es-CO')}/km`;
}

export function buildLifeSheetFilename(plate: string): string {
  const safePlate = plate.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() || 'vehiculo';
  const dateStamp = new Date().toISOString().slice(0, 10);
  return `hoja-de-vida-${safePlate}-${dateStamp}.pdf`;
}
