import React, { useState, useRef, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  minDate?: string; // yyyy-MM-dd
  maxDate?: string; // yyyy-MM-dd
}

export function CustomDatePicker({ value, onChange, children, align = 'left', minDate, maxDate }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, right: 0, openUp: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const minDateObj = minDate ? parse(minDate, 'yyyy-MM-dd', new Date()) : new Date(new Date().getFullYear() - 5, 0, 1);
  const maxDateObj = maxDate ? parse(maxDate, 'yyyy-MM-dd', new Date()) : new Date();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  const DROPDOWN_HEIGHT = 360;
  const openPicker = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp = spaceBelow < DROPDOWN_HEIGHT && rect.top > DROPDOWN_HEIGHT;
      setDropdownPos({
        top: openUp ? rect.top - DROPDOWN_HEIGHT - 8 : rect.bottom + 8,
        left: rect.left,
        right: window.innerWidth - rect.right,
        openUp,
      });
    }
    setIsOpen(o => !o);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div onClick={openPicker} className="cursor-pointer">
        {children}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            ...(align === 'right'
              ? { right: Math.max(8, dropdownPos.right) }
              : { left: Math.min(dropdownPos.left, window.innerWidth - 308) }),
            zIndex: 9999,
          }}
          className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-4 animate-in fade-in zoom-in-95 duration-200 w-[296px]"
        >
          <style dangerouslySetInnerHTML={{__html: `
            .rdp-root {
              --rdp-day-height: 36px;
              --rdp-day-width: 36px;
              --rdp-day_button-width: 34px;
              --rdp-day_button-height: 34px;
              --rdp-nav-height: 38px;
              --rdp-accent-color: #10b981;
              --rdp-background-color: rgba(16,185,129, 0.1);
              --rdp-accent-background-color: rgba(16,185,129, 0.1);
              font-size: 13px;
              margin: 0;
            }
            :root.dark .rdp-root {
              --rdp-accent-color: #10b981;
              --rdp-background-color: rgba(16,185,129, 0.2);
            }
            .rdp-dropdowns {
              display: flex;
              gap: 6px;
              align-items: center;
              justify-content: center;
              flex: 1;
            }
            .rdp-dropdown_month, .rdp-dropdown_year {
              display: inline-flex;
              align-items: center;
              position: relative;
            }
            .rdp-caption_label {
              display: none;
            }
            .rdp-month_caption {
              display: flex;
              align-items: center;
              justify-content: space-between;
              height: 40px;
              margin-bottom: 10px;
              padding: 0 2px;
            }
            .rdp-nav {
              display: none;
            }
            .rdp-head_cell {
              font-size: 11px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding-bottom: 6px;
            }
            :root.dark .rdp-head_cell {
              color: #64748b;
            }
            .rdp-day_button {
              border-radius: 8px;
              font-weight: 600;
              color: #1f2937;
            }
            :root.dark .rdp-day_button {
              color: #e2e8f0;
            }
            .rdp-day_button:hover {
              background-color: rgba(16,185,129, 0.1) !important;
            }
            .rdp-selected .rdp-day_button {
              background: linear-gradient(135deg, #10b981 0%, #4d96ff 100%) !important;
              color: white !important;
              border: none !important;
            }
            .rdp-today {
              color: #10b981;
              font-weight: 800;
            }
            .rdp-outside .rdp-day_button {
              color: #cbd5e1;
            }
            :root.dark .rdp-outside .rdp-day_button {
              color: #475569;
            }
          `}} />
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, 'yyyy-MM-dd'));
              } else {
                onChange('');
              }
              setIsOpen(false);
            }}
            captionLayout="dropdown"
            startMonth={minDateObj}
            endMonth={maxDateObj}
            disabled={[{ before: minDateObj }, { after: maxDateObj }]}
            showOutsideDays
            components={{
              Dropdown: (props: any) => {
                const { value, onChange: rdpOnChange, options = [], 'aria-label': ariaLabel } = props;
                const opts = (options as any[]).map((o: any) => ({
                  value: String(o.value),
                  label: String(o.label),
                  disabled: o.disabled,
                }));
                const enabled = opts.filter(o => !(o as any).disabled);
                const curIdx = enabled.findIndex(o => o.value === String(value));
                const prevVal = curIdx > 0 ? enabled[curIdx - 1].value : null;
                const nextVal = curIdx >= 0 && curIdx < enabled.length - 1 ? enabled[curIdx + 1].value : null;
                const emit = (v: string) => {
                  if (rdpOnChange) rdpOnChange({ target: { value: v } } as any);
                };
                const navBtn = 'w-5 h-5 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';
                return (
                  <div className="inline-flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => prevVal != null && emit(prevVal)}
                      disabled={prevVal == null}
                      aria-label={`Previous ${ariaLabel || ''}`.trim()}
                      className={navBtn}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <CustomSelect
                      value={String(value)}
                      onChange={emit}
                      options={opts}
                      size="sm"
                      ariaLabel={ariaLabel}
                      triggerClassName="inline-flex items-center justify-between gap-1 px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-gray-900 dark:text-gray-200 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all cursor-pointer min-w-[64px]"
                    />
                    <button
                      type="button"
                      onClick={() => nextVal != null && emit(nextVal)}
                      disabled={nextVal == null}
                      aria-label={`Next ${ariaLabel || ''}`.trim()}
                      className={navBtn}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
