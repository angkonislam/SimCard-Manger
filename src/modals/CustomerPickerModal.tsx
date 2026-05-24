import { X } from 'lucide-react';
import { Customer, Invoice } from '../types';

interface Props {
  customers: Customer[];
  customerPickerSearch: string;
  setCustomerPickerSearch: (s: string) => void;
  draftInvoice: Partial<Invoice>;
  setDraftInvoice: (fn: (d: Partial<Invoice>) => Partial<Invoice>) => void;
  onClose: () => void;
}

export function CustomerPickerModal({
  customers,
  customerPickerSearch,
  setCustomerPickerSearch,
  draftInvoice,
  setDraftInvoice,
  onClose,
}: Props) {
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select customer"
        className="fixed inset-x-4 top-[8%] bottom-[8%] md:left-1/2 md:right-auto md:-translate-x-1/2 md:top-[6%] md:bottom-[6%] bg-white dark:bg-slate-900 rounded-3xl z-[70] overflow-hidden w-auto max-w-sm md:w-[28rem] md:max-w-md mx-auto md:mx-0 flex flex-col border border-gray-100 dark:border-slate-800"
        style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-200 uppercase tracking-[0.18em]">Select Customer</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={customerPickerSearch}
            onChange={e => setCustomerPickerSearch(e.target.value)}
            autoFocus
            className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 no-scrollbar">
          {customers
            .filter(c => !customerPickerSearch || c.name.toLowerCase().includes(customerPickerSearch.toLowerCase()) || c.customerId.includes(customerPickerSearch))
            .map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setDraftInvoice(d => ({ ...d, customer: c }));
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-95 ${draftInvoice.customer?.id === c.id ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${draftInvoice.customer?.id === c.id ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 text-emerald-600 dark:text-emerald-400'}`}>{c.initials || c.name[0]}</div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${draftInvoice.customer?.id === c.id ? 'text-white' : 'text-gray-900 dark:text-gray-300'}`}>{c.name}</p>
                  <p className={`text-[10px] font-medium ${draftInvoice.customer?.id === c.id ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>ID: {c.customerId}</p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </>
  );
}
