import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * looma-sketch `modules/dashboard/DashboardPage.tsx`, copied:
 *
 *   PROJECT_GRADIENTS — pastel `from-X-300 to-X-100` pairs
 *   Card: h-[180px] bg-linear-to-br {gradient} hover:scale-[1.02]
 *         transition-transform p-2 overflow-hidden relative
 *   Footer: absolute bottom-0 inset-x-0 p-2.5 bg-black/10 backdrop-blur-xs
 *           border-t border-white/10 flex justify-between items-center
 *   Create tile: h-[180px] border-2 border-dashed border-muted-foreground/40
 *                hover:border-primary hover:bg-muted/10
 */
export const CARD_GRADIENTS = [
  'from-red-300 to-red-100',
  'from-green-300 to-green-100',
  'from-purple-300 to-purple-100',
  'from-rose-300 to-rose-100',
  'from-blue-300 to-blue-100',
  'from-orange-300 to-orange-100',
  'from-pink-300 to-pink-100',
  'from-yellow-300 to-yellow-100',
  'from-amber-300 to-amber-100',
  'from-teal-200/70 to-teal-100',
  'from-lime-200/70 to-lime-100',
  'from-indigo-200/70 to-indigo-100',
] as const;

export const gradientFor = (i: number) => CARD_GRADIENTS[i % CARD_GRADIENTS.length];

export function GradientCard({
  href,
  index,
  icon: Icon,
  title,
  subtitle,
  footerLeft,
  footerRight,
  className,
}: {
  href: string;
  index: number;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative block h-[180px] w-full shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-linear-to-br p-2 text-foreground transition-transform hover:scale-[1.02]',
        gradientFor(index),
        className,
      )}
    >
      {/* blurred blob — looma */}
      <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/40 blur-2xl" />

      <div className="relative flex h-full flex-col p-2">
        {Icon && (
          <span className="mb-3 flex size-9 items-center justify-center rounded-lg border border-white/40 bg-white/60 text-foreground shadow-xs">
            <Icon className="size-4.5" />
          </span>
        )}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug">{title}</h3>
        {subtitle && <p className="mt-1 line-clamp-2 text-xs text-foreground/70">{subtitle}</p>}
      </div>

      {(footerLeft || footerRight) && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/10 px-2.5 py-2.5 text-[11px] font-medium text-foreground/80 backdrop-blur-xs transition-colors group-hover:bg-black/10">
          <span className="truncate">{footerLeft}</span>
          <span className="shrink-0">{footerRight}</span>
        </div>
      )}
    </Link>
  );
}

export function CreateTile({ href, label, onClick, className }: { href?: string; label: string; onClick?: () => void; className?: string }) {
  const cls = cn(
    'flex h-[180px] w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/40 text-sm font-medium text-muted-foreground transition hover:border-primary hover:bg-muted/10 hover:text-foreground',
    className,
  );
  const body = (
    <>
      <Plus className="size-4" />
      {label}
    </>
  );
  return href ? <Link href={href} className={cls}>{body}</Link> : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

/** looma's skeleton card: same h-[180px] container, pulsing bars. */
export function GradientCardSkeleton() {
  return (
    <div className="h-[180px] w-full shrink-0 overflow-hidden rounded-xl border bg-card p-3">
      <div className="mb-3 size-9 animate-pulse rounded-lg bg-muted" />
      <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
    </div>
  );
}
