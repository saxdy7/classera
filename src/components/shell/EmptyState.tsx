import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { primaryButton } from './PageHeader';

/**
 * Empty block — aria's "No history available" tile idiom:
 *   border border-dashed rounded-md bg-muted, centred, icon chip, two lines,
 *   optional single CTA.
 */
export function EmptyState({
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
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-background">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
      {cta && (href ? (
        <Link href={href} className={cn(primaryButton, 'mt-4')}>{cta}</Link>
      ) : (
        <button type="button" onClick={onCta} className={cn(primaryButton, 'mt-4')}>{cta}</button>
      ))}
    </div>
  );
}
