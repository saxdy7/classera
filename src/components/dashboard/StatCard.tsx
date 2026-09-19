import { LucideIcon } from 'lucide-react';

type Delta = { value: string; direction: 'up' | 'down' | 'flat' };

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Tailwind classes for the icon plate. Defaults to the neutral system plate. */
  iconBg?: string;
  iconColor?: string;
  /** Optional period-over-period change, e.g. { value: '+12%', direction: 'up' }. */
  delta?: Delta;
}

/**
 * Dashboard stat card - Classera design system (see /DESIGN.md).
 *
 * The number is set in JetBrains Mono with tabular figures: these values sit in
 * a grid and get compared across cards, and proportional digits make a column
 * of numbers visibly ragged. The label sits above as a mono eyebrow so the eye
 * lands on the figure first.
 *
 * Depth is white-on-cream plus a hairline. No shadow.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  iconBg = 'bg-[var(--cl-surface-strong)]',
  iconColor = 'text-[var(--cl-ink)]',
  delta,
}: StatCardProps) {
  const deltaColor =
    delta?.direction === 'up'
      ? 'text-[var(--cl-success)]'
      : delta?.direction === 'down'
        ? 'text-[var(--cl-error)]'
        : 'text-[var(--cl-muted)]';

  return (
    <div className="rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] p-6 transition-colors duration-[var(--cl-dur-micro)] hover:border-[var(--cl-hairline-strong)]">
      <div className="flex items-start justify-between gap-3">
        <span className="cl-eyebrow">{label}</span>
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--cl-r-md)] ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>

      <p className="cl-metric mt-3">{value}</p>

      {delta && (
        <p className={`mt-1.5 text-[13px] leading-[1.4] ${deltaColor}`}>
          {/* Direction is spelled out, never encoded in colour alone. */}
          <span className="cl-mono">{delta.value}</span>
          <span className="text-[var(--cl-muted)]">
            {delta.direction === 'up' ? ' increase' : delta.direction === 'down' ? ' decrease' : ' no change'}
          </span>
        </p>
      )}
    </div>
  );
}
