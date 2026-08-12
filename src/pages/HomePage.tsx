import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { useProgress } from '../hooks/useProgress';
import { getBankFile, getBanksIndex } from '../lib/banks';
import { countClrsReady, getClrsIndex } from '../lib/clrs';

export function HomePage() {
  const { isRound1Done } = useProgress();
  const index = getBanksIndex();
  const clrs = getClrsIndex();
  const { ready: clrsReady, total: clrsTotal } = countClrsReady();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-12 text-center">
        <h1 className="bg-gradient-to-r from-dracula-purple via-dracula-cyan to-dracula-pink bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          算法刷题进行时
        </h1>
        <p className="mt-4 text-dracula-comment">表格化打卡 · 进度随仓库走 · AI 题解可挂链</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-dracula-comment">
          题库
        </h2>
        <div className="grid gap-4">
          {index.banks.map((bank) => {
            const file = getBankFile(bank.id);
            const done =
              file?.problems.filter((p) => isRound1Done(p.bankId, p.slug)).length ?? 0;
            const total = bank.totalCount;
            return (
              <Link
                key={bank.id}
                to={`/bank/${bank.id}`}
                className="bank-card group rounded-2xl border border-dracula-current bg-dracula-bg-dark/70 p-6 shadow-[0_8px_30px_-18px_rgba(47,43,38,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-dracula-purple/45"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-dracula-fg">{bank.name}</h3>
                    <p className="mt-2 text-sm text-dracula-comment">{bank.description}</p>
                    <p className="mt-3 font-mono text-xs text-dracula-comment">
                      {done}/{total} 题（第 1 遍完成）
                    </p>
                    <div className="mt-2 max-w-md">
                      <ProgressBar value={done} max={total} />
                    </div>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dracula-purple/12 text-dracula-purple transition group-hover:bg-dracula-cyan/15 group-hover:text-dracula-cyan">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-dracula-comment">
          体系化阅读
        </h2>
        <Link
          to="/clrs"
          className="bank-card group flex items-start justify-between gap-4 rounded-2xl border border-dracula-current bg-dracula-bg-dark/70 p-6 shadow-[0_8px_30px_-18px_rgba(47,43,38,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-dracula-cyan/45"
        >
          <div>
            <h3 className="text-xl font-semibold text-dracula-fg">{clrs.title}</h3>
            <p className="mt-2 text-sm text-dracula-comment">{clrs.subtitle}</p>
            <p className="mt-3 font-mono text-xs text-dracula-comment">
              已写 {clrsReady}/{clrsTotal} 章
            </p>
            <div className="mt-2 max-w-md">
              <ProgressBar value={clrsReady} max={clrsTotal} />
            </div>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dracula-cyan/12 text-dracula-cyan transition group-hover:bg-dracula-purple/15 group-hover:text-dracula-purple">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      </section>
    </main>
  );
}
