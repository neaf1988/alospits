import { STORAGE_KEYS } from '../constants/storage';

const MAX_LOG_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function readLog(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notificationLog);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLog(log: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEYS.notificationLog, JSON.stringify(log));
}

function pruneLog(log: Record<string, string>): Record<string, string> {
  const cutoff = Date.now() - MAX_LOG_AGE_MS;
  const pruned: Record<string, string> = {};

  for (const [key, sentAt] of Object.entries(log)) {
    const timestamp = new Date(sentAt).getTime();
    if (!Number.isNaN(timestamp) && timestamp >= cutoff) {
      pruned[key] = sentAt;
    }
  }

  return pruned;
}

export function wasNotificationSent(id: string): boolean {
  return id in readLog();
}

export function markNotificationSent(id: string): void {
  const log = pruneLog(readLog());
  log[id] = new Date().toISOString();
  writeLog(log);
}

export function clearNotificationLog(): void {
  localStorage.removeItem(STORAGE_KEYS.notificationLog);
}

export function formatDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
