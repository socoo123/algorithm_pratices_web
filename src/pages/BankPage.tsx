import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CategorySidebar } from '../components/CategorySidebar';
import { Collapsible } from '../components/Collapsible';
import { ProblemTable } from '../components/ProblemTable';
import { ProgressBar } from '../components/ProgressBar';
import { useProgress } from '../hooks/useProgress';
import { getBankFile } from '../lib/banks';
import { NotFoundPage } from './NotFoundPage';

/** /bank/:bankId → redirect to first category tab */
export function BankIndexRedirect() {
  const { bankId = '' } = useParams();
  const bankFile = getBankFile(bankId);
  if (!bankFile) return <NotFoundPage />;
  const first = bankFile.categories[0]?.id;
  if (!first) return <NotFoundPage message="题库没有分类" />;
  return <Navigate to={`/bank/${bankId}/${first}`} replace />;
}

export function BankPage() {
  const { bankId = '', categoryId = '' } = useParams();
  const bankFile = getBankFile(bankId);
  const { isRound1Done } = useProgress();

  const categoryExists = Boolean(bankFile?.categories.some((c) => c.id === categoryId));
  const activeCategoryId = categoryExists ? categoryId : (bankFile?.categories[0]?.id ?? '');

  const categoryProblems = useMemo(() => {
    if (!bankFile) return [];
    return bankFile.problems.filter((p) => p.categoryId === activeCategoryId);
  }, [bankFile, activeCategoryId]);

  const category = bankFile?.categories.find((c) => c.id === activeCategoryId);

  if (!bankFile) return <NotFoundPage />;

  if (!categoryExists) {
    const first = bankFile.categories[0]?.id;
    if (!first) return <NotFoundPage message="题库没有分类" />;
    return <Navigate to={`/bank/${bankId}/${first}`} replace />;
  }

  const doneAll = bankFile.problems.filter((p) => isRound1Done(p.bankId, p.slug)).length;
  const catDone = categoryProblems.filter((p) => isRound1Done(p.bankId, p.slug)).length;

  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:py-6">
      <aside className="w-full shrink-0 rounded-2xl border border-dracula-current/70 bg-dracula-bg-dark/50 backdrop-blur-xl lg:w-56 xl:w-64">
        <div className="border-b border-dracula-current/70 p-4">
          <h2 className="text-sm font-semibold text-dracula-fg">{bankFile.bank.name}</h2>
          <p className="mt-1 font-mono text-xs text-dracula-comment">
            总进度 {doneAll}/{bankFile.bank.totalCount}
          </p>
          <div className="mt-2">
            <ProgressBar value={doneAll} max={bankFile.bank.totalCount} />
          </div>
        </div>
        <CategorySidebar
          bankId={bankId}
          categories={bankFile.categories}
          problems={bankFile.problems}
          activeId={activeCategoryId}
        />
      </aside>

      <section className="min-w-0 flex-1 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-dracula-fg">
            {category?.name}{' '}
            <span className="font-normal text-dracula-comment">
              ({catDone}/{categoryProblems.length})
            </span>
          </h1>
        </div>

        <ProblemTable problems={categoryProblems} bankId={bankId} />

        {category && (
          <div className="space-y-3 pt-2">
            <Collapsible title="刷题建议">
              <div className="whitespace-pre-wrap leading-relaxed">{category.intro}</div>
            </Collapsible>
            <Collapsible title="面试高频提示">
              <ul className="list-disc space-y-1 pl-5">
                {category.interviewTips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Collapsible>
            <Collapsible title="Day 1–14 刷题计划">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-dracula-comment">
                      <th className="pb-2 pr-4">天数</th>
                      <th className="pb-2 pr-4">任务</th>
                      <th className="pb-2">题数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankFile.dayPlan.map((d) => (
                      <tr key={d.day} className="border-t border-dracula-current/40">
                        <td className="py-2 pr-4 font-mono text-dracula-cyan">Day {d.day}</td>
                        <td className="py-2 pr-4 text-dracula-fg">{d.task}</td>
                        <td className="py-2 font-mono text-dracula-comment">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Collapsible>
          </div>
        )}
      </section>
    </main>
  );
}
