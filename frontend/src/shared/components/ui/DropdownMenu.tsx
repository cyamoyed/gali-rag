import { useState, useRef, useEffect, type ReactNode } from 'react';

interface DropdownItem {
  label: string;
  description?: string;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  onClick: () => void;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-hairline rounded-md shadow-lg z-50 py-1">
          {items.map((item, i) => (
            <button
              key={i}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                item.variant === 'danger'
                  ? 'text-error hover:bg-error/5'
                  : 'text-ink hover:bg-canvas-soft'
              }`}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </div>
              {item.description && (
                <p className="text-xs text-muted mt-0.5 ml-6">{item.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
