import type {
  ComplianceItem,
  FuelLog,
  MaintenanceLog,
  TaxRecord,
  Vehicle,
} from './index';

export interface VehicleLifeSheetFinancialSummary {
  maintenanceTotalCop: number;
  fuelTotalCop: number;
  taxTotalCop: number;
  complianceTotalCop: number;
  totalInvestmentCop: number;
  kmTraveled: number | null;
  globalCpkCop: number | null;
}

export interface VehicleLifeSheetMaintenanceRow {
  serviceDate: string;
  odometerKm: number;
  title: string;
  details: string;
  workshopName: string;
  costCop: number;
}

export interface VehicleLifeSheetComplianceRow {
  label: string;
  statusLabel: string;
  expiryLabel: string;
}

export interface VehicleLifeSheetReport {
  generatedAt: string;
  vehicle: Vehicle;
  cityName: string;
  vehicleTypeLabel: string;
  displayName: string;
  financialSummary: VehicleLifeSheetFinancialSummary;
  maintenanceRows: VehicleLifeSheetMaintenanceRow[];
  complianceRows: VehicleLifeSheetComplianceRow[];
  taxStatusSummary: string;
}

export interface VehicleLifeSheetSourceData {
  vehicle: Vehicle;
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  taxRecords: TaxRecord[];
  complianceItems: ComplianceItem[];
}
