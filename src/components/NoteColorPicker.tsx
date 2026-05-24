import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

interface Props {
  value: string;        // hex string e.g. '#10b981'
  onChange: (hex: string) => void;
  children: React.ReactNode; // trigger element
}

export function NoteColorPicker({ value, onChange, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(o => !o)}>{children}</div>

      {open && (
        <div
          className="absolute z-[200] bottom-full mb-2 right-0 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 w-[220px]"
          style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.6)' }}
        >
          {/* Picker canvas */}
          <div className="note-color-picker-wrap">
            <HexColorPicker color={value.startsWith('#') ? value : '#10b981'} onChange={onChange} />
          </div>

          {/* Hex input row */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">#</span>
            <HexColorInput
              color={value.startsWith('#') ? value : '#10b981'}
              onChange={onChange}
              prefixed={false}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-200 uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/40 text-center"
            />
            {/* Preview swatch */}
            <div
              className="w-7 h-7 rounded-lg border border-slate-600 shrink-0"
              style={{ backgroundColor: value.startsWith('#') ? value : '#10b981' }}
            />
          </div>

          {/* Quick palette — site accent colors */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {['#10b981','#3b82f6','#f59e0b','#f43f5e','#8b5cf6','#64748b',
              '#06b6d4','#ec4899','#84cc16','#f97316'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className="w-5 h-5 rounded-md border-2 transition-all active:scale-90 hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: value === c ? '#fff' : 'transparent',
                }}
              />
            ))}
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-black uppercase tracking-widest shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            Select
          </button>
        </div>
      )}

      {/* inject react-colorful styles into theme */}
      <style>{`
        .note-color-picker-wrap .react-colorful {
          width: 100%;
          height: auto;
          gap: 10px;
        }
        .note-color-picker-wrap .react-colorful__saturation {
          border-radius: 10px;
          height: 140px;
        }
        .note-color-picker-wrap .react-colorful__hue {
          border-radius: 6px;
          height: 10px;
        }
        .note-color-picker-wrap .react-colorful__pointer {
          width: 18px;
          height: 18px;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }
        .note-color-picker-wrap .react-colorful__saturation-pointer {
          width: 16px;
          height: 16px;
        }
        .note-color-picker-wrap .react-colorful__hue-pointer {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}
