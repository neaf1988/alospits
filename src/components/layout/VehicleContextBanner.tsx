import { useEffect, useState } from 'react';
import { db } from '../../services/db';
import { formatPlate, getVehicleDisplayName } from '../../utils/vehicleDisplay';

export function VehicleContextBanner({ vehicleId }: { vehicleId: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void db.vehicles.get(vehicleId).then((vehicle) => {
      if (!cancelled && vehicle) {
        setLabel(`${formatPlate(vehicle.plate)} · ${getVehicleDisplayName(vehicle)}`);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  if (!label) {
    return null;
  }

  return (
    <p className="mb-4 rounded-lg bg-slate-900/50 px-3 py-2 text-sm text-slate-400">{label}</p>
  );
}
