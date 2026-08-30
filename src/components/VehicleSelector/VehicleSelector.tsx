import { useState } from 'react';
import { MAX_VEHICLES } from '../../types';
import type { Vehicle } from '../../types';
import {
  formatOdometer,
  formatPlate,
  getVehicleDisplayName,
  getVehicleTypeLabel,
} from '../../utils/vehicleDisplay';
import { useVehicleContextStore } from '../../stores/vehicleContextStore';
import { VehicleTypeIcon } from './VehicleTypeIcon';

interface VehicleSelectorProps {
  userId: string;
  onAddVehicle?: () => void;
  onEditVehicle?: () => void;
}

function VehicleOption({
  vehicle,
  isActive,
  isSwitching,
  onSelect,
}: {
  vehicle: Vehicle;
  isActive: boolean;
  isSwitching: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={isSwitching || isActive}
      onClick={onSelect}
      className={[
        'flex min-h-12 flex-1 flex-col items-start justify-center rounded-lg px-3 py-2 text-left transition-colors',
        'leading-snug disabled:cursor-default',
        isActive
          ? 'bg-pit-accent/20 ring-2 ring-pit-accent'
          : 'bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700',
      ].join(' ')}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
        <VehicleTypeIcon type={vehicle.type} className="h-4 w-4 shrink-0 text-pit-accent" />
        {formatPlate(vehicle.plate)}
      </span>
      <span className="truncate text-xs text-slate-400">
        {getVehicleDisplayName(vehicle)} · {getVehicleTypeLabel(vehicle.type)}
      </span>
    </button>
  );
}

export function VehicleSelector({ userId, onAddVehicle, onEditVehicle }: VehicleSelectorProps) {
  const vehicles = useVehicleContextStore((state) => state.vehicles);
  const activeVehicleId = useVehicleContextStore((state) => state.activeVehicleId);
  const setActiveVehicleId = useVehicleContextStore((state) => state.setActiveVehicleId);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) ?? null;
  const vehicleCount = vehicles.length;
  const canAddSecond = vehicleCount === 1 && vehicleCount < MAX_VEHICLES;

  async function handleSelect(vehicleId: string) {
    if (vehicleId === activeVehicleId || isSwitching) {
      return;
    }

    setSwitchError(null);
    setIsSwitching(true);

    try {
      await setActiveVehicleId(userId, vehicleId);
    } catch {
      setSwitchError('No se pudo cambiar de vehículo.');
    } finally {
      setIsSwitching(false);
    }
  }

  if (vehicleCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-3">
        <p className="text-sm font-medium text-slate-200">Sin vehículos registrados</p>
        <p className="mt-1 text-xs text-slate-400">
          Registra tu primer vehículo para empezar a llevar el control.
        </p>
        <button
          type="button"
          onClick={onAddVehicle}
          className="mt-3 min-h-12 w-full rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-pit-accent-muted active:opacity-90"
        >
          Registrar vehículo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Vehículo activo
        </p>
        {isSwitching && (
          <span className="text-xs text-pit-accent-muted" aria-live="polite">
            Cambiando…
          </span>
        )}
      </div>

      {vehicleCount === 2 ? (
        <div
          role="tablist"
          aria-label="Seleccionar vehículo activo"
          className="grid grid-cols-2 gap-2"
        >
          {vehicles.map((vehicle) => (
            <VehicleOption
              key={vehicle.id}
              vehicle={vehicle}
              isActive={vehicle.id === activeVehicleId}
              isSwitching={isSwitching}
              onSelect={() => void handleSelect(vehicle.id)}
            />
          ))}
        </div>
      ) : (
        activeVehicle && (
          <div className="rounded-lg bg-pit-accent/15 px-3 py-2.5 ring-1 ring-pit-accent/40">
            <div className="flex items-center gap-2">
              <VehicleTypeIcon type={activeVehicle.type} className="h-5 w-5 text-pit-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {formatPlate(activeVehicle.plate)}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {getVehicleDisplayName(activeVehicle)} ·{' '}
                  {formatOdometer(activeVehicle.currentOdometerKm)}
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {canAddSecond && (
        <button
          type="button"
          onClick={onAddVehicle}
          className="min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-pit-accent/50 hover:bg-slate-800 active:bg-slate-700"
        >
          + Registrar segundo vehículo
        </button>
      )}

      {activeVehicle && onEditVehicle && (
        <button
          type="button"
          onClick={onEditVehicle}
          className="min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-pit-accent/40 hover:bg-slate-800"
        >
          Editar vehículo activo
        </button>
      )}

      {switchError && (
        <p className="text-xs text-red-400" role="alert">
          {switchError}
        </p>
      )}
    </div>
  );
}
