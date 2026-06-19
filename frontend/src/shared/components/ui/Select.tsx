import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      required,
      options,
      placeholder,
      wrapperClassName = '',
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id || (label ? `select-${label}` : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-ink"
          >
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-canvas border rounded-sm px-3 py-[9px] text-sm text-ink outline-none appearance-none transition-colors duration-[180ms] ${
            error
              ? 'border-error focus:ring-1 focus:ring-error/30'
              : 'border-hairline focus:border-accent focus:ring-1 focus:ring-accent/30'
          } ${props.disabled ? 'opacity-50 bg-canvas-soft' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
