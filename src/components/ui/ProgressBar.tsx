import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Step progress bar - Classera design system (see /DESIGN.md).
 *
 * Exposed as a real progressbar to assistive tech, and the percentage is shown
 * as text, so progress is never conveyed by the fill alone.
 */
export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const safeTotal = Math.max(1, totalSteps);
  const clamped = Math.min(Math.max(currentStep, 0), safeTotal);
  const progress = (clamped / safeTotal) * 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--cl-body)]">
          Step <span className="cl-mono">{clamped}</span> of <span className="cl-mono">{safeTotal}</span>
        </span>
        <span className="cl-mono text-sm font-medium text-[var(--cl-ink)]">
          {Math.round(progress)}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Step ${clamped} of ${safeTotal}`}
        className="h-2 w-full overflow-hidden rounded-[var(--cl-r-pill)] bg-[var(--cl-surface-strong)]"
      >
        <div
          className="h-full rounded-[var(--cl-r-pill)] bg-[var(--cl-primary)] transition-[width] duration-[var(--cl-dur-panel)] ease-[var(--cl-ease)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
