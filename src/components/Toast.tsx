import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  toast: (kind: ToastKind, message: string) => void;
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export const useToast = (): ToastCtx => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Soft fallback — useful for components rendered outside provider during transitions.
    return {
      toast: (k, m) => console.log(`[${k}]`, m),
      success: (m) => console.log('[success]', m),
      error: (m) => console.error('[error]', m),
      info: (m) => console.log('[info]', m),
    };
  }
  return ctx;
};

let _seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = ++_seq;
    setItems(prev => [...prev, { id, kind, message }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const ctxValue: ToastCtx = {
    toast,
    success: (m) => toast('success', m),
    error: (m) => toast('error', m),
    info: (m) => toast('info', m),
  };

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {items.map((t: ToastItem) => (
          <React.Fragment key={t.id}>
            <ToastView item={t} onClose={() => remove(t.id)} />
          </React.Fragment>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastViewProps {
  item: ToastItem;
  onClose: () => void;
}

function ToastView({ item, onClose }: ToastViewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const styles = {
    success: { Icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    error:   { Icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-500/15',           text: 'text-red-700 dark:text-red-300',           border: 'border-red-200 dark:border-red-500/30',           iconColor: 'text-red-600 dark:text-red-400' },
    info:    { Icon: Info,           bg: 'bg-blue-50 dark:bg-blue-500/15',         text: 'text-blue-700 dark:text-blue-300',         border: 'border-blue-200 dark:border-blue-500/30',         iconColor: 'text-blue-600 dark:text-blue-400' },
  }[item.kind];
  const { Icon } = styles;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 min-w-[260px] max-w-sm px-4 py-3 rounded-2xl shadow-lg backdrop-blur-xl border ${styles.bg} ${styles.border} transition-all duration-300 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
      role="alert"
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${styles.iconColor}`} />
      <p className={`flex-1 text-xs font-bold leading-relaxed ${styles.text}`}>{item.message}</p>
      <button
        onClick={onClose}
        className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${styles.text}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
