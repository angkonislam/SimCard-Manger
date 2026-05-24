import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';

export interface FABAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'dark' | 'light' | 'red' | 'green';
}

function variantCls(v?: string) {
  if (v === 'light') return 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-300';
  if (v === 'red')   return 'bg-gradient-to-br from-red-500 to-rose-600 text-white';
  if (v === 'green') return 'bg-gradient-to-br from-emerald-500 to-green-600 text-white';
  return 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white';
}

export function FAB({ actions }: { actions: FABAction[] }) {
  const [open, setOpen] = useState(false);

  const handle = (fn: () => void) => { fn(); setOpen(false); };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[25]"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="fixed bottom-6 right-5 z-30 flex flex-col items-end gap-3 lg:right-10 lg:bottom-10">
        {/* Action items */}
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-200 origin-bottom ${
            open
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => handle(action.onClick)}
              className="flex items-center gap-2.5 group"
            >
              <span className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-300 text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-slate-700 whitespace-nowrap uppercase tracking-[0.12em]">
                {action.label}
              </span>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 group-hover:scale-105 ${variantCls(action.variant)}`}
              >
                {action.icon}
              </div>
            </button>
          ))}
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setOpen(o => !o)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 text-white flex items-center justify-center transition-all active:scale-90 hover:scale-105"
          style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.45)' }}
          aria-label="Actions"
        >
          <Plus
            className={`w-6 h-6 transition-transform duration-300 ${open ? 'rotate-45' : 'rotate-0'}`}
          />
        </button>
      </div>
    </>
  );
}
