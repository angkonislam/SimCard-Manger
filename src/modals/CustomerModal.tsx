import { X, Copy, CheckCircle2, Plus } from 'lucide-react';
import { Customer, Invoice } from '../types';
import { supabase } from '../lib/supabase';
import { getInitials, buildWAGroup } from '../utils';
import { useToast } from '../components/Toast';
import { required, validPhone, positiveNumber, combine } from '../lib/validation';

interface Props {
  tempCustomer: Customer;
  setTempCustomer: (fn: (p: Customer) => Customer) => void;
  customers: Customer[];
  setCustomers: (fn: (prev: Customer[]) => Customer[]) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer) => void;
  setDraftInvoice: (fn: (d: Partial<Invoice>) => Partial<Invoice>) => void;
  onClose: () => void;
}

export function CustomerModal({
  tempCustomer,
  setTempCustomer,
  customers,
  setCustomers,
  selectedCustomer,
  setSelectedCustomer,
  setDraftInvoice,
  onClose,
}: Props) {
  const toast = useToast();
  const handleSave = async () => {
    const err = combine(
      required(tempCustomer.name, 'Customer name'),
      validPhone(tempCustomer.contact ?? '', 'Contact'),
      positiveNumber(tempCustomer.dueAmount ?? 0, 'Due amount'),
    );
    if (err) { toast.error(err); return; }
    const words = tempCustomer.name.trim().split(/\s+/);
    const initials = words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
    const numericId = parseInt(tempCustomer.customerId, 10);
    try {
      if (tempCustomer.id) {
        const updates: Record<string, unknown> = {
          'Customer Name': tempCustomer.name,
          'Short Name': tempCustomer.shortName ?? '',
          'Contact': tempCustomer.contact ?? null,
          'Location': tempCustomer.location ?? null,
          'Whatsapp Group Name': tempCustomer.whatsappGroup ?? null,
          'Status': tempCustomer.status ?? null,
          'Due Amount💲': tempCustomer.dueAmount ?? null,
          'Last Month Sales💲': tempCustomer.lastMonthSales ?? null,
          'Last Paid💲': tempCustomer.lastPaid ?? null,
          'Last Payment Date': tempCustomer.lastPaymentDate ?? null,
        };
        const { error } = await supabase.from('Client_Details').update(updates).eq('Client ID', numericId);
        if (error) throw error;
        const updated = { ...tempCustomer, initials };
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedCustomer?.id === updated.id) setSelectedCustomer(updated);
      } else {
        const newRow: Record<string, unknown> = {
          'Client ID': isNaN(numericId) ? null : numericId,
          'Customer Name': tempCustomer.name,
          'Short Name': tempCustomer.shortName ?? '',
          'Contact': tempCustomer.contact ?? null,
          'Location': tempCustomer.location ?? null,
          'Whatsapp Group Name': tempCustomer.whatsappGroup ?? null,
          'Status': tempCustomer.status ?? 'Active',
          'Due Amount💲': tempCustomer.dueAmount ?? 0,
        };
        const { error } = await supabase.from('Client_Details').insert(newRow);
        if (error) throw error;
        const newCust: Customer = {
          ...tempCustomer,
          id: tempCustomer.customerId,
          initials,
        };
        setCustomers(prev => [...prev, newCust]);
      }
    } catch (err: any) {
      toast.error('Save failed: ' + (err?.message || 'unknown error'));
      return;
    }
    toast.success(tempCustomer.id ? 'Customer updated' : 'Customer added');
    const freshCustomer = customers.find(c => c.id === tempCustomer.id) || tempCustomer;
    setDraftInvoice(d => ({ ...d, customer: freshCustomer }));
    onClose();
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Customer"
        className="fixed inset-x-4 top-[5%] bottom-[5%] md:left-1/2 md:right-auto md:-translate-x-1/2 md:top-[6%] md:bottom-[6%] bg-white dark:bg-slate-900 rounded-3xl z-[70] overflow-y-auto w-auto max-w-sm md:w-[32rem] md:max-w-lg mx-auto md:mx-0 flex flex-col no-scrollbar border border-gray-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-center justify-between px-7 pt-7 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-gray-50 dark:border-slate-800">
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-200 uppercase tracking-[0.18em]">
            {tempCustomer.id ? 'Update Client' : 'New Client'}
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form className="px-7 py-6 space-y-5 flex-1" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Customer Name</label>
            <input
              type="text" placeholder="e.g. AAA Travel (Central)" value={tempCustomer.name}
              onChange={(e) => { const name = e.target.value; setTempCustomer(p => ({ ...p, name, initials: getInitials(name), whatsappGroup: buildWAGroup(p.customerId, name) })); }}
              className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Client ID <span className="normal-case font-semibold text-gray-400 dark:text-gray-500">(auto)</span></label>
            <input
              type="text" placeholder="1001" value={tempCustomer.customerId}
              onChange={(e) => { const customerId = e.target.value; setTempCustomer(p => ({ ...p, customerId, whatsappGroup: buildWAGroup(customerId, p.name) })); }}
              className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Contact</label>
            <input
              type="text" placeholder="+6011…" value={tempCustomer.contact ?? ''}
              onChange={(e) => setTempCustomer(p => ({ ...p, contact: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Location</label>
            <input
              type="text" placeholder="City / Area" value={tempCustomer.location ?? ''}
              onChange={(e) => setTempCustomer(p => ({ ...p, location: e.target.value }))}
              className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">WhatsApp Group Name <span className="normal-case font-semibold text-gray-400 dark:text-gray-500">(auto)</span></label>
            <div className="flex gap-2">
              <input
                type="text" placeholder="ACT_1001⚡(Name)🔥" value={tempCustomer.whatsappGroup ?? ''}
                onChange={(e) => setTempCustomer(p => ({ ...p, whatsappGroup: e.target.value }))}
                className="flex-1 bg-gray-50 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-900 border border-gray-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 transition-all"
              />
              <button
                type="button"
                onClick={() => { if (tempCustomer.whatsappGroup) navigator.clipboard.writeText(tempCustomer.whatsappGroup); }}
                className="w-12 h-[50px] flex items-center justify-center bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-2xl border border-gray-200 dark:border-slate-700 transition-all flex-shrink-0"
                title="Copy group name"
              >
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Due Amount (RM)</label>
            <input
              type="number" placeholder="0" value={tempCustomer.dueAmount ?? ''}
              onChange={(e) => setTempCustomer(p => ({ ...p, dueAmount: parseFloat(e.target.value) || 0, balance: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3.5 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500/30 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] mt-2 mb-4 hover:scale-[1.02] transition-all shadow-[0_15px_40px_-5px_rgba(16,185,129,0.4)] active:scale-95 flex items-center justify-center gap-2"
          >
            {tempCustomer.id ? (
              <><CheckCircle2 className="w-4 h-4" />UPDATE & SAVE</>
            ) : (
              <><Plus className="w-4 h-4" />CREATE CUSTOMER</>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
