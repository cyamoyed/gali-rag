import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface MultiSelectProps {
  label?: string;
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = '请选择',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <div className="relative">
        <button
          type="button"
          className="w-full bg-canvas border border-hairline rounded-sm px-3 py-2 text-sm text-left outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 flex items-center gap-1.5 flex-wrap min-h-[38px]"
          onClick={() => setOpen(!open)}
        >
          {selectedLabels.length === 0 ? (
            <span className="text-muted">{placeholder}</span>
          ) : (
            selectedLabels.map((lbl, i) => (
              <span
                key={value[i]}
                className="inline-flex items-center gap-1 bg-accent-soft text-accent text-xs px-2 py-0.5 rounded"
              >
                {lbl}
                <button
                  type="button"
                  className="hover:text-accent/80"
                  onClick={(e) => remove(value[i], e)}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
          <ChevronDown className={`w-4 h-4 text-muted ml-auto flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-hairline rounded-sm shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">暂无选项</p>
            ) : (
              options.map((opt) => {
                const selected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-canvas-soft transition-colors ${
                      selected ? 'bg-accent-soft' : ''
                    }`}
                    onClick={() => toggle(opt.value)}
                  >
                    <span
                      className={`w-4 h-4 flex-shrink-0 flex items-center justify-center rounded border ${
                        selected
                          ? 'bg-accent border-accent text-white'
                          : 'border-hairline'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                    </span>
                    <span className={selected ? 'text-accent font-medium' : 'text-ink'}>
                      {opt.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
