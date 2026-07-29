import { useProgress } from '../hooks/useProgress';
import type { Problem } from '../types';

const LABELS = ['第 1 遍', '第 2 遍', '第 3 遍'];

export function RoundCheckboxes({ problem }: { problem: Problem }) {
  const { getProblemProgress, setRound } = useProgress();
  const p = getProblemProgress(problem.bankId, problem.slug);
  const rounds = p?.rounds ?? [false, false, false];

  return (
    <div className="flex gap-1">
      {rounds.map((checked, i) => (
        <label key={i} className="group relative cursor-pointer" title={LABELS[i]}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setRound(problem.bankId, problem.slug, i, e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] transition-transform peer-checked:scale-110 peer-checked:border-dracula-green/70 peer-checked:bg-dracula-green/20 ${
              checked
                ? 'border-dracula-green/70 bg-dracula-green/20 text-dracula-green'
                : 'border-dracula-current bg-dracula-bg-dark text-transparent'
            }`}
          >
            ✓
          </span>
        </label>
      ))}
    </div>
  );
}
