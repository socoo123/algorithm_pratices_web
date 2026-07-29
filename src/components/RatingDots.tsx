export function RatingDots({
  value,
  max = 5,
  variant,
}: {
  value: number;
  max?: number;
  variant: 'star' | 'heat';
}) {
  const filled = variant === 'star' ? 'bg-dracula-purple' : 'bg-dracula-orange';
  const empty = 'bg-dracula-current';
  return (
    <div className="flex gap-0.5" title={variant === 'star' ? `经典度 ${value}` : `热度 ${value}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < value ? filled : empty}`} />
      ))}
    </div>
  );
}
