import { Link } from 'react-router-dom';
import {
  getClrsChaptersByPart,
  getClrsIndex,
  getClrsParts,
  countClrsReady,
} from '../lib/clrs';

export function ClrsIndexPage() {
  const index = getClrsIndex();
  const parts = getClrsParts();
  const { ready, total } = countClrsReady();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-dracula-fg">{index.title}</h1>
        <p className="mt-2 text-dracula-comment">{index.subtitle}</p>
        <p className="mt-3 font-mono text-xs text-dracula-comment">
          已写 {ready}/{total} 章 · 未就绪显示「待写」，点名后再生成正文
        </p>
      </header>

      <div className="space-y-10">
        {parts.map((part) => {
          const chapters = getClrsChaptersByPart(part.id);
          return (
            <section key={part.id}>
              <h2 className="mb-3 text-lg font-semibold text-dracula-fg">
                <span className="text-dracula-purple">Part {part.roman}</span>
                <span className="mx-2 text-dracula-comment">·</span>
                {part.name}
              </h2>
              <ul className="divide-y divide-dracula-current/60 overflow-hidden rounded-2xl border border-dracula-current/70 bg-dracula-bg-dark/50">
                {chapters.map((ch) => (
                  <li key={ch.slug}>
                    {ch.hasContent ? (
                      <Link
                        to={`/clrs/${ch.slug}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-dracula-current/30"
                      >
                        <span className="min-w-0">
                          <span className="font-mono text-xs text-dracula-comment">
                            Ch.{ch.number}
                          </span>
                          <span className="ml-2 text-dracula-fg">{ch.title}</span>
                        </span>
                        <span className="shrink-0 text-xs text-dracula-cyan">阅读</span>
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between gap-3 px-4 py-3 opacity-55">
                        <span className="min-w-0">
                          <span className="font-mono text-xs text-dracula-comment">
                            Ch.{ch.number}
                          </span>
                          <span className="ml-2 text-dracula-comment">{ch.title}</span>
                        </span>
                        <span className="shrink-0 text-xs text-dracula-comment">待写</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
