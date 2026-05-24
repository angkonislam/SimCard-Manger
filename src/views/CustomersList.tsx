import { Menu, Search, X, UserPlus, ArrowUpDown } from 'lucide-react';
import { FAB } from '../components/FAB';
import { useApp } from '../AppContext';
import { NotificationCenter } from '../components/NotificationCenter';
import { CustomSelect } from '../components/CustomSelect';
import { ExportMenu } from '../components/ExportMenu';
import { getPrevMonthLabel } from '../utils';

export function CustomersList() {
  const {
    setIsMenuOpen,
    isCustomerSearchOpen, setIsCustomerSearchOpen,
    searchQuery, setSearchQuery,
    customerFilter, setCustomerFilter,
    customerSort, setCustomerSort,
    customers,
    customerLastMonthSales, customerCurrMonthSales,
    setSelectedCustomer, setView,
    openNewCustomerModal,
    can,
  } = useApp();

  const totalDue = customers.reduce((s: number, c: any) => s + (c.dueAmount || 0), 0);
  const totalLastMonth = (Object.values(customerLastMonthSales) as number[]).reduce((s: number, v: number) => s + v, 0);
  const totalCurrMonth = (Object.values(customerCurrMonthSales) as number[]).reduce((s: number, v: number) => s + v, 0);
  const currMonthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const avatarColors = [
    'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400','bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400','bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400',
    'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400','bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400','bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400','bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400','bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400',
  ];

  const filtered = customers.filter((c: any) => {
    const q = searchQuery.toLowerCase();
    if (!q) {
      if (customerFilter === 'Due') return (c.dueAmount || 0) > 0;
      if (customerFilter === 'No due') return (c.dueAmount || 0) === 0;
      if (customerFilter === 'Last sales') return (customerLastMonthSales[c.name] ?? customerLastMonthSales[c.shortName ?? ''] ?? 0) > 0;
      if (customerFilter === 'Last paid') return !!c.lastPaid && c.lastPaid > 0;
      return true;
    }
    return c.name.toLowerCase().includes(q) ||
      (c.shortName || '').toLowerCase().includes(q) ||
      (c.location || '').toLowerCase().includes(q) ||
      (c.whatsappGroup || '').toLowerCase().includes(q) ||
      String(c.customerId).includes(q);
  }).sort((a: any, b: any) => {
    switch (customerSort) {
      case 'due-desc':   return (b.dueAmount || 0) - (a.dueAmount || 0);
      case 'due-asc':    return (a.dueAmount || 0) - (b.dueAmount || 0);
      case 'sales-desc': return (customerLastMonthSales[b.name] ?? customerLastMonthSales[b.shortName ?? ''] ?? 0) - (customerLastMonthSales[a.name] ?? customerLastMonthSales[a.shortName ?? ''] ?? 0);
      case 'sales-asc':  return (customerLastMonthSales[a.name] ?? customerLastMonthSales[a.shortName ?? ''] ?? 0) - (customerLastMonthSales[b.name] ?? customerLastMonthSales[b.shortName ?? ''] ?? 0);
      case 'paid-desc':  return (b.lastPaid || 0) - (a.lastPaid || 0);
      case 'paid-asc':   return (a.lastPaid || 0) - (b.lastPaid || 0);
      case 'name-asc':   return a.name.localeCompare(b.name);
      case 'name-desc':  return b.name.localeCompare(a.name);
      case 'id-asc':     return Number(a.customerId) - Number(b.customerId);
      case 'id-desc':    return Number(b.customerId) - Number(a.customerId);
      default: return 0;
    }
  });

  const fmtDate = (d?: string) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto pb-40 transition-colors">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0">
            <Menu className="w-5 h-5 text-gray-900 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 text-center flex-1">Customers</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setIsCustomerSearchOpen((o: boolean) => !o); if (isCustomerSearchOpen) setSearchQuery(''); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <ExportMenu
              filename="customers"
              title="Customer List"
              headers={['ID','Name','Contact','Location','WhatsApp Group','Status','Due Amount','Last Paid','Last Payment']}
              rows={customers.map((c: any) => ({
                ID: c.customerId,
                Name: c.name,
                Contact: c.contact || '',
                Location: c.location || '',
                'WhatsApp Group': c.whatsappGroup || '',
                Status: c.status || '',
                'Due Amount': c.dueAmount || 0,
                'Last Paid': c.lastPaid || 0,
                'Last Payment': c.lastPaymentDate || '',
              }))}
            />
            <NotificationCenter />
          </div>
        </div>

        {isCustomerSearchOpen && (
          <div className="relative mb-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search name, location, whatsapp group..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-10 text-sm text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
          {['All', 'Due', 'No due', 'Last sales', 'Last paid'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setCustomerFilter(filter);
                const defaultSort: Record<string, string> = {
                  'All': 'id-asc',
                  'Due': 'due-desc',
                  'No due': 'sales-desc',
                  'Last sales': 'sales-desc',
                  'Last paid': 'paid-desc',
                };
                setCustomerSort(defaultSort[filter] ?? 'id-asc');
              }}
              className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                customerFilter === filter
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">TOTAL DUE</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">RM {totalDue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">LAST MTH</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mb-1">{getPrevMonthLabel()}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-200">RM {totalLastMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 shadow-sm">
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">THIS MTH</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mb-1">{currMonthLabel}</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">RM {totalCurrMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">CLIENT LIST <span className="text-gray-400 dark:text-gray-500 font-bold normal-case tracking-normal">({filtered.length})</span></h2>
          <CustomSelect
            value={customerSort}
            onChange={setCustomerSort}
            align="right"
            size="sm"
            options={[
              { value: 'due-desc',   label: 'Due ↓' },
              { value: 'due-asc',    label: 'Due ↑' },
              { value: 'sales-desc', label: 'Sales ↓' },
              { value: 'sales-asc',  label: 'Sales ↑' },
              { value: 'paid-desc',  label: 'Last Paid ↓' },
              { value: 'paid-asc',   label: 'Last Paid ↑' },
              { value: 'name-asc',   label: 'Name A→Z' },
              { value: 'name-desc',  label: 'Name Z→A' },
              { value: 'id-asc',     label: 'ID ↑' },
              { value: 'id-desc',    label: 'ID ↓' },
            ]}
            renderTrigger={(label) => (
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3" />
                <span>{label}</span>
              </span>
            )}
            triggerClassName="inline-flex items-center gap-1 text-[10px] font-black text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 border-0 rounded-full pl-3 pr-3 py-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((customer: any) => {
            const colorClass = avatarColors[Number(customer.customerId) % avatarColors.length];
            const due = customer.dueAmount || 0;
            const statusBadge = due > 0
              ? { label: 'Overdue', cls: 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/30' }
              : customer.lastPaymentDate
                ? { label: 'Paid', cls: 'bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400 border border-green-100 dark:border-green-500/30' }
                : { label: 'No due', cls: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700' };
            return (
              <div
                key={customer.id}
                onClick={() => { setSelectedCustomer(customer); setView('customer-details'); }}
                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all active:scale-[0.98] cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-md dark:hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${colorClass}`}>
                      {customer.initials || '??'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-200 text-sm leading-tight truncate">{customer.name}</h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5 truncate">
                        ID-{customer.customerId} · Updated: {(() => {
                          const d = customer.lastPaymentDate;
                          if (!d) return 'No date';
                          const dt = new Date(d);
                          if (isNaN(dt.getTime())) return d;
                          return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                        })()}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black ${statusBadge.cls}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 bg-gray-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5 border border-gray-100/50 dark:border-slate-800/50">
                  <div>
                    <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">Due</p>
                    {due > 0
                      ? <p className="text-xs font-black text-red-600 dark:text-red-400">RM {due.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      : <p className="text-xs font-bold text-gray-400 dark:text-gray-500 italic">—</p>}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">Last Mth</p>
                    {(() => {
                      const val = customerLastMonthSales[customer.name] ?? customerLastMonthSales[customer.shortName ?? ''];
                      return val != null && val > 0
                        ? <p className="text-xs font-black text-gray-800 dark:text-gray-300">RM {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        : <p className="text-xs font-bold text-gray-400 dark:text-gray-500">RM 0</p>;
                    })()}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">This Mth</p>
                    {(() => {
                      const val = customerCurrMonthSales[customer.name] ?? customerCurrMonthSales[customer.shortName ?? ''] ?? 0;
                      return <p className={`text-xs font-black ${val > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>RM {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>;
                    })()}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">Last Paid</p>
                    {fmtDate(customer.lastPaymentDate)
                      ? <p className="text-xs font-black text-gray-800 dark:text-gray-300">{fmtDate(customer.lastPaymentDate)}</p>
                      : <p className="text-xs font-bold text-gray-400 dark:text-gray-500 italic">No data</p>}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No customers found</p>
            </div>
          )}
        </div>
      </div>

      {can?.('edit:data') && (
        <FAB actions={[
          { label: 'New Customer', icon: <UserPlus className="w-5 h-5" />, onClick: openNewCustomerModal },
        ]} />
      )}
    </div>
  );
}
