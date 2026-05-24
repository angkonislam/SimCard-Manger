import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  triggerClassName?: string;
  panelClassName?: string;
  align?: 'left' | 'right';
  showChevron?: boolean;
  searchable?: boolean;
  renderTrigger?: (label: string, isOpen: boolean) => ReactNode;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  triggerClassName,
  panelClassName,
  align = 'left',
  showChevron = true,
  searchable = false,
  renderTrigger,
  size = 'md',
  ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; right: number; width: number; openUp: boolean }>({ top: 0, left: 0, right: 0, width: 0, openUp: false });
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside, true);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const selected = options.find(o => o.value === value);
  const label = selected?.label || placeholder;

  const open = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const PANEL_HEIGHT = Math.min(320, options.length * 40 + 24);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const openUp = spaceBelow < PANEL_HEIGHT && rect.top > PANEL_HEIGHT;
    setPos({
      top: openUp ? rect.top - PANEL_HEIGHT - 6 : rect.bottom + 6,
      left: rect.left,
      right: window.innerWidth - rect.right,
      width: rect.width,
      openUp,
    });
    setSearch('');
    setIsOpen(o => !o);
  };

  const sizeCls = size === 'sm'
    ? 'px-3 py-1.5 text-[11px]'
    : size === 'lg'
      ? 'px-5 py-3.5 text-sm'
      : 'px-4 py-2.5 text-xs';

  const defaultTrigger = `w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-semibold text-gray-900 dark:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all cursor-pointer ${sizeCls}`;

  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={open}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        className={triggerClassName || defaultTrigger}
      >
        {renderTrigger ? renderTrigger(label, isOpen) : (
          <>
            <span className={`truncate ${!selected ? 'text-gray-400 dark:text-gray-500 font-medium' : ''}`}>{label}</span>
            {showChevron && (
              <ChevronDown className={`shrink-0 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setIsOpen(false)} />
          <div
            style={{
              position: 'fixed',
              top: pos.top,
              ...(align === 'right'
                ? { right: Math.max(8, pos.right) }
                : { left: Math.max(8, Math.min(pos.left, window.innerWidth - pos.width - 8)) }),
              minWidth: pos.width,
              zIndex: 201,
            }}
            className={panelClassName || 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-1rem)]'}
          >
            {searchable && (
              <div className="p-2 border-b border-gray-100 dark:border-slate-800">
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            )}
            <div className="max-h-[280px] overflow-y-auto no-scrollbar py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 text-center font-medium">No results</p>
              ) : (
                filtered.map(opt => {
                  const isSel = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange(opt.value); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        isSel
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.hint && <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{opt.hint}</span>}
                      </div>
                      {isSel && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
