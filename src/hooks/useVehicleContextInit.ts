import { useEffect, useState } from 'react';
import { ensureLocalUser } from '../services/localUser';
import { ensureDefaultPicoPlacaSchedules } from '../services/picoPlacaService';
import { useVehicleContextStore } from '../stores/vehicleContextStore';

export function useVehicleContextInit() {
  const hydrate = useVehicleContextStore((state) => state.hydrate);
  const isHydrated = useVehicleContextStore((state) => state.isHydrated);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const id = await ensureLocalUser();
        if (cancelled) {
          return;
        }
        setUserId(id);
        await ensureDefaultPicoPlacaSchedules();
        await hydrate(id);
      } catch {
        if (!cancelled) {
          setError('No se pudo cargar el contexto del vehículo.');
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  return { userId, isReady: isHydrated && userId !== null, error };
}
