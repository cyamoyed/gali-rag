import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      required,
      wrapperClassName = '',
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const textareaId = id || (label ? `textarea-${label}` : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-ink"
          >
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full bg-canvas border rounded-sm px-3 py-[9px] text-sm text-ink placeholder:text-muted outline-none resize-y transition-colors duration-[180ms] ${
            error
              ? 'border-error focus:ring-1 focus:ring-error/30'
              : 'border-hairline focus:border-accent focus:ring-1 focus:ring-accent/30'
          } ${props.disabled ? 'opacity-50 bg-canvas-soft' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
