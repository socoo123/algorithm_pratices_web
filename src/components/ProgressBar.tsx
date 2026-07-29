export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-dracula-current">
      <div
        className="h-full rounded-full bg-gradient-to-r from-dracula-purple to-dracula-pink transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
