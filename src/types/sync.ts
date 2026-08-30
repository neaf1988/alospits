export type SyncEntity =
  | 'vehicle'
  | 'fuelLog'
  | 'maintenanceLog'
  | 'complianceItem'
  | 'taxRecord'
  | 'userProfile';

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncOutboxStatus = 'pending' | 'synced' | 'failed';

export interface SyncOutboxEntry {
  id: string;
  userId: string;
  entity: SyncEntity;
  entityId: string;
  operation: SyncOperation;
  payload: string;
  createdAt: string;
  status: SyncOutboxStatus;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export interface SyncBatchPayload {
  userId: string;
  mutations: Array<{
    id: string;
    entity: SyncEntity;
    entityId: string;
    operation: SyncOperation;
    payload: unknown;
    createdAt: string;
  }>;
}
