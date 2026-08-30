import { useEffect, useState } from 'react';
import { getDriverLicenses } from '../services/driverLicenseService';
import { db } from '../services/db';
import { fetchVehicleAlerts } from '../services/vehicleAlertsLoader';
import type {
  ComplianceItem,
  DriverLicenses,
  FuelLog,
  MaintenanceLog,
  TaxRecord,
  Vehicle,
} from '../types';
import { useActiveVehicleId } from '../stores/vehicleContextStore';
import { useDashboardRefreshStore } from '../stores/dashboardRefreshStore';
import type { DashboardAlert } from '../utils/dashboardAlerts';
import {
  calculateLatestCostPerKm,
  calculateLatestFuelEfficiency,
} from '../utils/fuelMetrics';
import { createEmptyDriverLicenses } from '../utils/driverLicenseUtils';
import { calculateDailyKmAverage } from '../utils/maintenanceProjection';

export interface VehicleDashboardData {
  vehicle: Vehicle | null;
  fuelLogs: FuelLog[];
  complianceItems: ComplianceItem[];
  taxRecords: TaxRecord[];
  maintenanceLogs: MaintenanceLog[];
  driverLicenses: DriverLicenses | null;
  alerts: DashboardAlert[];
  fuelEfficiencyKmPerGal: number | null;
  costPerKmCop: number | null;
  dailyKmAverage: number | null;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_DASHBOARD: VehicleDashboardData = {
  vehicle: null,
  fuelLogs: [],
  complianceItems: [],
  taxRecords: [],
  maintenanceLogs: [],
  driverLicenses: null,
  alerts: [],
  fuelEfficiencyKmPerGal: null,
  costPerKmCop: null,
  dailyKmAverage: null,
  isLoading: false,
  error: null,
};

export function useVehicleDashboard(): VehicleDashboardData {
  const activeVehicleId = useActiveVehicleId();
  const revision = useDashboardRefreshStore((state) => state.revision);
  const [data, setData] = useState<VehicleDashboardData>({
    ...EMPTY_DASHBOARD,
    isLoading: Boolean(activeVehicleId),
  });

  useEffect(() => {
    if (!activeVehicleId) {
      setData(EMPTY_DASHBOARD);
      return;
    }

    let cancelled = false;

    async function loadDashboard(vehicleId: string) {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const [vehicle, fuelLogs, complianceItems, taxRecords, maintenanceLogs] =
          await Promise.all([
            db.vehicles.get(vehicleId),
            db.fuelLogs.where('vehicleId').equals(vehicleId).toArray(),
            db.legalDocuments.where('vehicleId').equals(vehicleId).toArray(),
            db.taxRecords.where('vehicleId').equals(vehicleId).toArray(),
            db.maintenanceLogs.where('vehicleId').equals(vehicleId).toArray(),
          ]);

        if (cancelled) {
          return;
        }

        if (!vehicle) {
          setData({
            ...EMPTY_DASHBOARD,
            error: 'Vehículo no encontrado.',
          });
          return;
        }

        const driverLicenses = await getDriverLicenses(vehicle.userId).catch(() => null);

        const [alerts, sortedFuel, sortedMaintenance] = await Promise.all([
          fetchVehicleAlerts(vehicleId),
          Promise.resolve(
            [...fuelLogs].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            ),
          ),
          Promise.resolve(
            [...maintenanceLogs].sort(
              (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime(),
            ),
          ),
        ]);

        setData({
          vehicle,
          fuelLogs: sortedFuel,
          complianceItems,
          taxRecords,
          maintenanceLogs: sortedMaintenance,
          driverLicenses: driverLicenses ?? createEmptyDriverLicenses(),
          alerts,
          fuelEfficiencyKmPerGal: calculateLatestFuelEfficiency(fuelLogs),
          costPerKmCop: calculateLatestCostPerKm(fuelLogs),
          dailyKmAverage: calculateDailyKmAverage(fuelLogs, maintenanceLogs),
          isLoading: false,
          error: null,
        });
      } catch {
        if (!cancelled) {
          setData({
            ...EMPTY_DASHBOARD,
            error: 'No se pudo cargar el dashboard.',
          });
        }
      }
    }

    void loadDashboard(activeVehicleId);

    return () => {
      cancelled = true;
    };
  }, [activeVehicleId, revision]);

  return data;
}
