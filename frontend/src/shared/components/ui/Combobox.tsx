import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  filterable?: boolean;
}

export function Combobox({
  label,
  error,
  hint,
  required,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  filterable = true,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = label ? `combobox-${label}` : undefined;

  const optionByValue = useMemo(
    () => new Map(options.map((o) => [o.value, o.label])),
    [options],
  );

  useEffect(() => {
    const label_ = optionByValue.get(value);
    setInputValue(label_ ?? value);
  }, [value, optionByValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(
    () => {
      if (!filterable) return options;
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes((inputValue || '').toLowerCase()) ||
          opt.value.toLowerCase().includes((inputValue || '').toLowerCase()),
      );
    },
    [options, inputValue, filterable],
  );

  const handleSelect = useCallback(
    (opt: ComboboxOption) => {
      setInputValue(opt.label);
      onChange(opt.value);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputValue(text);
      onChange(text);
      if (!isOpen) setIsOpen(true);
    },
    [onChange, isOpen],
  );

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <div
          className={`flex items-center bg-canvas border rounded-sm transition-colors duration-[180ms] ${
            error
              ? 'border-error focus-within:ring-1 focus-within:ring-error/30'
              : 'border-hairline focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30'
          } ${disabled ? 'opacity-50 bg-canvas-soft' : ''}`}
        >
          <input
            id={inputId}
            type="text"
            className={`flex-1 bg-transparent px-3 py-[9px] text-sm text-ink placeholder:text-muted outline-none min-w-0 ${!filterable ? 'cursor-pointer caret-transparent' : ''}`}
            value={inputValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={!filterable}
            autoComplete={autoComplete || 'off'}
            onChange={handleInputChange}
            onClick={() => setIsOpen(filterable ? true : !isOpen)}
          />
          <button
            type="button"
            tabIndex={-1}
            className="pr-2.5 text-muted hover:text-body transition-colors"
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && filteredOptions.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-canvas border border-hairline rounded-sm shadow-lg max-h-48 overflow-y-auto py-1">
            {filteredOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-sm text-ink hover:bg-canvas-soft transition-colors flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                >
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted font-mono">{opt.value}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
