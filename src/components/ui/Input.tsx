import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

/**
 * Input — Classera design system (see /DESIGN.md).
 *
 * 44px height, 8px radius, 1px hairline-strong border, rose focus ring.
 * Errors are announced, not just coloured: aria-invalid + role="alert" and a
 * message below, so the state does not depend on colour alone.
 */
export function Input({ label, error, hint, icon, className = '', id, ...props }: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-[16px] font-semibold leading-[1.4] text-[var(--cl-ink)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cl-muted)]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={[
            'w-full h-11 pr-4 py-3 rounded-[var(--cl-r-md)]',
            icon ? 'pl-12' : 'pl-4',
            'bg-[var(--cl-surface-card)] text-[var(--cl-ink)]',
            'placeholder:text-[var(--cl-muted-soft)]',
            'border transition-colors duration-[var(--cl-dur-micro)] ease-[var(--cl-ease)]',
            // Expo: focus thickens the border to ink, plus a soft neutral ring.
            'focus:outline-none focus:ring-[3px] focus:ring-[rgba(10,10,10,0.12)]',
            error
              ? 'border-[var(--cl-error)] focus:border-[var(--cl-error)]'
              : 'border-[var(--cl-hairline-strong)] focus:border-[var(--cl-ink)]',
            className,
          ].join(' ')}
          {...props}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] leading-[1.4] text-[var(--cl-error)]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[13px] leading-[1.4] text-[var(--cl-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
