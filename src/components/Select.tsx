import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  id?: string;
  /** "field" = full-height form field; "inline" = borderless, sits inside a toolbar */
  variant?: 'field' | 'inline';
  className?: string;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  id,
  variant = 'field',
  className = '',
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    setActive(selectedIndex);
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const commit = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(active); }
    else if (e.key === 'Escape' || e.key === 'Tab') { e.stopPropagation(); setOpen(false); }
  };

  const trigger =
    variant === 'field'
      ? 'field flex items-center justify-between gap-2 text-left cursor-pointer'
      : 'h-full flex items-center gap-1 px-1.5 sm:px-2.5 text-[15px] font-medium text-ink hover:bg-sunken transition-colors cursor-pointer';

  return (
    <div ref={rootRef} className={`relative ${variant === 'inline' ? 'h-full' : ''} ${className}`}>
      <button
        type="button"
        id={id}
        className={`${trigger} num`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-40 left-0 top-[calc(100%+6px)] min-w-full max-h-72 overflow-y-auto py-1 bg-surface border border-line rounded-[var(--radius-ctl)]"
          style={{ boxShadow: '0 12px 28px -8px rgb(22 23 27 / 0.18), 0 2px 6px -2px rgb(22 23 27 / 0.08)' }}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li
                key={String(o.value)}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(i)}
                className={`num flex items-center justify-between gap-3 mx-1 px-2.5 h-10 rounded-[6px] text-[16px] whitespace-nowrap cursor-pointer ${
                  i === active ? 'bg-sunken' : ''
                } ${isSel ? 'text-accent font-medium' : 'text-ink'}`}
              >
                {o.label}
                {isSel ? <Check className="w-4 h-4" /> : <span className="w-4" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
