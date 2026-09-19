import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--cl-body)] mb-2">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 border-2 border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] focus:outline-none focus:border-[var(--cl-primary)] transition-colors bg-[var(--cl-surface-card)] text-black ${error ? 'border-[var(--cl-error)]' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-[var(--cl-error)]">{error}</p>
      )}
    </div>
  );
}
