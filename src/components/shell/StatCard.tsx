import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Stat tile in the reference dashboards' idiom: a plain bordered card,
 * `text-xs` muted label, `text-3xl font-semibold tracking-tight` number, and
 * the accent only on the icon. Hover is `bg-muted/40`.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  href?: string;
  hint?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <div className={cn('flex h-full items-center justify-between rounded-xl border bg-card p-5 transition-colors', href && 'hover:bg-muted/40', className)}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Icon className="size-5 shrink-0 text-accent-purple" aria-hidden="true" />
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}
