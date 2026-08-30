import type { SyncBatchPayload } from '../types/sync';
import {
  getPendingSyncEntries,
  markSyncEntriesSynced,
  markSyncEntryFailed,
  clearSyncedOutbox,
} from './syncOutboxService';

const SYNC_API_URL = import.meta.env.VITE_SYNC_API_URL as string | undefined;

export function isSyncApiConfigured(): boolean {
  return Boolean(SYNC_API_URL?.trim());
}

export interface SyncProcessResult {
  processed: number;
  synced: number;
  failed: number;
  skipped: boolean;
}

export async function processSyncOutbox(userId: string): Promise<SyncProcessResult> {
  if (!isSyncApiConfigured()) {
    return { processed: 0, synced: 0, failed: 0, skipped: true };
  }

  if (!navigator.onLine) {
    return { processed: 0, synced: 0, failed: 0, skipped: true };
  }

  const pending = await getPendingSyncEntries(userId);
  if (pending.length === 0) {
    await clearSyncedOutbox(userId);
    return { processed: 0, synced: 0, failed: 0, skipped: false };
  }

  const batch: SyncBatchPayload = {
    userId,
    mutations: pending.map((entry) => ({
      id: entry.id,
      entity: entry.entity,
      entityId: entry.entityId,
      operation: entry.operation,
      payload: JSON.parse(entry.payload) as unknown,
      createdAt: entry.createdAt,
    })),
  };

  try {
    const response = await fetch(SYNC_API_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const message = `Sync API respondió ${response.status}`;
      for (const entry of pending) {
        await markSyncEntryFailed(entry.id, message);
      }
      return { processed: pending.length, synced: 0, failed: pending.length, skipped: false };
    }

    await markSyncEntriesSynced(pending.map((entry) => entry.id));
    await clearSyncedOutbox(userId);

    return {
      processed: pending.length,
      synced: pending.length,
      failed: 0,
      skipped: false,
    };
  } catch {
    const message = 'No se pudo conectar con el servidor de sincronización.';
    for (const entry of pending) {
      await markSyncEntryFailed(entry.id, message);
    }
    return { processed: pending.length, synced: 0, failed: pending.length, skipped: false };
  }
}
