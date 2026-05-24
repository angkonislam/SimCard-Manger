import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { downloadCSV, downloadPDF, buildTableHTML } from '../lib/export';

type Row = Record<string, string | number | null | undefined>;

interface Props {
  filename: string;        // e.g. "customers"
  title: string;           // PDF title
  headers: string[];
  rows: Row[];
  size?: 'sm' | 'md';
}

export function ExportMenu({ filename, title, headers, rows, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleCSV = () => {
    downloadCSV(filename, headers, rows);
    setOpen(false);
  };
  const handlePDF = () => {
    downloadPDF(title, buildTableHTML(title, headers, rows));
    setOpen(false);
  };

  const buttonClass = size === 'sm'
    ? 'p-2 border border-gray-200 dark:border-slate-700 rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shrink-0'
    : 'px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={buttonClass}
        title="Export"
        aria-label="Export"
      >
        <Download className={size === 'sm' ? 'w-4 h-4 text-gray-900 dark:text-gray-300' : 'w-3.5 h-3.5'} />
        {size !== 'sm' && 'Export'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
          <button
            onClick={handleCSV}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handlePDF}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-t border-gray-100 dark:border-slate-800"
          >
            <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
