import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MarkdownArticle } from '../components/MarkdownArticle';
import { getBankFile } from '../lib/banks';
import { NotFoundPage } from './NotFoundPage';

/** Production bundle only — avoided in DEV so Vite won't page-reload on solutions/*.md touches. */
const solutionLoaders = import.meta.env.DEV
  ? ({} as Record<string, () => Promise<string>>)
  : (import.meta.glob('../../solutions/**/*.md', {
      query: '?raw',
      import: 'default',
    }) as Record<string, () => Promise<string>>);

function resolveLoader(bankId: string, slug: string): (() => Promise<string>) | undefined {
  const key = `../../solutions/${bankId}/${slug}.md`;
  if (solutionLoaders[key]) return solutionLoaders[key];
  const hit = Object.entries(solutionLoaders).find(([k]) =>
    k.endsWith(`/solutions/${bankId}/${slug}.md`),
  );
  return hit?.[1];
}

async function loadSolutionMd(bankId: string, slug: string): Promise<string | null> {
  if (import.meta.env.DEV) {
    const res = await fetch(`/api/solution/${bankId}/${slug}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`加载题解失败：${res.status}`);
    return res.text();
  }
  const loader = resolveLoader(bankId, slug);
  if (!loader) return null;
  return loader();
}

export function SolutionPage() {
  const { bankId = '', slug = '' } = useParams();
  const bankFile = getBankFile(bankId);
  const problem = bankFile?.problems.find((p) => p.slug === slug);
  const routeKey = `${bankId}/${slug}`;
  const [md, setMd] = useState<string | null | undefined>(undefined);
  const [loadedKey, setLoadedKey] = useState('');
  const [fetchGen, setFetchGen] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void loadSolutionMd(bankId, slug)
      .then((text) => {
        if (cancelled) return;
        setMd(text);
        setLoadedKey(routeKey);
      })
      .catch(() => {
        if (cancelled) return;
        setMd(null);
        setLoadedKey(routeKey);
      });
    return () => {
      cancelled = true;
    };
  }, [bankId, slug, routeKey, fetchGen]);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const onUpdate = (data: { path?: string }) => {
      const p = (data.path ?? '').replace(/\\/g, '/');
      if (p === `solutions/${bankId}/${slug}.md`) {
        setFetchGen((g) => g + 1);
      }
    };
    hot.on('solutions-md-update', onUpdate);
    return () => {
      hot.off('solutions-md-update', onUpdate);
    };
  }, [bankId, slug]);

  if (!bankFile || !problem) return <NotFoundPage message="题目不存在" />;
  if (loadedKey !== routeKey || md === undefined) {
    return <main className="px-4 py-16 text-center text-dracula-comment">排版中…</main>;
  }
  if (md === null) {
    return (
      <NotFoundPage message={`题解文件未找到（solutions/${bankId}/${slug}.md）。`} />
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-dracula-fg">
          #{problem.number} {problem.title}
        </h1>
        <a
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-dracula-comment hover:text-dracula-fg"
        >
          去 LC 做题
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <MarkdownArticle source={md} />
    </main>
  );
}
