import Dexie, { type Table } from 'dexie';
import type {
  FuelLog,
  LegalDocument,
  MaintenanceLog,
  PicoPlacaSchedule,
  TaxRecord,
  UserProfile,
  Vehicle,
} from '../types';
import type { SyncOutboxEntry } from '../types/sync';

export class ALosPitsDB extends Dexie {
  userProfiles!: Table<UserProfile, string>;
  vehicles!: Table<Vehicle, string>;
  fuelLogs!: Table<FuelLog, string>;
  legalDocuments!: Table<LegalDocument, string>;
  taxRecords!: Table<TaxRecord, string>;
  maintenanceLogs!: Table<MaintenanceLog, string>;
  picoPlacaSchedules!: Table<PicoPlacaSchedule, string>;
  syncOutbox!: Table<SyncOutboxEntry, string>;

  constructor() {
    super('ALosPitsDB');

    this.version(1).stores({
      userProfiles: 'id, email, activeVehicleId',
      vehicles: 'id, userId, type, plate, cityCode, [userId+plate]',
      fuelLogs: 'id, vehicleId, timestamp, [vehicleId+timestamp]',
      legalDocuments: 'id, vehicleId, type, expiryDate, [vehicleId+type]',
      taxRecords: 'id, vehicleId, taxYear, status, [vehicleId+taxYear]',
      maintenanceLogs: 'id, vehicleId, serviceDate, [vehicleId+serviceDate]',
    });

    this.version(2).stores({
      userProfiles: 'id, email, activeVehicleId',
      vehicles: 'id, userId, type, plate, cityCode, [userId+plate]',
      fuelLogs: 'id, vehicleId, timestamp, [vehicleId+timestamp]',
      legalDocuments: 'id, vehicleId, type, expiryDate, [vehicleId+type]',
      taxRecords: 'id, vehicleId, taxYear, status, [vehicleId+taxYear]',
      maintenanceLogs: 'id, vehicleId, serviceDate, [vehicleId+serviceDate]',
      picoPlacaSchedules: 'id, cityCode, vehicleType, [cityCode+vehicleType]',
    });

    this.version(3).stores({
      userProfiles: 'id, email, activeVehicleId',
      vehicles: 'id, userId, type, plate, cityCode, [userId+plate]',
      fuelLogs: 'id, vehicleId, timestamp, [vehicleId+timestamp]',
      legalDocuments: 'id, vehicleId, type, expiryDate, [vehicleId+type]',
      taxRecords: 'id, vehicleId, taxYear, status, [vehicleId+taxYear]',
      maintenanceLogs: 'id, vehicleId, serviceDate, [vehicleId+serviceDate]',
      picoPlacaSchedules: 'id, cityCode, vehicleType, [cityCode+vehicleType]',
      syncOutbox: 'id, userId, entity, entityId, status, createdAt, [userId+status]',
    });
  }
}

export const db = new ALosPitsDB();
