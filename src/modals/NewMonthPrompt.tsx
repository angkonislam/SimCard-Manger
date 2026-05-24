import { X } from 'lucide-react';
import { useApp } from '../AppContext';
import { getMonthKey } from '../utils';

export function NewMonthPrompt() {
  const {
    setShowNewMonthPrompt,
    lastMonthSummary,
    newMonthDraftTargets, setNewMonthDraftTargets,
    setTargets,
  } = useApp();

  return (
    <>
      <div className="fixed inset-0 z-[80] backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div className="fixed inset-x-4 top-[10%] md:left-1/2 md:right-auto md:-translate-x-1/2 md:top-[8%] bg-white dark:bg-slate-900 rounded-3xl z-[90] overflow-y-auto w-auto max-w-sm md:w-[28rem] md:max-w-md mx-auto md:mx-0 p-7 no-scrollbar border border-gray-100 dark:border-slate-800"
        style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.25)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-200 uppercase tracking-[0.15em]">🎯 New Month</h3>
          <button onClick={() => setShowNewMonthPrompt(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {lastMonthSummary && (
          <div className="mb-5 p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Last Month ({lastMonthSummary.month})</p>
            <div className="flex flex-wrap gap-1.5">
              {['money', 'customers'].map(m => (
                <span key={m} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lastMonthSummary.completedModules.includes(m) ? 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/20 text-red-400'}`}>
                  {lastMonthSummary.completedModules.includes(m) ? '✓' : '✗'} {m}
                </span>
              ))}
              {lastMonthSummary.completedProducts.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                  ✓ {lastMonthSummary.completedProducts.length} products
                </span>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-5">Set targets for <span className="font-black text-emerald-600 dark:text-emerald-400">{getMonthKey()}</span>. Pre-filled from last month.</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Income Target (RM)</label>
            <input type="number" value={newMonthDraftTargets.money ?? ''} onChange={e => setNewMonthDraftTargets((p: any) => ({ ...p, money: parseFloat(e.target.value) || null }))}
              className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="e.g. 10000" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Customer Target</label>
            <input type="number" value={newMonthDraftTargets.customers ?? ''} onChange={e => setNewMonthDraftTargets((p: any) => ({ ...p, customers: parseFloat(e.target.value) || null }))}
              className="w-full bg-gray-50 dark:bg-slate-800 px-4 py-3 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="e.g. 20" />
          </div>
        </div>

        <button onClick={() => {
          setTargets((t: any) => ({ ...t, money: newMonthDraftTargets.money, customers: newMonthDraftTargets.customers }));
          setShowNewMonthPrompt(false);
        }} className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95 shadow-lg">
          Set Targets
        </button>
      </div>
    </>
  );
}
