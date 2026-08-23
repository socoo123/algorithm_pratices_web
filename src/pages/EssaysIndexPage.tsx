import { Link } from 'react-router-dom';
import { countEssaysReady, getEssayIndex, getEssays } from '../lib/essays';

export function EssaysIndexPage() {
  const index = getEssayIndex();
  const articles = getEssays();
  const { ready, total } = countEssaysReady();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-dracula-fg">{index.title}</h1>
        <p className="mt-2 text-dracula-comment">{index.subtitle}</p>
        <p className="mt-3 font-mono text-xs text-dracula-comment">
          已写 {ready}/{total} 篇 · 想到再补，未就绪显示「待写」
        </p>
      </header>

      <ul className="divide-y divide-dracula-current/60 overflow-hidden rounded-2xl border border-dracula-current/70 bg-dracula-bg-dark/50">
        {articles.map((article) => (
          <li key={article.slug}>
            {article.hasContent ? (
              <Link
                to={`/essays/${article.slug}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-dracula-current/30"
              >
                <span className="min-w-0">
                  <span className="text-dracula-fg">{article.title}</span>
                  {article.hint ? (
                    <span className="mt-0.5 block text-xs text-dracula-comment">{article.hint}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-dracula-cyan">阅读</span>
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3 px-4 py-3 opacity-55">
                <span className="min-w-0">
                  <span className="text-dracula-comment">{article.title}</span>
                  {article.hint ? (
                    <span className="mt-0.5 block text-xs text-dracula-comment">{article.hint}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-dracula-comment">待写</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
