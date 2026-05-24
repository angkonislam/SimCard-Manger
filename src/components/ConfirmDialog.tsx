import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmCtx {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmCtx | null>(null);

export const useConfirm = (): ConfirmCtx => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return {
      confirm: (opts) => Promise.resolve(window.confirm(opts.message)),
    };
  }
  return ctx;
};

interface PendingConfirm extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const handleAnswer = (answer: boolean) => {
    pending?.resolve(answer);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => handleAnswer(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col gap-4 p-5 border border-gray-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pending.danger
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                {pending.title && (
                  <h2 className="font-bold text-gray-900 dark:text-gray-100">{pending.title}</h2>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">{pending.message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleAnswer(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-200 text-sm font-semibold active:scale-95 transition-transform"
              >
                {pending.cancelText ?? 'Cancel'}
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className={`px-4 py-2 rounded-xl text-white text-sm font-semibold active:scale-95 transition-transform ${
                  pending.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {pending.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
