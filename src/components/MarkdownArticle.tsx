import { useEffect, useMemo, useState } from 'react';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { MermaidBlock } from './MermaidBlock';
import { copyText } from '../lib/format';

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
      dangerouslySetInnerHTML={{ __html: html }}
      onDoubleClick={(e) => {
        const pre = (e.target as HTMLElement).closest('pre');
        if (pre) void copyText(pre.textContent ?? '');
      }}
    />
  );
}

/** Shared markdown + mermaid renderer for solutions and CLRS articles. */
export function MarkdownArticle({ source }: { source: string }) {
  const segments = useMemo(() => splitMarkdown(source), [source]);

  return (
    <article className="prose-solution space-y-3 rounded-2xl border border-dracula-current/70 bg-dracula-bg-dark/50 p-6 backdrop-blur-xl">
      {segments.map((seg, i) =>
        seg.type === 'mermaid' ? (
          <MermaidBlock key={`m-${i}-${seg.content.slice(0, 24)}`} chart={seg.content} />
        ) : (
          <MarkdownChunk key={`t-${i}-${seg.content.length}`} source={seg.content} />
        ),
      )}
      <p className="pt-2 text-xs text-dracula-comment">提示：双击代码块可复制</p>
    </article>
  );
}
