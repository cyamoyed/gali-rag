import { useState } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantConfig: Record<ConfirmVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  confirmVariant: 'primary' | 'danger';
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-error-soft',
    iconColor: 'text-error',
    confirmVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-soft',
    iconColor: 'text-warning',
    confirmVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconBg: 'bg-link-bg-soft',
    iconColor: 'text-link',
    confirmVariant: 'primary',
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handling is done by the caller
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex items-center gap-2 justify-end w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading || loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            size="sm"
            onClick={handleConfirm}
            loading={isLoading || loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {description && (
            <p className="mt-2 text-sm text-body">{description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}