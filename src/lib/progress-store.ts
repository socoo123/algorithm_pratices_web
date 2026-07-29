import bundledProgress from '../data/progress.json';
import type { ProblemProgress, ProgressFile } from '../types';

export const STORAGE_KEY = 'sft-progress';

export function emptyProgressFile(): ProgressFile {
  return { version: 1, updatedAt: new Date().toISOString(), problems: {} };
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
  const bundled = bundledProgress as unknown as ProgressFile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return bundled;
    const local = JSON.parse(raw) as ProgressFile;
    if (local.version !== 1) return bundled;
    return mergeProgress(bundled, local);
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
