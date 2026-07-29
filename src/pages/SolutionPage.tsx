import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { MermaidBlock } from '../components/MermaidBlock';
import { getBankFile } from '../lib/banks';
import { copyText } from '../lib/format';
import { NotFoundPage } from './NotFoundPage';

const solutionModules = import.meta.glob('../../solutions/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function getSolutionMarkdown(bankId: string, slug: string): string | undefined {
  const key = `../../solutions/${bankId}/${slug}.md`;
  if (solutionModules[key]) return solutionModules[key];
  const hit = Object.entries(solutionModules).find(([k]) =>
    k.endsWith(`/solutions/${bankId}/${slug}.md`),
  );
  return hit?.[1];
}

type Segment = { type: 'md' | 'mermaid'; content: string };

function splitMarkdown(source: string): Segment[] {
  const parts = source.split(/```mermaid\n([\s\S]*?)```/g);
  const segments: Segment[] = [];
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (!chunk) continue;
    if (i % 2 === 1) segments.push({ type: 'mermaid', content: chunk.trim() });
    else segments.push({ type: 'md', content: chunk });
  }
  return segments;
}

async function markdownToHtml(source: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypePrettyCode, {
      theme: 'dracula',
      keepBackground: true,
      defaultLang: 'java',
    })
    .use(rehypeStringify)
    .process(source);
  return String(file);
}

function MarkdownChunk({ source }: { source: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setError(null);
    void markdownToHtml(source)
      .then((out) => {
        if (!cancelled) setHtml(out);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return <pre className="whitespace-pre-wrap text-sm text-dracula-red">渲染失败：{error}</pre>;
  }
  if (html === null) {
    return <p className="text-sm text-dracula-comment">排版中…</p>;
  }

  return (
    <div
      className="markdown-html"
      // Local trusted tutorial markdown only
      dangerouslySetInnerHTML={{ __html: html }}
      onDoubleClick={(e) => {
        const pre = (e.target as HTMLElement).closest('pre');
        if (pre) void copyText(pre.textContent ?? '');
      }}
    />
  );
}

export function SolutionPage() {
  const { bankId = '', slug = '' } = useParams();
  const bankFile = getBankFile(bankId);
  const problem = bankFile?.problems.find((p) => p.slug === slug);
  const md = useMemo(() => getSolutionMarkdown(bankId, slug), [bankId, slug]);
  const segments = useMemo(() => (md ? splitMarkdown(md) : []), [md]);

  if (!bankFile || !problem) return <NotFoundPage message="题目不存在" />;
  if (!md) {
    return (
      <NotFoundPage
        message={`题解文件未找到（solutions/${bankId}/${slug}.md）。已加载 ${Object.keys(solutionModules).length} 个题解。`}
      />
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to={`/bank/${bankId}/${problem.categoryId}`}
          className="text-sm text-dracula-cyan hover:text-dracula-pink"
        >
          ← 返回{bankFile.categories.find((c) => c.id === problem.categoryId)?.name ?? '题库'}
        </Link>
        <a
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-dracula-comment hover:text-dracula-fg"
        >
          去 LC 做题
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-dracula-fg">
        #{problem.number} {problem.title}
      </h1>
      <article className="prose-solution space-y-3 rounded-2xl border border-dracula-current/70 bg-dracula-bg-dark/50 p-6 backdrop-blur-xl">
        {segments.map((seg, i) =>
          seg.type === 'mermaid' ? (
            <MermaidBlock key={i} chart={seg.content} />
          ) : (
            <MarkdownChunk key={i} source={seg.content} />
          ),
        )}
        <p className="pt-2 text-xs text-dracula-comment">提示：双击代码块可复制</p>
      </article>
    </main>
  );
}
