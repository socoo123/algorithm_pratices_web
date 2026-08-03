import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  countDirtyKeys,
  fetchServerProgress,
  loadInitialProgress,
  mergeProgress,
  migrateProgressKeys,
  persistToServer,
  saveToLocalStorage,
} from '../lib/progress-store';
import bundledProgress from '../data/progress.json';
import type { ProblemProgress, ProgressFile } from '../types';
import { progressKey } from '../types';

interface ProgressContextValue {
  progress: ProgressFile;
  bundled: ProgressFile;
  getProblemProgress: (bankId: string, slug: string) => ProblemProgress | undefined;
  setRound: (bankId: string, slug: string, roundIndex: number, checked: boolean) => void;
  setNote: (bankId: string, slug: string, note: string) => void;
  importProgress: (file: ProgressFile) => void;
  isRound1Done: (bankId: string, slug: string) => boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function upsert(
  file: ProgressFile,
  key: string,
  patch: Partial<ProblemProgress> & { rounds?: [boolean, boolean, boolean] },
): ProgressFile {
  const prev = file.problems[key];
  const rounds = patch.rounds ?? prev?.rounds ?? [false, false, false];
  const next: ProblemProgress = {
    rounds,
    note: patch.note !== undefined ? patch.note : prev?.note,
    updatedAt: new Date().toISOString(),
  };
  const hasContent = next.rounds.some(Boolean) || (next.note?.trim()?.length ?? 0) > 0;
  const problems = { ...file.problems };
  if (hasContent) problems[key] = next;
  else delete problems[key];
  return { version: 1, updatedAt: next.updatedAt, problems };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  // Baseline for the dirty banner: starts as the imported file, then tracks
  // whatever was last successfully written to src/data/progress.json (dev).
  const [bundled, setBundled] = useState<ProgressFile>(
    () => bundledProgress as unknown as ProgressFile,
  );
  const [progress, setProgress] = useState<ProgressFile>(() => loadInitialProgress());
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Vite caches the imported progress.json; sync baseline from the real file on disk.
  // If localStorage is ahead of the file, write it back so the dirty banner clears.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const disk = await fetchServerProgress();
      if (cancelled) return;
      if (disk) setBundled(disk);
      const baseline = disk ?? (bundledProgress as unknown as ProgressFile);
      const current = progressRef.current;
      if (countDirtyKeys(baseline, current) === 0) return;
      const ok = await persistToServer(current);
      if (!cancelled && ok) setBundled(current);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: ProgressFile) => {
    setProgress(next);
    progressRef.current = next;
    saveToLocalStorage(next);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void persistToServer(next).then((ok) => {
        if (ok) setBundled(next);
      });
    }, 400);
  }, []);

  const getProblemProgress = useCallback(
    (bankId: string, slug: string) => progress.problems[progressKey(bankId, slug)],
    [progress],
  );

  const setRound = useCallback(
    (bankId: string, slug: string, roundIndex: number, checked: boolean) => {
      const key = progressKey(bankId, slug);
      const prev = progressRef.current.problems[key];
      const rounds: [boolean, boolean, boolean] = [...(prev?.rounds ?? [false, false, false])] as [
        boolean,
        boolean,
        boolean,
      ];
      rounds[roundIndex] = checked;
      commit(upsert(progressRef.current, key, { rounds, note: prev?.note }));
    },
    [commit],
  );

  const setNote = useCallback(
    (bankId: string, slug: string, note: string) => {
      const key = progressKey(bankId, slug);
      const prev = progressRef.current.problems[key];
      const rounds = prev?.rounds ?? [false, false, false];
      commit(upsert(progressRef.current, key, { rounds, note }));
    },
    [commit],
  );

  const importProgress = useCallback(
    (file: ProgressFile) => {
      commit(mergeProgress(bundled, migrateProgressKeys(file)));
    },
    [bundled, commit],
  );

  const isRound1Done = useCallback(
    (bankId: string, slug: string) => {
      const p = progress.problems[progressKey(bankId, slug)];
      return Boolean(p?.rounds[0]);
    },
    [progress],
  );

  const value = useMemo(
    () => ({
      progress,
      bundled,
      getProblemProgress,
      setRound,
      setNote,
      importProgress,
      isRound1Done,
    }),
    [progress, bundled, getProblemProgress, setRound, setNote, importProgress, isRound1Done],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
