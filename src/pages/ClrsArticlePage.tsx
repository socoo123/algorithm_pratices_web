import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MarkdownArticle } from '../components/MarkdownArticle';
import { getClrsChapter } from '../lib/clrs';
import { NotFoundPage } from './NotFoundPage';

const clrsLoaders = import.meta.env.DEV
  ? ({} as Record<string, () => Promise<string>>)
  : (import.meta.glob('../../content/clrs/**/*.md', {
      query: '?raw',
      import: 'default',
    }) as Record<string, () => Promise<string>>);

function resolveLoader(slug: string): (() => Promise<string>) | undefined {
  const key = `../../content/clrs/${slug}.md`;
  if (clrsLoaders[key]) return clrsLoaders[key];
  const hit = Object.entries(clrsLoaders).find(([k]) => k.endsWith(`/content/clrs/${slug}.md`));
  return hit?.[1];
}

async function loadClrsMd(slug: string): Promise<string | null> {
  if (import.meta.env.DEV) {
    const res = await fetch(`/api/clrs/${slug}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`加载章节失败：${res.status}`);
    return res.text();
  }
  const loader = resolveLoader(slug);
  if (!loader) return null;
  return loader();
}

export function ClrsArticlePage() {
  const { slug = '' } = useParams();
  const chapter = getClrsChapter(slug);
  const [md, setMd] = useState<string | null | undefined>(undefined);
  const [loadedSlug, setLoadedSlug] = useState('');
  const [fetchGen, setFetchGen] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!chapter?.hasContent) {
      setMd(null);
      setLoadedSlug(slug);
      return;
    }
    void loadClrsMd(slug)
      .then((text) => {
        if (cancelled) return;
        setMd(text);
        setLoadedSlug(slug);
      })
      .catch(() => {
        if (cancelled) return;
        setMd(null);
        setLoadedSlug(slug);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, chapter?.hasContent, fetchGen]);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const onUpdate = (data: { path?: string }) => {
      const p = (data.path ?? '').replace(/\\/g, '/');
      if (p === `content/clrs/${slug}.md`) {
        setFetchGen((g) => g + 1);
      }
    };
    hot.on('clrs-md-update', onUpdate);
    return () => {
      hot.off('clrs-md-update', onUpdate);
    };
  }, [slug]);

  if (!chapter) return <NotFoundPage message="章节不存在" />;

  if (!chapter.hasContent) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-dracula-fg">
          Ch.{chapter.number} {chapter.title}
        </h1>
        <p className="mt-3 text-dracula-comment">本章正文尚未生成（待写）。</p>
        <Link to="/clrs" className="mt-6 inline-block text-dracula-cyan hover:underline">
          返回大纲
        </Link>
      </main>
    );
  }

  if (loadedSlug !== slug || md === undefined) {
    return <main className="px-4 py-16 text-center text-dracula-comment">排版中…</main>;
  }

  if (md === null) {
    return (
      <NotFoundPage
        message={`正文文件未找到（content/clrs/${slug}.md）。索引已标记有内容，请补文件或把 hasContent 改回 false。`}
      />
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-mono text-xs text-dracula-comment">Chapter {chapter.number}</p>
        <h1 className="mt-1 text-2xl font-semibold text-dracula-fg">{chapter.title}</h1>
      </div>
      <MarkdownArticle source={md} />
    </main>
  );
}
