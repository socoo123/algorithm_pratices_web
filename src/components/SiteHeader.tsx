import { ChevronRight, Download, Moon, Sun, Upload } from 'lucide-react';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { countDirtyKeys, downloadProgress, parseImportedProgress } from '../lib/progress-store';
import { useProgress } from '../hooks/useProgress';
import { useTheme } from '../hooks/useTheme';
import { useRef } from 'react';
import { getBankFile } from '../lib/banks';
import { getClrsChapter, getClrsIndex } from '../lib/clrs';
import { getEssay, getEssayIndex } from '../lib/essays';

type Crumb = { label: string; to?: string };

function useBreadcrumbs(): Crumb[] {
  const loc = useLocation();
  const bankMatch = useMatch({ path: '/bank/:bankId/*', end: false });
  const solutionMatch = useMatch('/bank/:bankId/solution/:slug');
  const categoryMatch = useMatch('/bank/:bankId/:categoryId');
  const clrsIndexMatch = useMatch('/clrs');
  const clrsArticleMatch = useMatch('/clrs/:slug');
  const essaysIndexMatch = useMatch('/essays');
  const essaysArticleMatch = useMatch('/essays/:slug');

  if (loc.pathname === '/') return [];

  const crumbs: Crumb[] = [{ label: '首页', to: '/' }];

  if (clrsIndexMatch || clrsArticleMatch) {
    const clrs = getClrsIndex();
    crumbs.push({ label: clrs.title, to: '/clrs' });
    if (clrsArticleMatch?.params.slug) {
      const ch = getClrsChapter(clrsArticleMatch.params.slug);
      crumbs.push({
        label: ch ? `Ch.${ch.number} ${ch.title}` : '章节',
      });
    }
    return crumbs;
  }

  if (essaysIndexMatch || essaysArticleMatch) {
    const essays = getEssayIndex();
    crumbs.push({ label: essays.title, to: '/essays' });
    if (essaysArticleMatch?.params.slug) {
      const article = getEssay(essaysArticleMatch.params.slug);
      crumbs.push({
        label: article?.title ?? '解析',
      });
    }
    return crumbs;
  }

  const bankId = bankMatch?.params.bankId;
  const bankFile = bankId ? getBankFile(bankId) : undefined;

  if (!bankId || !bankFile) {
    crumbs.push({ label: '页面' });
    return crumbs;
  }

  crumbs.push({ label: bankFile.bank.name, to: `/bank/${bankId}` });

  if (solutionMatch) {
    const problem = bankFile.problems.find((p) => p.slug === solutionMatch.params.slug);
    const category = problem
      ? bankFile.categories.find((c) => c.id === problem.categoryId)
      : undefined;
    if (category) {
      crumbs.push({
        label: category.name,
        to: `/bank/${bankId}/${category.id}`,
      });
    }
    crumbs.push({
      label: problem ? `#${problem.number} ${problem.title}` : '题解',
    });
    return crumbs;
  }

  if (categoryMatch) {
    const category = bankFile.categories.find((c) => c.id === categoryMatch.params.categoryId);
    crumbs.push({ label: category?.name ?? categoryMatch.params.categoryId ?? '分类' });
  }

  return crumbs;
}

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  const { progress, bundled, importProgress } = useProgress();
  const { theme, setTheme } = useTheme();
  const dirty = countDirtyKeys(bundled, progress);
  const fileRef = useRef<HTMLInputElement>(null);
  const crumbs = useBreadcrumbs();

  return (
    <header className="sticky top-0 z-50 border-b border-dracula-current/80 bg-dracula-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-baseline gap-2">
          <Link
            to="/"
            className="bg-gradient-to-r from-dracula-purple to-dracula-cyan bg-clip-text text-lg font-semibold tracking-tight text-transparent sm:text-xl"
          >
            算法刷题进行时
          </Link>
          {subtitle && (
            <>
              <span className="text-dracula-comment">·</span>
              <span className="truncate text-sm text-dracula-comment">{subtitle}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty > 0 && (
            <span
              className="hidden text-xs text-dracula-orange sm:inline"
              title="浏览器进度与仓库里的 progress.json 不一致。用 npm run dev 勾选会自动写回文件，然后 git commit 该文件即可。"
            >
              有 {dirty} 题进度未写入 progress.json
            </span>
          )}
          <div
            className="inline-flex items-center rounded-lg border border-dracula-current bg-dracula-bg-dark p-0.5"
            role="group"
            aria-label="主题切换"
          >
            <button
              type="button"
              title="护眼米色"
              aria-pressed={theme === 'parchment'}
              onClick={() => setTheme('parchment')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                theme === 'parchment'
                  ? 'bg-dracula-purple/20 text-dracula-purple'
                  : 'text-dracula-comment hover:text-dracula-fg'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">护眼</span>
            </button>
            <button
              type="button"
              title="德古拉深色"
              aria-pressed={theme === 'dracula'}
              onClick={() => setTheme('dracula')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                theme === 'dracula'
                  ? 'bg-dracula-purple/25 text-dracula-purple'
                  : 'text-dracula-comment hover:text-dracula-fg'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">德古拉</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => downloadProgress(progress)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dracula-current bg-dracula-bg-dark px-3 py-1.5 text-xs text-dracula-fg transition hover:border-dracula-purple/50 hover:bg-dracula-current/40"
          >
            <Download className="h-3.5 w-3.5" />
            导出进度
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dracula-current bg-dracula-bg-dark px-3 py-1.5 text-xs text-dracula-fg transition hover:border-dracula-purple/50 hover:bg-dracula-current/40"
          >
            <Upload className="h-3.5 w-3.5" />
            导入进度
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const text = await f.text();
                importProgress(parseImportedProgress(text));
              } catch {
                alert('无效的 progress.json');
              }
              e.target.value = '';
            }}
          />
        </div>
      </div>
      {crumbs.length > 0 && (
        <nav
          aria-label="面包屑"
          className="mx-auto max-w-[1600px] px-4 pb-2.5 sm:px-6"
        >
          <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-xs">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
                  {i > 0 && (
                    <ChevronRight
                      className="h-3 w-3 shrink-0 text-dracula-comment/60"
                      aria-hidden
                    />
                  )}
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="shrink-0 text-dracula-cyan/90 transition hover:text-dracula-cyan"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={`min-w-0 truncate ${
                        isLast ? 'font-medium text-dracula-fg' : 'text-dracula-comment'
                      }`}
                      aria-current={isLast ? 'page' : undefined}
                      title={crumb.label}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </header>
  );
}
