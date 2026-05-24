import { ChevronLeft, Check, Plus, Calendar, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NotificationCenter } from '../components/NotificationCenter';
import { Customer, LineItem } from '../types';
import { getInitials, buildWAGroup } from '../utils';

export function CreateInvoice() {
  const {
    view, setView,
    draftInvoice, setDraftInvoice,
    setCustomerPickerSearch, setIsCustomerPickerOpen,
    isInlineAddingCustomer, setIsInlineAddingCustomer,
    tempCustomer, setTempCustomer,
    customers, setCustomers,
    salesRows, fromDate, toDate,
    editingItemId, setEditingItemId,
    newItemDesc, setNewItemDesc,
    newItemQty, setNewItemQty,
    newItemPrice, setNewItemPrice,
    dbProducts,
    calculateTotals, finalizeInvoice,
    saveDraft, editingDraftId,
  } = useApp();

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-24 bg-white dark:bg-slate-950 transition-colors">
      <div className="flex flex-col items-center pt-2">
        <div className="w-full flex items-center justify-between px-2 mb-4">
          <button
            onClick={() => {
              if (view === 'create-details') setView('analytics');
              if (view === 'create-items') setView('create-details');
              if (view === 'create-review') setView('create-items');
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-gray-300" />
          </button>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-200">Create Invoice</h2>
          <NotificationCenter />
        </div>

        <div className="w-full h-px bg-gray-100 dark:bg-slate-800 mb-10" />

        <div className="w-full px-8 mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 dark:bg-slate-800 -z-0" />
            {[
              { label: 'Details', v: 'create-details', step: 1 },
              { label: 'Items', v: 'create-items', step: 2 },
              { label: 'Review', v: 'create-review', step: 3 },
            ].map((s, idx) => {
              const isActive = view === s.v;
              const isCompleted = (view === 'create-items' && idx === 0) || (view === 'create-review' && (idx === 0 || idx === 1));
              const canJump = isCompleted && !isActive;
              return (
                <div key={s.v} className="flex flex-col items-center relative z-10">
                  {idx > 0 && (
                    <div className="absolute top-4 bg-gray-100 dark:bg-slate-800 -z-10" style={{ right: 'calc(50% + 16px)', width: 'calc(100% - 32px)', height: '1px' }} />
                  )}
                  {idx > 0 && (view === 'create-items' || view === 'create-review') && idx === 1 && (
                    <div className="absolute top-4 bg-gradient-to-r from-emerald-500 to-blue-500 -z-10 transition-all duration-500" style={{ right: 'calc(50% + 16px)', width: 'calc(100% - 32px)', height: '1px' }} />
                  )}
                  {idx > 0 && (view === 'create-review') && idx === 2 && (
                    <div className="absolute top-4 bg-gradient-to-r from-emerald-500 to-blue-500 -z-10 transition-all duration-500" style={{ right: 'calc(50% + 16px)', width: 'calc(100% - 32px)', height: '1px' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => { if (canJump) setView(s.v as any); }}
                    disabled={!canJump}
                    aria-label={`Go to ${s.label}`}
                    aria-current={isActive ? 'step' : undefined}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${isActive || isCompleted ? 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'} ${canJump ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                  >
                    {isCompleted && !isActive ? <Check className="w-4 h-4" /> : s.step}
                  </button>
                  <span className={`text-[10px] font-bold tracking-tight mt-2 transition-colors duration-300 uppercase ${isActive || isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {view === 'create-details' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer Details</label>

            {draftInvoice.customer?.name ? (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    {getInitials(draftInvoice.customer?.name)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-0.5">ID: {draftInvoice.customer?.customerId}</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-200">{draftInvoice.customer?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{draftInvoice.customer?.contact}</p>
                  </div>
                </div>
                <button onClick={() => { setCustomerPickerSearch(''); setIsCustomerPickerOpen(true); }} className="text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:underline">
                  Change
                </button>
              </div>
            ) : isInlineAddingCustomer ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 animate-in fade-in duration-200">
                <input type="text" placeholder="Client ID"
                  value={tempCustomer.customerId}
                  onChange={e => {
                    const customerId = e.target.value;
                    const match = customers.find((c: any) => c.customerId === customerId.trim());
                    if (match) setTempCustomer({ ...match });
                    else setTempCustomer((p: any) => ({ ...p, customerId, whatsappGroup: buildWAGroup(customerId, p.name) }));
                  }}
                  className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                <div className="relative">
                  <input type="text" placeholder="Customer Name"
                    value={tempCustomer.name}
                    onChange={e => {
                      const name = e.target.value;
                      const match = customers.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
                      if (match) setTempCustomer({ ...match });
                      else setTempCustomer((p: any) => ({ ...p, name, initials: getInitials(name), whatsappGroup: buildWAGroup(p.customerId, name) }));
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                  {tempCustomer.name.trim().length >= 1 && (() => {
                    const q = tempCustomer.name.toLowerCase();
                    const suggestions = customers.filter((c: any) => c.name.toLowerCase().includes(q) && c.name.toLowerCase() !== q).slice(0, 5);
                    if (suggestions.length === 0) return null;
                    return (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden">
                        {suggestions.map((c: any) => (
                          <button key={c.id} type="button" onMouseDown={e => { e.preventDefault(); setTempCustomer({ ...c }); }}
                            className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-300">{c.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">ID: {c.customerId}{c.location ? ` · ${c.location}` : ''}</p>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <input type="text" placeholder="Contact (+6011…)" value={tempCustomer.contact ?? ''}
                  onChange={e => setTempCustomer((p: any) => ({ ...p, contact: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                <input type="text" placeholder="Location" value={tempCustomer.location ?? ''}
                  onChange={e => setTempCustomer((p: any) => ({ ...p, location: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                <input type="text" placeholder="WhatsApp Group Name" value={tempCustomer.whatsappGroup ?? ''}
                  onChange={e => setTempCustomer((p: any) => ({ ...p, whatsappGroup: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-100 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={async () => {
                      if (!tempCustomer.name.trim()) return;
                      const words = tempCustomer.name.trim().split(/\s+/);
                      const initials = words.slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
                      const numericId = parseInt(tempCustomer.customerId, 10);
                      const newCust: Customer = { ...tempCustomer, id: tempCustomer.customerId, initials };
                      if (isSupabaseConfigured) {
                        await supabase.from('Client_Details').insert({
                          'Client ID': numericId || null,
                          'Customer Name': newCust.name,
                          'Short Name': newCust.shortName || '',
                          'Contact': newCust.contact || '',
                          'Location': newCust.location || '',
                          'Whatsapp Group Name': newCust.whatsappGroup || '',
                          'Due Amount??': 0,
                        });
                        const { data } = await supabase.from('Client_Details').select('*').order('Client ID', { ascending: true });
                        if (data) {
                          const mapped = data.map((row: Record<string, unknown>) => {
                            const fullName = String(row['Customer Name'] ?? '');
                            const w = fullName.trim().split(/\s+/);
                            const lpDateKey = Object.keys(row).find(x => x.toLowerCase().includes('last payment date') || x.toLowerCase().includes('payment date'));
                            const lpPaidKey = Object.keys(row).find(x => x.toLowerCase().includes('last paid'));
                            return { id: String(row['Client ID']), customerId: String(row['Client ID']), name: fullName, shortName: String(row['Short Name'] ?? ''), email: '', initials: w.slice(0, 2).map((x: string) => x[0]?.toUpperCase() ?? '').join(''), contact: row['Contact'] ? String(row['Contact']) : undefined, location: row['Location'] ? String(row['Location']) : undefined, whatsappGroup: row['Whatsapp Group Name'] ? String(row['Whatsapp Group Name']) : undefined, balance: Number(row['Due Amount??'] ?? 0), dueAmount: Number(row['Due Amount??'] ?? 0), group: 'Standard', lastPaymentDate: lpDateKey && row[lpDateKey] ? String(row[lpDateKey]).substring(0, 10) : undefined, lastPaid: lpPaidKey && row[lpPaidKey] != null ? Number(row[lpPaidKey]) : undefined };
                          });
                          setCustomers(mapped as Customer[]);
                          const found = mapped.find((c: Customer) => c.name === newCust.name);
                          if (found) setDraftInvoice((d: any) => ({ ...d, customer: found as Customer }));
                        }
                      } else {
                        setCustomers((prev: Customer[]) => [...prev, newCust]);
                        setDraftInvoice((d: any) => ({ ...d, customer: newCust }));
                      }
                      setIsInlineAddingCustomer(false);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95"
                  >Save</button>
                  <button onClick={() => setIsInlineAddingCustomer(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTempCustomer({ id: '', customerId: '', name: '', shortName: '', email: '', initials: '', contact: '', location: '', whatsappGroup: '', group: 'Standard', balance: 0, dueAmount: 0 });
                  setIsInlineAddingCustomer(true);
                }}
                className="p-10 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all hover:border-emerald-300 dark:hover:border-emerald-500/30 bg-gray-50/30 dark:bg-slate-800/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Tap to add customer</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Number</label>
            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-gray-400 text-sm">
              {draftInvoice.invoiceNumber}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
            <CustomDatePicker value={draftInvoice.issueDate || ''} onChange={(val: string) => setDraftInvoice({ ...draftInvoice, issueDate: val })} align="left">
              <div className="relative group cursor-pointer h-[58px]">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors z-10" />
                <div className="absolute inset-0 pl-11 pr-4 flex items-center bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-gray-300 text-sm font-bold transition-all group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30">
                  {draftInvoice.issueDate ? new Date(draftInvoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
                </div>
              </div>
            </CustomDatePicker>
          </div>

          {draftInvoice.customer?.name && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-lg">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Due Amount</p>
                  {draftInvoice.customer.dueAmount != null
                    ? <p className={`text-sm font-bold ${draftInvoice.customer.dueAmount > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-emerald-400'}`}>RM {draftInvoice.customer.dueAmount.toLocaleString()}</p>
                    : <p className="text-sm font-bold text-gray-400 dark:text-gray-500">—</p>}
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-lg">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Monthly Sales</p>
                  {(() => {
                    const total = salesRows
                      .filter((r: any) => r.customer_name === draftInvoice.customer!.name && (!fromDate || r.date >= fromDate) && (!toDate || r.date <= toDate))
                      .reduce((s: number, r: any) => s + r.qty * r.rate, 0);
                    const label = fromDate || toDate
                      ? `${fromDate ? fromDate.split('-').reverse().join('-') : '...'} → ${toDate ? toDate.split('-').reverse().join('-') : '...'}`
                      : 'All Time';
                    return <><p className="text-sm font-bold text-gray-900 dark:text-gray-200">RM {total.toLocaleString()}</p><p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{label}</p></>;
                  })()}
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-lg">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Last Payment</p>
                  {draftInvoice.customer.lastPaymentDate
                    ? <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{new Date(draftInvoice.customer.lastPaymentDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    : <p className="text-sm font-bold text-gray-400 dark:text-gray-500">—</p>}
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-lg">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Last Paid</p>
                  {draftInvoice.customer.lastPaid != null
                    ? <p className="text-sm font-bold text-gray-900 dark:text-gray-200">RM {draftInvoice.customer.lastPaid.toLocaleString()}</p>
                    : <p className="text-sm font-bold text-gray-400 dark:text-gray-500">—</p>}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes <span className="font-normal lowercase text-gray-400">(optional)</span></label>
            <textarea
              placeholder="Add payment instructions or notes..."
              value={draftInvoice.notes ?? ''}
              onChange={e => setDraftInvoice((d: any) => ({ ...d, notes: e.target.value }))}
              className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-300 text-sm shadow-sm dark:shadow-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-8 z-10 lg:relative lg:bottom-auto lg:left-auto lg:translate-x-0 lg:mt-6 lg:px-0 lg:max-w-none lg:mb-8">
            <button
              onClick={() => setView('create-items')}
              disabled={!draftInvoice.customer?.name}
              className={`w-full h-16 rounded-2xl flex items-center justify-between px-8 font-bold shadow-2xl transition-all active:scale-[0.98] group ${draftInvoice.customer?.name ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:scale-[1.02]' : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'}`}
            >
              <span>Item Entry</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={draftInvoice.customer?.name ? { backgroundColor: 'rgba(255, 255, 255, 0.2)' } : { backgroundColor: 'rgba(209, 213, 219, 0.3)' }}>
                <Plus className="w-5 h-5 rotate-45" />
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'create-items' && (
        <div className="space-y-8">
          <h3 className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-[0.2em] ml-1">Order Inventory</h3>

          <div className="space-y-4">
            {draftInvoice.items?.map((item: any) => (
              <div key={item.id} className="p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center justify-between transition-all hover:shadow-lg dark:hover:shadow-xl shadow-sm dark:shadow-lg">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200 tracking-tight">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20 px-2 py-0.5 rounded-lg">{item.quantity} Quantity</span>
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">@ RM {item.unitPrice.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">RM {(item.quantity * item.unitPrice).toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingItemId(item.id);
                        setNewItemDesc(item.description);
                        setNewItemQty(item.quantity);
                        setNewItemPrice(item.unitPrice.toString());
                      }}
                      className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const newItems = draftInvoice.items?.filter((i: any) => i.id !== item.id) || [];
                        setDraftInvoice({ ...draftInvoice, items: newItems, ...calculateTotals(newItems, draftInvoice.vat) });
                        if (editingItemId === item.id) {
                          setEditingItemId(null);
                          setNewItemDesc(''); setNewItemQty(1); setNewItemPrice('');
                        }
                      }}
                      className="p-2.5 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border border-gray-100 dark:border-slate-800 rounded-2xl space-y-6 bg-white dark:bg-slate-900 shadow-sm dark:shadow-lg">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">New Entry Setup</p>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-4">Product</label>
              <CustomSelect
                value={newItemDesc}
                onChange={setNewItemDesc}
                placeholder="Select Product"
                searchable
                size="lg"
                options={dbProducts.map((p: any) => ({ value: p.name, label: p.name }))}
                triggerClassName="w-full flex items-center justify-between gap-2 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-300 rounded-xl text-sm font-semibold hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-4">Quantity</label>
                <input type="number" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value) || 1)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-4">Rate</label>
                <input type="number" placeholder="0.00" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
            </div>
            <button
              onClick={() => {
                const p = parseFloat(newItemPrice);
                if (!newItemDesc || isNaN(p)) return;
                let newItems;
                if (editingItemId) {
                  newItems = (draftInvoice.items || []).map((item: any) =>
                    item.id === editingItemId ? { ...item, description: newItemDesc, quantity: newItemQty, unitPrice: p } : item
                  );
                  setEditingItemId(null);
                } else {
                  const newItem: LineItem = { id: Math.random().toString(36).substring(2, 9), description: newItemDesc, quantity: newItemQty, unitPrice: p };
                  newItems = [...(draftInvoice.items || []), newItem];
                }
                setDraftInvoice({ ...draftInvoice, items: newItems, ...calculateTotals(newItems, draftInvoice.vat) });
                setNewItemDesc(''); setNewItemQty(1); setNewItemPrice('');
              }}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-emerald-500/30 transition-all active:scale-95"
            >
              {editingItemId ? 'Update Entry' : 'Append Entry'}
            </button>
          </div>

          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl mx-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Valuation</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">RM {(draftInvoice.total ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-8 z-10 lg:relative lg:bottom-auto lg:left-auto lg:translate-x-0 lg:mt-6 lg:px-0 lg:max-w-none lg:mb-8">
            <button
              onClick={() => setView('create-review')}
              disabled={(draftInvoice.items?.length || 0) === 0}
              className={`w-full h-18 rounded-2xl flex items-center justify-between px-8 font-bold transition-all active:scale-[0.98] group ${(draftInvoice.items?.length || 0) > 0 ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:scale-[1.02]' : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
              style={{ boxShadow: '0 20px 50px rgba(16,185,129,0.25)' }}
            >
              <span className="text-base tracking-tight">Review & Publish</span>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <ArrowRight className="w-6 h-6" />
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'create-review' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 space-y-8 shadow-sm dark:shadow-lg">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">INVOICE</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 tracking-tight">{draftInvoice.invoiceNumber}</h2>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Issue Date</p>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-bold text-gray-900 dark:text-gray-300">
                  {draftInvoice.issueDate ? new Date(draftInvoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">BILL TO</p>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shadow-sm">
                    {getInitials(draftInvoice.customer?.name)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-0.5">ID: {draftInvoice.customer?.customerId}</p>
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-200 leading-none mb-1">{draftInvoice.customer?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{draftInvoice.customer?.contact}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-800 pb-2">
                <span>DESCRIPTION</span>
                <span>LINE TOTAL</span>
              </div>
              <div className="space-y-6">
                {draftInvoice.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-200 tracking-tight mb-1">{item.description}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{item.quantity} qty RM {item.unitPrice.toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-200">RM {(item.quantity * item.unitPrice).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-gray-200">RM {draftInvoice.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Return</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500">RM</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={draftInvoice.vat || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      const { subtotal, total } = calculateTotals(draftInvoice.items || [], val);
                      setDraftInvoice({ ...draftInvoice, vat: val, subtotal, total });
                    }}
                    className="w-20 px-2 py-1 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-300 border border-gray-100 dark:border-slate-700 rounded-lg text-right text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Total Due</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">RM {(draftInvoice.total ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-8 z-10 lg:relative lg:bottom-auto lg:left-auto lg:translate-x-0 lg:mt-6 lg:px-0 lg:max-w-none lg:mb-8 space-y-3">
            <button
              onClick={saveDraft}
              className="w-full h-12 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-2xl flex items-center justify-center font-bold shadow-sm hover:bg-amber-100 dark:hover:bg-amber-500/25 transition-all active:scale-[0.98]"
            >
              <span className="text-xs uppercase tracking-[0.15em]">{editingDraftId ? 'Update Draft' : 'Save as Draft'}</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => finalizeInvoice()} className="h-16 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-300 rounded-2xl flex items-center justify-center font-bold shadow-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]">
                <span className="text-sm uppercase tracking-[0.1em]">Save</span>
              </button>
              <button onClick={() => finalizeInvoice({ withPdf: true })} className="h-16 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98]">
                <span className="text-sm uppercase tracking-[0.1em]">Save And PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
