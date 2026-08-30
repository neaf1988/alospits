import { STORAGE_KEYS } from '../constants/storage';

export type ThemeMode = 'dark' | 'light';

function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return 'dark';
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem(STORAGE_KEYS.theme, mode);
}

export function initTheme(): ThemeMode {
  const mode = readStoredTheme();
  applyTheme(mode);
  return mode;
}

export function getTheme(): ThemeMode {
  return readStoredTheme();
}

export function toggleTheme(): ThemeMode {
  const next = readStoredTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function setTheme(mode: ThemeMode): void {
  applyTheme(mode);
}
