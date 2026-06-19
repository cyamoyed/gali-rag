import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '@/shared/stores/useUIStore';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const styleMap = {
  success: 'border-success/20 bg-success-soft text-success',
  error: 'border-error/20 bg-error-soft text-error',
  warning: 'border-warning/20 bg-warning-soft text-warning',
  info: 'border-accent/20 bg-accent-soft text-accent',
} as const;

export function ToastContainer() {
  const notifications = useUIStore((s) => s.notifications);
  const removeNotification = useUIStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <ToastItem
          key={n.id}
          id={n.id}
          type={n.type}
          message={n.message}
          onDismiss={removeNotification}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: (id: string) => void;
}

function ToastItem({ id, type, message, onDismiss }: ToastItemProps) {
  const Icon = iconMap[type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md border shadow-md min-w-[300px] max-w-md animate-slide-in ${styleMap[type]}`}
      role="alert"
    >
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="关闭"
      >
        <X size={16} />
      </button>
    </div>
  );
}
