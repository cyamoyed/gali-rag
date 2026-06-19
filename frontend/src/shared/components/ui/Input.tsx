import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      prefix,
      suffix,
      wrapperClassName = '',
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? `input-${label}` : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink"
          >
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div
          className={`flex items-center bg-canvas border rounded-sm transition-colors duration-[180ms] ${
            error
              ? 'border-error focus-within:ring-1 focus-within:ring-error/30'
              : 'border-hairline focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30'
          } ${props.disabled ? 'opacity-50 bg-canvas-soft' : ''}`}
        >
          {prefix && (
            <span className="pl-3 text-muted flex-shrink-0">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`flex-1 bg-transparent px-3 py-[9px] text-sm text-ink placeholder:text-muted outline-none min-w-0 ${className}`}
            {...props}
          />
          {suffix && (
            <span className="pr-3 text-muted flex-shrink-0">{suffix}</span>
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
