import { Menu, ArrowUpRight, ArrowDownLeft, Search, Calendar, TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { FAB } from '../components/FAB';
import { useApp } from '../AppContext';
import { NotificationCenter } from '../components/NotificationCenter';
import { ExportMenu } from '../components/ExportMenu';

export function MoneyTracking() {
  const {
    setIsMenuOpen,
    transactions,
    moneySearchQuery, setMoneySearchQuery,
    moneyFilter, setMoneyFilter,
    setTransactionType, setTempTransaction, setIsTransactionModalOpen,
    deleteTransaction,
    can,
  } = useApp();

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto pb-40 transition-colors">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-900 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 text-center flex-1">Money Tracking</h1>
          <div className="flex items-center gap-1">
            <ExportMenu
              filename="transactions"
              title="Money Tracking"
              headers={['Date','Type','Category','Description','Amount','Status']}
              rows={transactions.map((t: any) => ({
                Date: t.date,
                Type: t.type,
                Category: t.category,
                Description: t.description,
                Amount: t.amount,
                Status: t.status,
              }))}
            />
            <NotificationCenter />
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-2">Net Cash Flow</p>
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-4xl font-black tracking-tight">RM {transactions.reduce((sum: number, t: any) => t.type === 'Income' ? sum + t.amount : sum - t.amount, 0).toLocaleString()}</h2>
              <div className="flex items-center gap-1 bg-green-500/30 text-green-100 px-2 py-1 rounded-lg text-[10px] font-bold mb-1.5">
                <TrendingUp className="w-3 h-3" /> +12.4%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Total Income</p>
                </div>
                <p className="font-bold text-sm">RM {transactions.filter((t: any) => t.type === 'Income').reduce((sum: number, t: any) => sum + t.amount, 0).toLocaleString()}</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full" />
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Total Expenses</p>
                </div>
                <p className="font-bold text-sm">RM {transactions.filter((t: any) => t.type === 'Expense').reduce((sum: number, t: any) => sum + t.amount, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={moneySearchQuery}
              onChange={(e) => setMoneySearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
            />
          </div>
          <button className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
          {['All', 'Income', 'Expense', 'Completed', 'Pending'].map((filter) => (
            <button
              key={filter}
              onClick={() => setMoneyFilter(filter)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                moneyFilter === filter
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">LATEST HISTORY</h2>
          <div className="px-3 py-1 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black tracking-widest uppercase">LAST 30 DAYS</div>
        </div>

        <div className="space-y-3">
          {transactions.filter((t: any) => {
            const matchesSearch = t.description.toLowerCase().includes(moneySearchQuery.toLowerCase()) ||
              t.category.toLowerCase().includes(moneySearchQuery.toLowerCase());
            const matchesFilter = moneyFilter === 'All' || t.type === moneyFilter || t.status === moneyFilter;
            return matchesSearch && matchesFilter;
          }).map((t: any) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-md dark:hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                    t.type === 'Income' ? 'bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                  }`}>
                    {t.type === 'Income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-200 text-sm truncate">{t.description}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t.category}</span>
                      <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-1">
                    <p className={`font-black text-sm ${t.type === 'Income' ? 'text-green-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {t.type === 'Income' ? '+' : '-'} RM {t.amount.toLocaleString()}
                    </p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                      t.status === 'Completed' ? 'text-gray-400 dark:text-gray-500' : 'text-amber-500 dark:text-amber-400'
                    }`}>{t.status}</p>
                  </div>
                  {can?.('manage:money') && (
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionType(t.type);
                        setTempTransaction({ id: t.id, date: t.date, amount: String(t.amount), description: t.description, category: t.category } as any);
                        setIsTransactionModalOpen(true);
                      }}
                      className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all active:scale-90"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {can?.('delete:data') && (
                    <button
                      type="button"
                      onClick={() => deleteTransaction(t.id)}
                      className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {can?.('manage:money') && (
        <FAB actions={[
          {
            label: 'Add Expense',
            icon: <TrendingDown className="w-5 h-5" />,
            variant: 'red',
            onClick: () => {
              setTransactionType('Expense');
              setTempTransaction({ date: new Date().toISOString().split('T')[0], amount: '', description: '', category: 'Other' } as any);
              setIsTransactionModalOpen(true);
            },
          },
          {
            label: 'Add Income',
            icon: <TrendingUp className="w-5 h-5" />,
            variant: 'green',
            onClick: () => {
              setTransactionType('Income');
              setTempTransaction({ date: new Date().toISOString().split('T')[0], amount: '', description: '', category: 'Other' } as any);
              setIsTransactionModalOpen(true);
            },
          },
        ]} />
      )}
    </div>
  );
}
