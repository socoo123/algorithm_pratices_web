import bundledProgress from '../data/progress.json';
import type { ProblemProgress, ProgressFile } from '../types';

export const STORAGE_KEY = 'sft-progress';

/** Old bankId → current bankId (keeps progress after renames). */
const BANK_ID_ALIASES: Record<string, string> = {
  coupang: 'base',
};

export function emptyProgressFile(): ProgressFile {
  return { version: 1, updatedAt: new Date().toISOString(), problems: {} };
}

/** Remap progress keys like `coupang/slug` → `base/slug`, merging conflicts by updatedAt. */
export function migrateProgressKeys(file: ProgressFile): ProgressFile {
  const problems: Record<string, ProblemProgress> = {};
  let changed = false;
  for (const [key, value] of Object.entries(file.problems)) {
    const slash = key.indexOf('/');
    if (slash === -1) {
      problems[key] = value;
      continue;
    }
    const bankId = key.slice(0, slash);
    const rest = key.slice(slash + 1);
    const mapped = BANK_ID_ALIASES[bankId];
    const nextKey = mapped ? `${mapped}/${rest}` : key;
    if (nextKey !== key) changed = true;
    const existing = problems[nextKey];
    if (!existing || Date.parse(value.updatedAt) >= Date.parse(existing.updatedAt)) {
      problems[nextKey] = value;
    }
  }
  if (!changed) return file;
  return { ...file, problems };
}

export function mergeProgress(a: ProgressFile, b: ProgressFile): ProgressFile {
  const problems: Record<string, ProblemProgress> = { ...a.problems };
  for (const [key, pb] of Object.entries(b.problems)) {
    const pa = problems[key];
    if (!pa) {
      problems[key] = pb;
      continue;
    }
    const ta = Date.parse(pa.updatedAt);
    const tb = Date.parse(pb.updatedAt);
    problems[key] = tb >= ta ? pb : pa;
  }
  const updatedAt = Object.values(problems).reduce(
    (max, p) => Math.max(max, Date.parse(p.updatedAt)),
    Math.max(Date.parse(a.updatedAt), Date.parse(b.updatedAt)),
  );
  return {
    version: 1,
    updatedAt: Number.isFinite(updatedAt) ? new Date(updatedAt).toISOString() : new Date().toISOString(),
    problems,
  };
}

export function loadInitialProgress(): ProgressFile {
  const bundled = migrateProgressKeys(bundledProgress as unknown as ProgressFile);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return bundled;
    const local = JSON.parse(raw) as ProgressFile;
    if (local.version !== 1) return bundled;
    const migratedLocal = migrateProgressKeys(local);
    const merged = migrateProgressKeys(mergeProgress(bundled, migratedLocal));
    const needsRewrite =
      migratedLocal !== local ||
      Object.keys(local.problems).some((k) => k.startsWith('coupang/'));
    if (needsRewrite) {
      saveToLocalStorage(merged);
      void persistToServer(merged);
    }
    return merged;
  } catch {
    return bundled;
  }
}

export function saveToLocalStorage(file: ProgressFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
}

export async function persistToServer(file: ProgressFile): Promise<void> {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file),
    });
  } catch {
    // preview / static — ignore
  }
}

export function downloadProgress(file: ProgressFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportedProgress(raw: string): ProgressFile {
  const data = JSON.parse(raw) as ProgressFile;
  if (data.version !== 1 || typeof data.problems !== 'object') {
    throw new Error('invalid progress file');
  }
  return data;
}

export function countDirtyKeys(bundled: ProgressFile, current: ProgressFile): number {
  let n = 0;
  const keys = new Set([...Object.keys(bundled.problems), ...Object.keys(current.problems)]);
  for (const key of keys) {
    const a = bundled.problems[key];
    const b = current.problems[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) n += 1;
  }
  return n;
}
