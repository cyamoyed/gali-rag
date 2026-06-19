import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: ReactNode;
  iconColor: 'blue' | 'green' | 'amber' | 'red';
  value: number | string;
  label: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}

const iconColorStyles: Record<string, string> = {
  blue: 'bg-accent-soft text-accent',
  green: 'bg-success-soft text-success',
  amber: 'bg-warning-soft text-warning',
  red: 'bg-error-soft text-error',
};

export function StatCard({ icon, iconColor, value, label, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-hairline rounded-lg p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center text-lg ${iconColorStyles[iconColor]}`}>
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1
              ${trend.direction === 'up' ? 'bg-success-soft text-success' : 'bg-error-soft text-error'}
            `}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold text-ink tracking-tight">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
