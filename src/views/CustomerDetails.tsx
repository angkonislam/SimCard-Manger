import { ChevronLeft, Trash2, Edit2, Phone, MapPin, Users, Info, Calendar } from 'lucide-react';
import { useApp } from '../AppContext';
import { Customer } from '../types';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { NotificationCenter } from '../components/NotificationCenter';

export function CustomerDetails() {
  const {
    selectedCustomer, setView,
    editingSection, setEditingSection,
    editDraft, setEditDraft,
    isSavingCustomer,
    deleteConfirm, setDeleteConfirm,
    customerLastMonthSales,
    saveCustomerSection, deleteCustomer,
    can,
  } = useApp();

  if (!selectedCustomer) return null;

  const avatarColors = ['bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400', 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400', 'bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400', 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400', 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto pb-10 transition-colors">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-950 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setView('customers-list'); setEditingSection(null); setEditDraft({}); setDeleteConfirm(false); }}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors border border-gray-100 dark:border-slate-800 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-gray-300" />
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-200">Customer detail</h1>
        </div>
        <div className="flex items-center gap-1.5">
          {can?.('delete:data') && (deleteConfirm ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setDeleteConfirm(false)} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={deleteCustomer} className="text-[10px] font-bold text-white bg-red-500 px-3 py-1.5 rounded-xl hover:bg-red-600 transition-colors">Delete</button>
            </div>
          ) : (
            <button onClick={() => setDeleteConfirm(true)} className="w-9 h-9 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/20 rounded-full transition-colors border border-gray-100 dark:border-slate-800 group">
              <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
            </button>
          ))}
          <NotificationCenter />
        </div>
      </div>
      {deleteConfirm && (
        <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/30 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 flex-1">Delete <span className="font-black">{selectedCustomer.name}</span>? This removes the entry. Client ID <span className="font-black">#{selectedCustomer.customerId}</span> becomes available for reuse.</p>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col items-center mb-8 border-b border-gray-100 dark:border-slate-800 pb-8 mt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg mb-3 ${avatarColors[Number(selectedCustomer.customerId) % 5]}`}>
            {selectedCustomer.initials || '??'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-0.5 text-center">{selectedCustomer.name}</h2>
          {selectedCustomer.shortName && selectedCustomer.shortName !== selectedCustomer.name && (
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">"{selectedCustomer.shortName}"</p>
          )}
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Client #{selectedCustomer.customerId}</p>
          <div className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
            (selectedCustomer.dueAmount || 0) > 0 ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400'
          }`}>
            {(selectedCustomer.dueAmount || 0) > 0 ? 'Has Balance Due' : selectedCustomer.status || 'Active'}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 ml-1">
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">CONTACT INFO</h3>
            {editingSection === 'contact' ? (
              <div className="flex gap-2">
                <button onClick={() => { setEditingSection(null); setEditDraft({}); }} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-3 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700">Cancel</button>
                <button onClick={saveCustomerSection} disabled={isSavingCustomer} className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-blue-500 px-3 py-1 rounded-lg disabled:opacity-50">{isSavingCustomer ? 'Saving…' : 'Save'}</button>
              </div>
            ) : can?.('edit:data') ? (
              <button onClick={() => { setEditingSection('contact'); setEditDraft({ contact: selectedCustomer.contact, location: selectedCustomer.location, whatsappGroup: selectedCustomer.whatsappGroup, status: selectedCustomer.status }); }} className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : null}
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50 dark:divide-slate-800">
            {[
              { icon: <Phone className="w-5 h-5" />, label: 'Contact', field: 'contact' as keyof Customer, value: selectedCustomer.contact, iconBg: 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700', type: 'text' },
              { icon: <MapPin className="w-5 h-5" />, label: 'Location', field: 'location' as keyof Customer, value: selectedCustomer.location, iconBg: 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700', type: 'text' },
              { icon: <Users className="w-5 h-5" />, label: 'WhatsApp Group', field: 'whatsappGroup' as keyof Customer, value: selectedCustomer.whatsappGroup, iconBg: 'bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400 border-green-100 dark:border-green-500/30', type: 'text' },
              { icon: <Info className="w-5 h-5" />, label: 'Status', field: 'status' as keyof Customer, value: selectedCustomer.status, iconBg: 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700', type: 'text' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${row.iconBg}`}>{row.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">{row.label}</p>
                  {editingSection === 'contact' ? (
                    <input
                      type={row.type}
                      value={(editDraft[row.field] as string) ?? ''}
                      onChange={e => setEditDraft((d: any) => ({ ...d, [row.field]: e.target.value }))}
                      placeholder={`Enter ${row.label.toLowerCase()}`}
                      onKeyDown={e => { if (e.key === 'Enter') saveCustomerSection(); }}
                      className="w-full text-sm font-bold text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  ) : (
                    row.value
                      ? <p className="text-sm font-bold text-gray-900 dark:text-gray-300">{row.value}</p>
                      : <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">No data</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 ml-1">
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">FINANCIAL KPIs</h3>
            {editingSection === 'financial' ? (
              <div className="flex gap-2">
                <button onClick={() => { setEditingSection(null); setEditDraft({}); }} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-3 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700">Cancel</button>
                <button onClick={saveCustomerSection} disabled={isSavingCustomer} className="text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-blue-500 px-3 py-1 rounded-lg disabled:opacity-50">{isSavingCustomer ? 'Saving…' : 'Save'}</button>
              </div>
            ) : can?.('edit:data') ? (
              <button onClick={() => { setEditingSection('financial'); setEditDraft({ dueAmount: selectedCustomer.dueAmount, lastMonthSales: selectedCustomer.lastMonthSales, lastPaid: selectedCustomer.lastPaid, lastPaymentDate: selectedCustomer.lastPaymentDate }); }} className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">DUE AMOUNT</p>
              {editingSection === 'financial' ? (
                <input type="number" value={editDraft.dueAmount ?? ''} onChange={e => setEditDraft((d: any) => ({ ...d, dueAmount: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0.00" onKeyDown={e => { if (e.key === 'Enter') saveCustomerSection(); }} className="w-full text-2xl font-black text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/30" />
              ) : (
                <p className={`text-3xl font-black tracking-tight ${(selectedCustomer.dueAmount || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-emerald-400'}`}>
                  RM {(selectedCustomer.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">LAST 30 DAYS SALES</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-2">Auto from Sales_Data</p>
                {(() => {
                  const val = customerLastMonthSales[selectedCustomer.name] ?? customerLastMonthSales[selectedCustomer.shortName ?? ''];
                  return val != null && val > 0
                    ? <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">RM {val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    : <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">No data</p>;
                })()}
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">LAST PAID</p>
                {editingSection === 'financial' ? (
                  <input type="number" value={editDraft.lastPaid ?? ''} onChange={e => setEditDraft((d: any) => ({ ...d, lastPaid: e.target.value === '' ? undefined : Number(e.target.value) }))} placeholder="0.00" onKeyDown={e => { if (e.key === 'Enter') saveCustomerSection(); }} className="w-full text-sm font-bold text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/30" />
                ) : selectedCustomer.lastPaid != null
                  ? <p className="text-lg font-black text-green-600 dark:text-emerald-400">RM {selectedCustomer.lastPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  : <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">No data</p>}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">LAST PAYMENT DATE</p>
              {editingSection === 'financial' ? (
                <CustomDatePicker value={editDraft.lastPaymentDate ?? ''} onChange={(v: string) => setEditDraft((d: any) => ({ ...d, lastPaymentDate: v }))} align="left">
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-300">{editDraft.lastPaymentDate ? editDraft.lastPaymentDate.split('-').reverse().join('-') : 'Pick date'}</span>
                  </div>
                </CustomDatePicker>
              ) : selectedCustomer.lastPaymentDate
                ? <p className="text-base font-bold text-gray-900 dark:text-gray-300">{(() => {
                  const dt = new Date(selectedCustomer.lastPaymentDate!);
                  if (isNaN(dt.getTime())) return selectedCustomer.lastPaymentDate;
                  const day = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const weekday = dt.toLocaleDateString('en-GB', { weekday: 'long' });
                  return `${day}, ${weekday}`;
                })()}</p>
                : <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 italic">No data</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
