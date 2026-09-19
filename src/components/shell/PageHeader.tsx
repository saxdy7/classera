import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PageHeader — aria-hackathon `modules/tasks/TasksPage.tsx`, verbatim recipe:
 *
 *   <div class="flex items-center justify-between gap-4">
 *     <div>
 *       <div class="flex items-center gap-2.5">
 *         <Icon class="w-6 h-6" />
 *         <h1 class="text-3xl font-semibold tracking-tight text-foreground">…</h1>
 *       </div>
 *       <p class="text-sm text-muted-foreground mt-0.5">…</p>
 *     </div>
 *     <Button class="gap-2 rounded-sm">…</Button>
 *   </div>
 */
export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="size-6 shrink-0 text-foreground" aria-hidden="true" />}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * SectionHeader — looma `DashboardPage.tsx`:
 *   <h2 class="text-xl font-semibold"> + icon, muted description,
 *   <Button size="sm" variant="outline">View All</Button> on the right.
 */
export function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          {Icon && <Icon className="size-5 shrink-0 text-accent-purple" aria-hidden="true" />}
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** aria's primary button: `gap-2 rounded-sm`, filled neutral primary. */
export const primaryButton =
  'inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50';

/** looma's `size="sm" variant="outline"` (View all, secondary actions). */
export const outlineButton =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50';
