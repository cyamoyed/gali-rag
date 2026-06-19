import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonShape = 'default' | 'pill';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-white hover:opacity-85 active:opacity-75 disabled:opacity-50',
  secondary:
    'bg-canvas text-ink border border-hairline hover:border-hairline-strong active:bg-canvas-soft disabled:opacity-50',
  ghost:
    'bg-transparent text-body hover:bg-canvas-soft active:bg-canvas-soft-2 disabled:opacity-50',
  danger:
    'bg-error text-white hover:opacity-85 active:opacity-75 disabled:opacity-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px] gap-1.5',
  md: 'px-[18px] py-[9px] text-sm gap-1.5',
  lg: 'px-6 py-3 text-base gap-2',
};

const shapeClasses: Record<ButtonShape, string> = {
  default: 'rounded-sm',
  pill: 'rounded-pill',
};

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-200 select-none ${variantClasses[variant]} ${sizeClasses[size]} ${shapeClasses[shape]} ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
