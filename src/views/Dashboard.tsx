import { Menu, MoreHorizontal, Search, Calendar, FileText, Pencil, Trash2, FileClock } from 'lucide-react';
import { FAB } from '../components/FAB';
import { useApp } from '../AppContext';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { NotificationCenter } from '../components/NotificationCenter';
import { useConfirm } from '../components/ConfirmDialog';
import { getInitials } from '../utils';

export function Dashboard() {
  const {
    setIsMenuOpen,
    searchQuery, setSearchQuery,
    fromDate, setFromDate,
    toDate, setToDate,
    dataDateRange,
    filteredInvoices,
    setSelectedInvoice, setView,
    handleCreateNew,
    drafts, loadDraft, deleteDraft,
  } = useApp();
  const { confirm } = useConfirm();

  return (
    <div key="dashboard" className="flex-1 flex flex-col p-6 overflow-y-auto pb-24 bg-white dark:bg-slate-950 transition-colors">
      {/* Header */}
      <div className="flex flex-col items-center pt-2 mb-8">
        <div className="w-full flex items-center justify-between px-2 mb-5">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-900 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Invoices</h1>
          <div className="flex items-center gap-1">
            <NotificationCenter
              buttonClass="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
              iconClass="w-5 h-5 text-gray-900 dark:text-gray-300"
              dotClass="absolute top-1 right-1"
            />
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-900 dark:text-gray-300" />
            </button>
          </div>
        </div>
        <div className="w-full h-px bg-gray-100 dark:bg-slate-800" />
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-10">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 transition-all font-normal text-sm"
          />
        </div>

        {/* Date filters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block ml-1 tracking-widest">From</label>
            <CustomDatePicker value={fromDate} onChange={setFromDate} align="left" minDate={dataDateRange.min || undefined} maxDate={dataDateRange.max || undefined}>
              <div className="relative group cursor-pointer h-[46px]">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 z-10 transition-colors" />
                <div className="absolute inset-0 pl-10 pr-4 flex items-center bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs text-gray-900 dark:text-gray-300 transition-all group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30">
                  {fromDate ? fromDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}
                </div>
              </div>
            </CustomDatePicker>
          </div>
          <div className="relative">
            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block ml-1 tracking-widest">To</label>
            <CustomDatePicker value={toDate} onChange={setToDate} align="right" minDate={dataDateRange.min || undefined} maxDate={dataDateRange.max || undefined}>
              <div className="relative group cursor-pointer h-[46px]">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 z-10 transition-colors" />
                <div className="absolute inset-0 pl-10 pr-4 flex items-center bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs text-gray-900 dark:text-gray-300 transition-all group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30">
                  {toDate ? toDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}
                </div>
              </div>
            </CustomDatePicker>
          </div>
        </div>
      </div>

      {/* Drafts section */}
      {drafts && drafts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <FileClock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <h2 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Drafts</h2>
            </div>
            <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-bold tracking-widest border border-amber-200 dark:border-amber-500/30">
              {drafts.length} PENDING
            </div>
          </div>
          <div className="space-y-2.5">
            {drafts.map((d: any) => (
              <div
                key={d.id}
                className="p-4 bg-amber-50/40 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/25 rounded-2xl transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/40 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => loadDraft(d)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <FileClock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-gray-900 dark:text-gray-200 text-sm truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                          {d.customer_data?.name || 'No customer'}
                        </h3>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                        {d.invoice_number} · {(d.items?.length ?? 0)} item{(d.items?.length ?? 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total</p>
                      <p className="font-bold text-sm text-amber-700 dark:text-amber-300">RM {Number(d.total ?? 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => loadDraft(d)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all active:scale-90"
                      aria-label="Edit draft"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete draft',
                          message: `Delete draft ${d.invoice_number}?`,
                          confirmText: 'Delete',
                          danger: true,
                        });
                        if (ok) deleteDraft(d.id);
                      }}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all active:scale-90"
                      aria-label="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Invoices</h2>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold tracking-widest">
          {filteredInvoices.length} RECORDS
        </div>
      </div>

      {/* Invoice list */}
      <div className="space-y-3 pb-32">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No invoices found</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          filteredInvoices.map((inv: any) => (
            <div
              key={inv.id}
              onClick={() => { setSelectedInvoice(inv); setView('invoice-preview'); }}
              className="p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl transition-all cursor-pointer group hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-md dark:hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {/* Top row: Avatar, Name, ID */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 flex items-center justify-center font-bold text-sm text-emerald-700 dark:text-emerald-400 group-hover:from-emerald-500/30 group-hover:to-blue-500/30 transition-all">
                    {getInitials(inv.customer.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-200 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {inv.customer.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
                      {inv.invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-gray-200 dark:border-slate-700">
                  ID: {inv.customer.customerId}
                </div>
              </div>

              {/* Bottom row: Amount and date */}
              <div className="flex justify-between items-end p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 border border-gray-100 dark:border-slate-800/50">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest">Amount</p>
                  <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">RM {inv.total.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-widest">Date</p>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs">
                    {new Date(inv.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <FAB actions={[
        { label: 'Create Invoice', icon: <FileText className="w-5 h-5" />, onClick: handleCreateNew },
      ]} />
    </div>
  );
}
