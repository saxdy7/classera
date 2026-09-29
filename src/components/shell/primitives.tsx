import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shell primitives — Amboras layout language, aria/looma accent.
 *
 * The Amboras admin screens establish the structure: neutral white surfaces,
 * 1px borders, a page title on the left of the header, a toolbar row of
 * filters + actions, stat tiles with a big number and a muted outline icon,
 * bordered content cards carrying a status badge, and list rows built from an
 * icon chip + title + description + a trailing control.
 *
 * Colour stays almost entirely neutral — the single purple accent (aria) is
 * reserved for the active nav item, focus rings, and a handful of status pills.
 */

/* ────────────────────────────── buttons ────────────────────────────── */

/** Amboras primary: solid near-black, `h-9`, `rounded-lg`, icon + label. */
export const btnPrimary =
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50';

/** Amboras secondary: white, bordered, same height as the primary. */
export const btnSecondary =
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50';

/** Borderless, for header utilities ("What's new", "Support"). */
export const btnGhost =
  'inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** Square icon-only button used in search bars and toolbars. */
export const btnIcon =
  'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

/* ────────────────────────────── badges ─────────────────────────────── */

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-transparent bg-muted text-muted-foreground',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  accent: 'border-accent-purple/30 bg-accent-purple/10 text-accent-purple',
};

/** Amboras status pill — "Built-in", "Active", "Domain setup pending". */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small round count beside a section title — "Transactional Emails (9)". */
export function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
      {children}
    </span>
  );
}

/* ───────────────────────────── page chrome ─────────────────────────── */

/**
 * Toolbar row directly under the header: filters on the left, actions on the
 * right, the primary CTA right-most. Wraps to two rows on narrow screens.
 */
export function Toolbar({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}

/**
 * Segmented tabs — "All · Active · Draft · Archived".
 *
 * The reference nests these in a grey `bg-muted` track; the ACTIVE tab is a
 * white card lifted with a small shadow, not a tinted pill.
 */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-muted p-1', className)}>
      {items.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className={cn('text-xs tabular-nums', active ? 'text-foreground/60' : 'text-muted-foreground/70')}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Settings-style secondary nav — uppercase group labels with indented items,
 * the shape the reference uses down the left of its settings panel.
 */
export function NavList({
  groups,
  activeHref,
  className,
}: {
  groups: { label: string; items: { label: string; href: string; icon?: LucideIcon }[] }[];
  activeHref?: string;
  className?: string;
}) {
  return (
    <nav className={cn('space-y-5', className)}>
      {groups.map((g) => (
        <div key={g.label}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
          <div className="space-y-0.5">
            {g.items.map((it) => {
              const active = activeHref === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors',
                    active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  {it.icon && <it.icon className={cn('size-4 shrink-0', active ? 'text-foreground' : 'text-muted-foreground')} />}
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/**
 * Label/value row — the reference's settings cards are built from these:
 * an uppercase key on the left, the value right-aligned.
 */
export function FieldRow({
  label,
  value,
  action,
  className,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 border-b py-3 last:border-b-0', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        {value}
        {action}
      </div>
    </div>
  );
}

/** Card wrapper for settings panels: title, optional description, an Edit action. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/** Filter chip rail with counts — "All 399 · Marketing & Email 12". */
export function FilterChips({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5', className)}>
      {items.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              'flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
              active
                ? 'border-transparent bg-muted text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {c.label}
            {typeof c.count === 'number' && (
              <span className="text-xs tabular-nums text-muted-foreground/70">{c.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Full-width search field with optional trailing icon buttons. */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  actions,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1 rounded-lg border bg-background pl-3 pr-1', className)}>
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
 className="h-10 min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
      />
      {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
    </div>
  );
}

/* ───────────────────────────── content blocks ──────────────────────── */

/**
 * Amboras stat tile: small muted label, oversized number, outline icon in the
 * top-right. Deliberately colourless — the figure carries the emphasis.
 */
export function Stat({
  label,
  value,
  icon: Icon,
  href,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
  hint?: React.ReactNode;
  className?: string;
}) {
  // `h-full` + `flex-col` make every tile in a row the same height, and the
  // hint is pushed to the bottom with `mt-auto`. Without this a tile carrying a
  // hint grew taller than its neighbours and the row lost its baseline.
  const body = (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border bg-card p-4 transition-colors',
        href && 'hover:bg-muted/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-auto pt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

/**
 * Bordered content card — the Plugins-grid shape: logo chip top-left, status
 * badge top-right, title, category, clamped description.
 */
export function ItemCard({
  href,
  icon: Icon,
  logo,
  title,
  category,
  description,
  badge,
  footer,
  className,
}: {
  href?: string;
  icon?: LucideIcon;
  logo?: React.ReactNode;
  title: string;
  category?: string;
  description?: string;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
          {logo ?? (Icon ? <Icon className="size-5 text-foreground" /> : null)}
        </span>
        {badge}
      </div>
      <h3 className="mt-3 truncate text-sm font-semibold text-foreground">{title}</h3>
      {category && <p className="mt-0.5 text-xs text-muted-foreground">{category}</p>}
      {description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
      {footer && <div className="mt-auto pt-3">{footer}</div>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

/** Container for Amboras list rows: one bordered card, hairline-divided rows. */
export function List({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('divide-y overflow-hidden rounded-xl border bg-card', className)}>{children}</div>;
}

/**
 * List row: icon chip, title + description, an optional meta line, and a
 * trailing control (toggle, badge) followed by a chevron.
 */
export function Row({
  href,
  icon: Icon,
  title,
  description,
  meta,
  trailing,
  chevron = true,
  className,
}: {
  href?: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40', className)}>
      {href && <Link href={href} className="absolute inset-0" aria-label={typeof title === 'string' ? title : undefined} />}
      {Icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
          <Icon className="size-4 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
        {meta && <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">{meta}</div>}
      </div>
      {trailing && <div className="relative z-10 flex shrink-0 items-center gap-2">{trailing}</div>}
      {chevron && <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />}
    </div>
  );
}

/** Read-only toggle pill matching the Amboras email-template switches. */
export function Toggle({ on, onClick, label }: { on: boolean; onClick?: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={!onClick}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        on ? 'bg-primary' : 'bg-muted',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <span className={cn('inline-block size-4 rounded-full bg-white shadow-sm transition-transform', on ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  );
}

/** Centred empty state — large outline icon, heading, one sentence, one CTA. */
export function Empty({
  icon: Icon,
  title,
  description,
  cta,
  href,
  onCta,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  cta?: string;
  href?: string;
  onCta?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <Icon className="size-12 text-muted-foreground/40" strokeWidth={1.25} aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {cta &&
        (href ? (
          <Link href={href} className={cn(btnPrimary, 'mt-5')}>{cta}</Link>
        ) : (
          <button type="button" onClick={onCta} className={cn(btnPrimary, 'mt-5')}>{cta}</button>
        ))}
    </div>
  );
}

/** Section heading with an optional count and a right-hand action. */
export function Section({
  title,
  description,
  count,
  action,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4 border-b pb-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            {title}
            {typeof count === 'number' && <CountBadge>{count}</CountBadge>}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
