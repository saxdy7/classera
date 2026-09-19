import * as React from "react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive' | 'success' | 'warning';
}

/**
 * Alert — Classera design system (see /DESIGN.md).
 *
 * Semantic colour at low opacity for the fill, full-strength for text and the
 * left rule. Destructive alerts get role="alert" so they are announced;
 * informational ones use role="status" to avoid interrupting screen readers.
 */
const VARIANTS: Record<NonNullable<AlertProps['variant']>, string> = {
    default: 'border-[var(--cl-hairline)] bg-[rgba(13,116,206,0.08)] text-[var(--cl-ink)] border-l-[3px] border-l-[var(--cl-info)]',
    destructive: 'border-[var(--cl-hairline)] bg-[rgba(239,68,68,0.08)] text-[var(--cl-ink)] border-l-[3px] border-l-[var(--cl-error)]',
    success: 'border-[var(--cl-hairline)] bg-[rgba(22,163,74,0.08)] text-[var(--cl-ink)] border-l-[3px] border-l-[var(--cl-success)]',
    warning: 'border-[var(--cl-hairline)] bg-[rgba(171,100,0,0.08)] text-[var(--cl-ink)] border-l-[3px] border-l-[var(--cl-warning)]',
};

export function Alert({ className = "", variant = 'default', ...props }: AlertProps) {
    return (
        <div
            role={variant === 'destructive' ? 'alert' : 'status'}
            className={`relative w-full rounded-[var(--cl-r-lg)] border p-4 ${VARIANTS[variant]} ${className}`}
            {...props}
        />
    );
}

export function AlertDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <div
            className={`text-sm leading-[1.5] text-[var(--cl-body)] [&_p]:leading-relaxed ${className}`}
            {...props}
        />
    );
}

export function AlertTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h5
            className={`mb-1 text-[16px] font-semibold leading-none tracking-tight text-[var(--cl-ink)] ${className}`}
            {...props}
        />
    );
}
