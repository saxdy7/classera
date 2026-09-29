'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Form field primitives.
 *
 * There is exactly ONE field shape in the product: 40px tall, 1px border,
 * `rounded-lg`, 14px text, and a single focus treatment. Everything else —
 * search palettes, chat composers, inline editors — uses `FieldShell` + a
 * `bare` input, where the SHELL owns the border and the focus ring and the
 * input contributes no box at all.
 *
 * That split is deliberate. The previous setup let both the container and the
 * input draw their own border and ring, which is why fields rendered as a box
 * inside a box.
 */

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Renders no border, fill or ring — for use inside a `FieldShell`. */
  bare?: boolean;
  /** Field height. `sm` = 36px, `md` = 40px (default), `lg` = 44px. */
  inputSize?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: 'h-9 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-11 text-base',
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, bare, inputSize = 'md', ...props }, ref) => (
    <input
      ref={ref}
      // `data-bare` is what the stylesheet keys off to strip the box.
      data-bare={bare ? '' : undefined}
      className={cn(
        'w-full min-w-0 text-foreground placeholder:text-muted-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        bare
          ? 'flex-1 bg-transparent p-0 outline-none'
          : cn(
              SIZES[inputSize],
              'rounded-lg border bg-card px-3 transition-colors',
              'focus-visible:border-ring',
            ),
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { bare?: boolean };

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, bare, ...props }, ref) => (
    <textarea
      ref={ref}
      data-bare={bare ? '' : undefined}
      className={cn(
        'w-full min-w-0 text-sm text-foreground placeholder:text-muted-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        bare
          ? 'resize-none bg-transparent p-0 outline-none'
          : 'min-h-20 rounded-lg border bg-card px-3 py-2.5 transition-colors focus-visible:border-ring',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

/**
 * Container that owns the border and the focus ring for a composite field
 * (icon + input + buttons). Put `bare` inputs inside it.
 */
export function FieldShell({
  children,
  className,
  size = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card px-3 transition-colors',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40',
        size === 'sm' && 'min-h-9',
        size === 'md' && 'min-h-10',
        size === 'lg' && 'min-h-11',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Label + field + optional help/error text, with the label wired to the input. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
