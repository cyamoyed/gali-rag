import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-canvas-soft flex items-center justify-center text-2xl mb-3 text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted mb-5 max-w-sm">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
