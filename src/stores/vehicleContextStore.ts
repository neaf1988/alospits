import { create } from 'zustand';
import { STORAGE_KEYS } from '../constants/storage';
import { db } from '../services/db';
import { MAX_VEHICLES } from '../types';
import type { Vehicle } from '../types';

function persistActiveVehicleId(vehicleId: string | null): void {
  if (vehicleId) {
    localStorage.setItem(STORAGE_KEYS.activeVehicleId, vehicleId);
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.activeVehicleId);
}

interface VehicleContextState {
  activeVehicleId: string | null;
  vehicles: Vehicle[];
  isHydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  setActiveVehicleId: (userId: string, vehicleId: string) => Promise<void>;
  refreshVehicles: (userId: string) => Promise<void>;
  canAddVehicle: (userId: string) => Promise<boolean>;
  clear: () => void;
}

async function resolveActiveVehicleId(
  userId: string,
  candidateId: string,
): Promise<string | null> {
  if (!candidateId) {
    return null;
  }

  const vehicle = await db.vehicles.get(candidateId);
  return vehicle?.userId === userId ? candidateId : null;
}

export const useVehicleContextStore = create<VehicleContextState>((set, get) => ({
  activeVehicleId: null,
  vehicles: [],
  isHydrated: false,

  hydrate: async (userId) => {
    const profile = await db.userProfiles.get(userId);
    const vehicles = await db.vehicles.where('userId').equals(userId).toArray();

    let activeVehicleId: string | null = null;

    if (profile?.activeVehicleId) {
      activeVehicleId = await resolveActiveVehicleId(userId, profile.activeVehicleId);
    }

    if (!activeVehicleId) {
      const cachedId = localStorage.getItem(STORAGE_KEYS.activeVehicleId);
      if (cachedId) {
        activeVehicleId = await resolveActiveVehicleId(userId, cachedId);
      }
    }

    if (!activeVehicleId && vehicles.length > 0) {
      activeVehicleId = vehicles[0].id;
      if (profile) {
        await db.userProfiles.update(userId, { activeVehicleId });
      }
    }

    persistActiveVehicleId(activeVehicleId);
    set({ activeVehicleId, vehicles, isHydrated: true });
  },

  setActiveVehicleId: async (userId, vehicleId) => {
    const vehicle = await db.vehicles.get(vehicleId);

    if (!vehicle || vehicle.userId !== userId) {
      throw new Error('El vehículo seleccionado no pertenece al usuario.');
    }

    const profile = await db.userProfiles.get(userId);

    if (!profile) {
      throw new Error('Perfil de usuario no encontrado.');
    }

    await db.userProfiles.update(userId, { activeVehicleId: vehicleId });
    persistActiveVehicleId(vehicleId);
    set({ activeVehicleId: vehicleId });
  },

  refreshVehicles: async (userId) => {
    const vehicles = await db.vehicles.where('userId').equals(userId).toArray();
    const { activeVehicleId } = get();

    if (activeVehicleId && !vehicles.some((v) => v.id === activeVehicleId)) {
      const fallbackId = vehicles[0]?.id ?? null;
      if (fallbackId) {
        await db.userProfiles.update(userId, { activeVehicleId: fallbackId });
      }
      persistActiveVehicleId(fallbackId);
      set({ vehicles, activeVehicleId: fallbackId });
      return;
    }

    set({ vehicles });
  },

  canAddVehicle: async (userId) => {
    const count = await db.vehicles.where('userId').equals(userId).count();
    return count < MAX_VEHICLES;
  },

  clear: () => {
    persistActiveVehicleId(null);
    set({ activeVehicleId: null, vehicles: [], isHydrated: false });
  },
}));

/** Selector conveniente para filtrado por contexto activo */
export function useActiveVehicleId(): string | null {
  return useVehicleContextStore((state) => state.activeVehicleId);
}
