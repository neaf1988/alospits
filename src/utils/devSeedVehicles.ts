import { db } from '../services/db';
import type { Vehicle } from '../types';

/** Solo para desarrollo local — inserta hasta 2 vehículos de ejemplo */
export async function seedDevVehicles(userId: string): Promise<Vehicle[]> {
  const existing = await db.vehicles.where('userId').equals(userId).count();
  if (existing >= 2) {
    return db.vehicles.where('userId').equals(userId).toArray();
  }

  const now = new Date().toISOString();
  const samples: Omit<Vehicle, 'id'>[] = [
    {
      userId,
      type: 'CAR',
      brand: 'Mazda',
      line: '3',
      modelYear: 2019,
      plate: 'ABC123',
      cityCode: 'BOG',
      currentOdometerKm: 45200,
      tireTreadDepthMm: 3.2,
      createdAt: now,
    },
    {
      userId,
      type: 'MOTORCYCLE',
      brand: 'AKT',
      line: 'NKD 125',
      modelYear: 2021,
      plate: 'XYZ45F',
      cityCode: 'MDE',
      currentOdometerKm: 12800,
      tireTreadDepthMm: 2.1,
      createdAt: now,
    },
  ];

  const toInsert = samples.slice(existing);
  const created: Vehicle[] = [];

  for (const sample of toInsert) {
    const vehicle: Vehicle = { ...sample, id: crypto.randomUUID() };
    await db.vehicles.add(vehicle);
    created.push(vehicle);
  }

  return db.vehicles.where('userId').equals(userId).toArray();
}
