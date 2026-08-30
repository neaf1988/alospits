import { db } from './db';
import type { SyncEntity, SyncOperation, SyncOutboxEntry } from '../types/sync';

export async function enqueueSyncMutation(
  userId: string,
  entity: SyncEntity,
  entityId: string,
  operation: SyncOperation,
  payload: unknown,
): Promise<void> {
  const entry: SyncOutboxEntry = {
    id: crypto.randomUUID(),
    userId,
    entity,
    entityId,
    operation,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  await db.syncOutbox.add(entry);
}

export async function getPendingSyncCount(userId: string): Promise<number> {
  return db.syncOutbox
    .where('[userId+status]')
    .equals([userId, 'pending'])
    .count();
}

export async function getPendingSyncEntries(userId: string): Promise<SyncOutboxEntry[]> {
  const entries = await db.syncOutbox
    .where('[userId+status]')
    .equals([userId, 'pending'])
    .toArray();

  return entries.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function markSyncEntriesSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const now = new Date().toISOString();
  await db.transaction('rw', db.syncOutbox, async () => {
    for (const id of ids) {
      await db.syncOutbox.update(id, { status: 'synced', lastAttemptAt: now });
    }
  });
}

export async function markSyncEntryFailed(
  id: string,
  errorMessage: string,
): Promise<void> {
  await db.syncOutbox.update(id, {
    status: 'failed',
    lastAttemptAt: new Date().toISOString(),
    errorMessage,
  });
}

export async function resetFailedSyncEntries(userId: string): Promise<number> {
  const failed = await db.syncOutbox
    .where('[userId+status]')
    .equals([userId, 'failed'])
    .toArray();

  await db.transaction('rw', db.syncOutbox, async () => {
    for (const entry of failed) {
      await db.syncOutbox.update(entry.id, {
        status: 'pending',
        errorMessage: undefined,
      });
    }
  });

  return failed.length;
}

export async function clearSyncedOutbox(userId: string, olderThanDays = 7): Promise<number> {
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const synced = await db.syncOutbox
    .where('[userId+status]')
    .equals([userId, 'synced'])
    .toArray();

  const toDelete = synced.filter(
    (entry) => new Date(entry.createdAt).getTime() < cutoff,
  );

  await db.syncOutbox.bulkDelete(toDelete.map((entry) => entry.id));
  return toDelete.length;
}
