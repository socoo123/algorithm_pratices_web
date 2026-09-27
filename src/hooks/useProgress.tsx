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
  clearStoredGithubToken,
  commitProgressToGithub,
  fetchRawProgress,
  getStoredGithubToken,
  setStoredGithubToken,
  verifyGithubToken,
} from '../lib/github-progress';
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

const GITHUB_PUSH_DELAY_MS = 2000;

export type GithubPhase = 'idle' | 'pending' | 'error';

interface ProgressContextValue {
  progress: ProgressFile;
  bundled: ProgressFile;
  getProblemProgress: (bankId: string, slug: string) => ProblemProgress | undefined;
  setRound: (bankId: string, slug: string, roundIndex: number, checked: boolean) => void;
  setNote: (bankId: string, slug: string, note: string) => void;
  importProgress: (file: ProgressFile) => void;
  isRound1Done: (bankId: string, slug: string) => boolean;
  /** Production only. Dev never talks to GitHub. */
  githubConnected: boolean;
  githubPhase: GithubPhase;
  githubMessage: string;
  connectGithub: (token: string) => Promise<{ ok: boolean; message: string }>;
  disconnectGithub: () => void;
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

function problemsEqual(a: ProgressFile, b: ProgressFile): boolean {
  return JSON.stringify(a.problems) === JSON.stringify(b.problems);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  // Baseline for the dirty banner: starts as the imported file, then tracks
  // whatever was last successfully written (dev file, or the last GitHub commit).
  const [bundled, setBundled] = useState<ProgressFile>(
    () => bundledProgress as unknown as ProgressFile,
  );
  const [progress, setProgress] = useState<ProgressFile>(() => loadInitialProgress());
  const [githubConnected, setGithubConnected] = useState(
    () => !import.meta.env.DEV && Boolean(getStoredGithubToken()),
  );
  const [githubPhase, setGithubPhase] = useState<GithubPhase>('idle');
  const [githubMessage, setGithubMessage] = useState('');
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushGen = useRef(0);
  const aliveRef = useRef(true);
  const progressRef = useRef(progress);
  const bundledRef = useRef(bundled);
  progressRef.current = progress;
  bundledRef.current = bundled;

  const scheduleGithubRef = useRef<(delay?: number) => void>(() => {});

  const applyMerged = (incoming: ProgressFile): ProgressFile => {
    const current = progressRef.current;
    const merged = migrateProgressKeys(mergeProgress(current, incoming));
    if (!problemsEqual(merged, current)) {
      progressRef.current = merged;
      setProgress(merged);
      saveToLocalStorage(merged);
    }
    return progressRef.current;
  };

  const flushGithub = async (gen: number) => {
    const token = getStoredGithubToken();
    if (!token || gen !== flushGen.current || !aliveRef.current) return;
    const snapshot = progressRef.current;
    const result = await commitProgressToGithub(snapshot, token);
    if (!aliveRef.current) return;
    if (!result.ok) {
      if (gen === flushGen.current) {
        setGithubPhase('error');
        setGithubMessage(result.message);
      }
      return;
    }
    const current = applyMerged(result.file);
    setBundled(result.file);
    bundledRef.current = result.file;
    if (gen !== flushGen.current) return;
    if (getStoredGithubToken() && countDirtyKeys(result.file, current) > 0) {
      scheduleGithubRef.current(GITHUB_PUSH_DELAY_MS);
      return;
    }
    setGithubPhase('idle');
    setGithubMessage('');
  };

  scheduleGithubRef.current = (delay = GITHUB_PUSH_DELAY_MS) => {
    if (import.meta.env.DEV || !getStoredGithubToken()) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    const gen = ++flushGen.current;
    setGithubPhase('pending');
    setGithubMessage('');
    persistTimer.current = setTimeout(() => {
      void flushGithub(gen);
    }, delay);
  };

  // Vite caches the imported progress.json; sync baseline from the real file on disk.
  // If localStorage is ahead of the file, write it back so the dirty banner clears.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
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

  // Pages: merge the raw file on open and when the window regains focus.
  useEffect(() => {
    if (import.meta.env.DEV) return;
    let cancelled = false;
    let pullGen = 0;
    const pull = async () => {
      const gen = ++pullGen;
      const remote = await fetchRawProgress();
      if (cancelled || gen !== pullGen) return;
      if (remote) {
        setBundled(remote);
        bundledRef.current = remote;
        applyMerged(remote);
      }
      if (getStoredGithubToken() && countDirtyKeys(bundledRef.current, progressRef.current) > 0) {
        scheduleGithubRef.current(GITHUB_PUSH_DELAY_MS);
      }
    };
    void pull();
    const onFocus = () => {
      void pull();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      flushGen.current += 1;
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, []);

  const commit = useCallback((next: ProgressFile) => {
    setProgress(next);
    progressRef.current = next;
    saveToLocalStorage(next);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    if (import.meta.env.DEV) {
      persistTimer.current = setTimeout(() => {
        void persistToServer(next).then((ok) => {
          if (ok) setBundled(next);
        });
      }, 400);
      return;
    }
    if (getStoredGithubToken()) scheduleGithubRef.current(GITHUB_PUSH_DELAY_MS);
  }, []);

  const connectGithub = useCallback(async (token: string) => {
    const result = await verifyGithubToken(token);
    if (!result.ok) return result;
    setStoredGithubToken(token);
    setGithubConnected(true);
    setGithubPhase('idle');
    setGithubMessage('');
    if (countDirtyKeys(bundledRef.current, progressRef.current) > 0) {
      scheduleGithubRef.current(GITHUB_PUSH_DELAY_MS);
    }
    return result;
  }, []);

  const disconnectGithub = useCallback(() => {
    clearStoredGithubToken();
    setGithubConnected(false);
    setGithubPhase('idle');
    setGithubMessage('');
    flushGen.current += 1;
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
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
      githubConnected,
      githubPhase,
      githubMessage,
      connectGithub,
      disconnectGithub,
    }),
    [
      progress,
      bundled,
      getProblemProgress,
      setRound,
      setNote,
      importProgress,
      isRound1Done,
      githubConnected,
      githubPhase,
      githubMessage,
      connectGithub,
      disconnectGithub,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
