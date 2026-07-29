import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-dracula-current/70 bg-dracula-bg-dark/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-dracula-fg"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-dracula-comment transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-dracula-current/50 px-4 py-3 text-sm text-dracula-comment">
          {children}
        </div>
      )}
    </div>
  );
}
