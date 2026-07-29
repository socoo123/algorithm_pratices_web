import { ClipboardCopy, StickyNote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiPrompt, copyText, difficultyClass } from '../lib/format';
import { useProgress } from '../hooks/useProgress';
import type { Problem } from '../types';
import { RatingDots } from './RatingDots';
import { RoundCheckboxes } from './RoundCheckboxes';

type FilterDone = 'all' | 'todo' | 'done';

function ProblemRow({
  problem,
  noteOpen,
  onToggleNote,
}: {
  problem: Problem;
  noteOpen: boolean;
  onToggleNote: () => void;
}) {
  const { getProblemProgress, setNote, isRound1Done } = useProgress();
  const done = isRound1Done(problem.bankId, problem.slug);
  const prog = getProblemProgress(problem.bankId, problem.slug);
  const note = prog?.note ?? '';
  const [draft, setDraft] = useState(note);
  const hasNote = note.trim().length > 0;

  useEffect(() => {
    if (noteOpen) setDraft(note);
  }, [noteOpen, note]);

  useEffect(() => {
    if (!noteOpen) return;
    const t = setTimeout(() => {
      if (draft !== note) setNote(problem.bankId, problem.slug, draft);
    }, 500);
    return () => clearTimeout(t);
  }, [draft, note, noteOpen, problem.bankId, problem.slug, setNote]);

  return (
    <>
      <tr
        className={`group border-b border-dracula-current/40 transition hover:bg-dracula-current/25 ${
          done ? 'bg-dracula-green/[0.06]' : ''
        }`}
      >
        <td className="relative px-3 py-2.5">
          {done && (
            <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-dracula-green/80" aria-hidden />
          )}
          <RoundCheckboxes problem={problem} />
        </td>
        <td className="font-mono px-2 py-2.5 text-xs text-dracula-comment">{problem.number}</td>
        <td className="px-3 py-2.5">
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer"
            className={`font-medium transition hover:text-dracula-cyan ${
              done ? 'text-dracula-comment line-through decoration-dracula-current' : 'text-dracula-fg'
            }`}
          >
            {problem.title}
          </a>
        </td>
        <td className="px-2 py-2.5">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${difficultyClass(problem.difficulty)}`}
          >
            {problem.difficulty}
          </span>
        </td>
        <td className="px-2 py-2.5">
          <RatingDots value={problem.stars} variant="star" />
        </td>
        <td className="px-2 py-2.5">
          <RatingDots value={problem.heat} variant="heat" />
        </td>
        <td className="max-w-xs px-3 py-2.5 text-dracula-comment">{problem.hint}</td>
        <td className="px-2 py-2.5">
          <button
            type="button"
            title={hasNote ? note : '添加备注'}
            onClick={onToggleNote}
            className={`rounded p-1 transition hover:bg-dracula-current/50 ${
              hasNote ? 'text-dracula-yellow' : 'text-dracula-comment'
            }`}
          >
            <StickyNote className="h-4 w-4" />
          </button>
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1">
            {problem.hasSolution ? (
              <Link
                to={`/bank/${problem.bankId}/solution/${problem.slug}`}
                className="text-xs text-dracula-cyan hover:text-dracula-pink"
              >
                题解
              </Link>
            ) : (
              <span className="text-xs text-dracula-comment/50">—</span>
            )}
            <button
              type="button"
              title="复制 AI 提示词"
              onClick={() => void copyText(aiPrompt(problem.number, problem.title, problem.url))}
              className="rounded p-1 text-dracula-comment transition hover:bg-dracula-current/50 hover:text-dracula-fg"
            >
              <ClipboardCopy className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {noteOpen && (
        <tr className="border-b border-dracula-current/40 bg-dracula-bg-dark/60">
          <td colSpan={9} className="px-4 py-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="易错点、思路备忘…"
              rows={3}
              className="w-full resize-y rounded-lg border border-dracula-current bg-dracula-bg-dark px-3 py-2 text-sm text-dracula-fg outline-none ring-dracula-purple/40 focus:ring-2"
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function ProblemTable({ problems }: { problems: Problem[]; bankId: string }) {
  const { isRound1Done } = useProgress();
  const [filter, setFilter] = useState<FilterDone>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (filter === 'done' && !isRound1Done(p.bankId, p.slug)) return false;
      if (filter === 'todo' && isRound1Done(p.bankId, p.slug)) return false;
      if (difficulty !== 'all' && p.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.number.includes(q) ||
        p.hint.toLowerCase().includes(q)
      );
    });
  }, [problems, filter, difficulty, query, isRound1Done]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'todo', 'done'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1 text-xs ${
              filter === f
                ? 'bg-dracula-purple/25 text-dracula-purple'
                : 'bg-dracula-bg-dark text-dracula-comment hover:bg-dracula-current/40'
            }`}
          >
            {f === 'all' ? '全部' : f === 'todo' ? '未完成' : '已完成'}
          </button>
        ))}
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-lg border border-dracula-current bg-dracula-bg-dark px-2 py-1 text-xs text-dracula-fg"
        >
          <option value="all">全部难度</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索题目、题号、考点…"
          className="min-w-[200px] flex-1 rounded-lg border border-dracula-current bg-dracula-bg-dark px-3 py-1.5 text-sm text-dracula-fg placeholder:text-dracula-comment outline-none focus:border-dracula-purple/60"
        />
        <span className="text-xs text-dracula-comment">{filtered.length} 题</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-dracula-current/70 bg-dracula-bg-dark/50 backdrop-blur-xl">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-dracula-bg-dark/95 backdrop-blur">
            <tr className="border-b border-dracula-current text-left text-xs uppercase tracking-wide text-dracula-comment">
              <th className="px-3 py-3 font-medium">状态</th>
              <th className="px-2 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">题目</th>
              <th className="px-2 py-3 font-medium">难度</th>
              <th className="px-2 py-3 font-medium">经典</th>
              <th className="px-2 py-3 font-medium">热度</th>
              <th className="px-3 py-3 font-medium">核心考点</th>
              <th className="px-2 py-3 font-medium">备注</th>
              <th className="px-2 py-3 font-medium">题解</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <ProblemRow
                key={p.slug}
                problem={p}
                noteOpen={openNotes.has(p.slug)}
                onToggleNote={() =>
                  setOpenNotes((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.slug)) next.delete(p.slug);
                    else next.add(p.slug);
                    return next;
                  })
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
