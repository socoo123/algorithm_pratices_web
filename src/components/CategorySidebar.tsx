import { Check } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { Category, Problem } from '../types';
import { ProgressBar } from './ProgressBar';
import { useProgress } from '../hooks/useProgress';

export function CategorySidebar({
  bankId,
  categories,
  problems,
  activeId,
}: {
  bankId: string;
  categories: Category[];
  problems: Problem[];
  activeId: string;
}) {
  const { isRound1Done } = useProgress();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {categories.map((cat) => {
        const catProblems = problems.filter((p) => p.categoryId === cat.id);
        const done = catProblems.filter((p) => isRound1Done(p.bankId, p.slug)).length;
        const total = catProblems.length;
        const complete = done === total && total > 0;
        const active = cat.id === activeId;
        return (
          <NavLink
            key={cat.id}
            to={`/bank/${bankId}/${cat.id}`}
            className={`group rounded-xl border px-3 py-2.5 text-left transition hover:translate-x-0.5 ${
              active
                ? 'border-dracula-purple/50 bg-dracula-purple/10'
                : 'border-transparent bg-dracula-bg-dark/40 hover:border-dracula-current hover:bg-dracula-current/30'
            }`}
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-dracula-fg">
              {complete && <Check className="h-3.5 w-3.5 text-dracula-green" />}
              <span className={complete ? 'text-dracula-comment' : ''}>{cat.name}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-dracula-comment">
              <span>
                {done}/{total}
              </span>
            </div>
            <div className="mt-1.5">
              <ProgressBar value={done} max={total} />
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
}
