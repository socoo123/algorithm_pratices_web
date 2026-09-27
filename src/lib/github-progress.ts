import { countDirtyKeys, mergeProgress, migrateProgressKeys } from './progress-store';
import type { ProgressFile } from '../types';

/** localStorage key. Never write this value into the repo, logs, or error text. */
export const GITHUB_TOKEN_STORAGE_KEY = 'sft-github-token';

const REPO = 'socoo123/algorithm_pratices_web';
const BRANCH = 'main';
const PROGRESS_PATH = 'src/data/progress.json';

export const GITHUB_CONTENTS_URL = `https://api.github.com/repos/${REPO}/contents/${PROGRESS_PATH}`;
export const GITHUB_RAW_PROGRESS_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${PROGRESS_PATH}`;

const COMMIT_MESSAGE = '刷题进度更新';

export function getStoredGithubToken(): string | null {
  try {
    const value = localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY)?.trim();
    return value ? value : null;
  } catch {
    return null;
  }
}

export function setStoredGithubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token.trim());
}

export function clearStoredGithubToken(): void {
  localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
}

export function isProgressFile(data: unknown): data is ProgressFile {
  if (!data || typeof data !== 'object') return false;
  const file = data as Partial<ProgressFile>;
  return (
    file.version === 1 &&
    !!file.problems &&
    typeof file.problems === 'object' &&
    !Array.isArray(file.problems)
  );
}

export function encodeProgressJson(file: ProgressFile): string {
  const json = `${JSON.stringify(file, null, 2)}\n`;
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** GitHub Contents API wraps base64 at 60 columns. Whitespace is ignored. */
export function decodeGithubContent(content: string): string {
  const binary = atob(content.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function buildProgressPutBody(file: ProgressFile, sha: string): {
  message: string;
  content: string;
  sha: string;
  branch: 'main';
} {
  return {
    message: COMMIT_MESSAGE,
    content: encodeProgressJson(file),
    sha,
    branch: 'main',
  };
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function httpError(status: number): string {
  if (status === 401) return '令牌无效或已过期';
  if (status === 403) return '令牌没有这个仓库的 Contents 权限，或触发了频率限制';
  if (status === 404) return '找不到仓库里的 progress.json';
  if (status === 409) return '远端进度已变化，合并后仍未提交成功';
  if (status === 0) return '网络错误，没有提交到 GitHub';
  return `提交失败（HTTP ${status}）`;
}

interface RemoteProgress {
  sha: string;
  file: ProgressFile;
}

async function readRemote(token: string): Promise<{ ok: true; remote: RemoteProgress } | { ok: false; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${GITHUB_CONTENTS_URL}?ref=${BRANCH}`, {
      headers: githubHeaders(token),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, message: httpError(0) };
  }
  if (!res.ok) return { ok: false, message: httpError(res.status) };
  let payload: { sha?: string; content?: string };
  try {
    payload = (await res.json()) as { sha?: string; content?: string };
  } catch {
    return { ok: false, message: 'GitHub 返回的进度文件无法解析' };
  }
  if (!payload.sha || !payload.content) {
    return { ok: false, message: 'GitHub 返回的进度文件缺少内容' };
  }
  try {
    const data: unknown = JSON.parse(decodeGithubContent(payload.content));
    if (!isProgressFile(data)) return { ok: false, message: '远端 progress.json 格式不对' };
    return { ok: true, remote: { sha: payload.sha, file: migrateProgressKeys(data) } };
  } catch {
    return { ok: false, message: '远端 progress.json 无法解码' };
  }
}

async function putProgress(
  token: string,
  file: ProgressFile,
  sha: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  let res: Response;
  try {
    res = await fetch(GITHUB_CONTENTS_URL, {
      method: 'PUT',
      headers: {
        ...githubHeaders(token),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(buildProgressPutBody(file, sha)),
    });
  } catch {
    return { ok: false, status: 0, message: httpError(0) };
  }
  if (!res.ok) return { ok: false, status: res.status, message: httpError(res.status) };
  return { ok: true };
}

/** GET the contents API. Does not commit. */
export async function verifyGithubToken(token: string): Promise<{ ok: boolean; message: string }> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, message: '请粘贴令牌' };
  const remote = await readRemote(trimmed);
  if (!remote.ok) return remote;
  return { ok: true, message: '令牌有效，可以提交进度' };
}

/**
 * GET current sha, merge by updatedAt, PUT once.
 * On 409, GET + merge + PUT one more time, then stop.
 */
export async function commitProgressToGithub(
  local: ProgressFile,
  token: string,
): Promise<{ ok: true; file: ProgressFile } | { ok: false; message: string }> {
  const first = await readRemote(token);
  if (!first.ok) return first;
  const localFile = migrateProgressKeys(local);
  let merged = mergeProgress(first.remote.file, localFile);
  if (countDirtyKeys(first.remote.file, merged) === 0) {
    return { ok: true, file: merged };
  }
  let put = await putProgress(token, merged, first.remote.sha);
  if (!put.ok && put.status === 409) {
    const second = await readRemote(token);
    if (!second.ok) return second;
    merged = mergeProgress(second.remote.file, localFile);
    if (countDirtyKeys(second.remote.file, merged) === 0) {
      return { ok: true, file: merged };
    }
    put = await putProgress(token, merged, second.remote.sha);
  }
  if (!put.ok) return { ok: false, message: put.message };
  return { ok: true, file: merged };
}

/** Unauthenticated read for startup / focus merge. Cache-busted. */
export async function fetchRawProgress(): Promise<ProgressFile | null> {
  try {
    const res = await fetch(`${GITHUB_RAW_PROGRESS_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!isProgressFile(data)) return null;
    return migrateProgressKeys(data);
  } catch {
    return null;
  }
}
