import { useEffect, useState } from 'react';
import { fetchVehicleAlerts } from '../services/vehicleAlertsLoader';
import { db } from '../services/db';
import type { Vehicle } from '../types';
import { useActiveVehicleId } from '../stores/vehicleContextStore';
import { useDashboardRefreshStore } from '../stores/dashboardRefreshStore';
import type { DashboardAlert } from '../utils/dashboardAlerts';

export interface VehicleAlertsState {
  alerts: DashboardAlert[];
  alertCount: number;
  vehicle: Vehicle | null;
  isLoading: boolean;
}

const EMPTY: VehicleAlertsState = {
  alerts: [],
  alertCount: 0,
  vehicle: null,
  isLoading: false,
};

export function useVehicleAlerts(): VehicleAlertsState {
  const activeVehicleId = useActiveVehicleId();
  const revision = useDashboardRefreshStore((state) => state.revision);
  const [state, setState] = useState<VehicleAlertsState>({
    ...EMPTY,
    isLoading: Boolean(activeVehicleId),
  });

  useEffect(() => {
    if (!activeVehicleId) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;

    async function load(vehicleId: string) {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const [vehicle, alerts] = await Promise.all([
          db.vehicles.get(vehicleId),
          fetchVehicleAlerts(vehicleId),
        ]);

        if (cancelled) {
          return;
        }

        setState({
          alerts,
          alertCount: alerts.length,
          vehicle: vehicle ?? null,
          isLoading: false,
        });
      } catch {
        if (!cancelled) {
          setState({ ...EMPTY, isLoading: false });
        }
      }
    }

    void load(activeVehicleId);

    return () => {
      cancelled = true;
    };
  }, [activeVehicleId, revision]);

  return state;
}
