export type ThemeId = 'parchment' | 'dracula';

export const THEME_STORAGE_KEY = 'sft-theme';
export const DEFAULT_THEME: ThemeId = 'parchment';

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'parchment' || value === 'dracula';
}

export function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(raw)) return raw;
  } catch {
    // ignore
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function persistTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
  applyTheme(theme);
}
