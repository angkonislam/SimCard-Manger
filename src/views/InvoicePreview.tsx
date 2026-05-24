import { ChevronLeft } from 'lucide-react';
import { Invoice } from '../types';
import { Module, View } from '../constants';

interface Props {
  selectedInvoice: Invoice;
  setView: (v: View) => void;
  setActiveModule: (m: Module) => void;
}

export function InvoicePreview({ selectedInvoice, setView, setActiveModule }: Props) {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto pb-10 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 z-10">
        <button
          onClick={() => { setView('dashboard'); setActiveModule('invoices-module'); }}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-sm font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest">{selectedInvoice.invoiceNumber}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            {selectedInvoice.issueDate
              ? new Date(selectedInvoice.issueDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
              : ''}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Customer */}
        <div className="p-5 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-2xl flex items-center gap-4 border border-emerald-200 dark:border-emerald-500/30">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 flex items-center justify-center text-sm font-black text-emerald-600 dark:text-emerald-400">
            {selectedInvoice.customer?.initials || selectedInvoice.customer?.name?.[0]}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">Bill To</p>
            <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">{selectedInvoice.customer?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {selectedInvoice.customer?.customerId}</p>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Items</p>
          <div className="space-y-2">
            {(selectedInvoice.items || []).map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{item.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} qty × RM {item.unitPrice}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">RM {(item.quantity * item.unitPrice).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="p-5 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-2xl space-y-3 border border-emerald-200 dark:border-emerald-500/30">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
            <span className="font-bold text-gray-900 dark:text-gray-200">RM {selectedInvoice.subtotal.toLocaleString()}</span>
          </div>
          {(selectedInvoice.vat ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Return</span>
              <span className="font-bold text-red-500 dark:text-red-400">- RM {(selectedInvoice.vat ?? 0).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base pt-2 border-t border-emerald-200/50 dark:border-emerald-500/20">
            <span className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-xs">Total Due</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">RM {selectedInvoice.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Notes */}
        {selectedInvoice.notes && (
          <div className="p-5 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-100 dark:border-yellow-500/30">
            <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedInvoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
