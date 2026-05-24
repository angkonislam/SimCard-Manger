import { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';
import { Transaction } from '../types';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { required, positiveNumber, combine } from '../lib/validation';

type TempTransaction = { date: string; amount: string; description: string };

interface Props {
  transactionType: 'Income' | 'Expense';
  tempTransaction: TempTransaction;
  setTempTransaction: (t: TempTransaction) => void;
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  onClose: () => void;
}

const INCOME_CATEGORIES = ['Sales', 'Commission', 'Refund', 'Transfer', 'Bonus', 'Other'];
const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Salary', 'Transport', 'Food', 'Supplies', 'Marketing', 'Other'];
const STATUSES = ['Completed', 'Pending'];

export function TransactionModal({
  transactionType,
  tempTransaction,
  setTempTransaction,
  transactions,
  setTransactions,
  onClose,
}: Props) {
  const t = tempTransaction as any;
  const categories = transactionType === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const currentCategory = t.category || '';
  const isCustomCategory = currentCategory && !categories.includes(currentCategory);
  const [showCustomCategory, setShowCustomCategory] = useState(isCustomCategory);
  const [customCategoryInput, setCustomCategoryInput] = useState(isCustomCategory ? currentCategory : '');

  const setField = (field: string, val: any) =>
    setTempTransaction({ ...t, [field]: val } as TempTransaction);

  const toast = useToast();
  const handleSave = async () => {
    const err = combine(
      required(t.date, 'Date'),
      positiveNumber(t.amount ?? 0, 'Amount'),
    );
    if (err) { toast.error(err); return; }
    if ((parseFloat(t.amount) || 0) <= 0) { toast.error('Amount must be greater than 0'); return; }
    const existingId = t.id as string | undefined;
    const finalCategory = showCustomCategory
      ? (customCategoryInput.trim() || 'Other')
      : (currentCategory || 'Other');
    const tempId = `t${Date.now()}`;
    const transaction = {
      id: existingId || tempId,
      type: transactionType,
      category: finalCategory,
      amount: parseFloat(t.amount) || 0,
      date: t.date,
      description: t.description || 'No description',
      status: t.status || 'Completed',
    };

    try {
      if (existingId) {
        const { error } = await supabase.from('moneytracking').update(transaction).eq('id', existingId);
        if (error) throw error;
        setTransactions(transactions.map((tx: Transaction) => tx.id === existingId ? transaction as Transaction : tx));
      } else {
        const insertPayload = {
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description,
          status: transaction.status,
        };
        const { data, error } = await supabase.from('moneytracking').insert(insertPayload).select('id').single();
        if (error) throw error;
        const saved = data ? { ...transaction, id: String(data.id) } : transaction;
        setTransactions([saved as Transaction, ...transactions]);
      }
    } catch (err: any) {
      toast.error('Save failed: ' + (err?.message || 'unknown error'));
      if (existingId) {
        setTransactions(transactions.map((tx: Transaction) => tx.id === existingId ? transaction as Transaction : tx));
      } else {
        setTransactions([transaction as Transaction, ...transactions]);
      }
      onClose();
      return;
    }
    toast.success(existingId ? 'Transaction updated' : `${transactionType} added`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Transaction"
        className="fixed inset-x-4 top-[10%] md:left-1/2 md:right-auto md:-translate-x-1/2 md:top-[8%] bg-white dark:bg-slate-900 rounded-3xl z-[70] p-6 w-auto max-w-sm md:w-[28rem] md:max-w-md mx-auto md:mx-0 border border-gray-100 dark:border-slate-800 flex flex-col"
        style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest">
            {t.id ? 'Edit' : 'Add'} {transactionType}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Date</label>
            <CustomDatePicker value={t.date} onChange={(val: string) => setField('date', val)} align="left">
              <div className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-gray-300 outline-none hover:ring-2 hover:ring-emerald-500/30 flex items-center justify-between cursor-pointer">
                {t.date ? t.date.split('-').reverse().join('-') : 'DD-MM-YYYY'}
                <Calendar className="w-4 h-4 text-emerald-500" />
              </div>
            </CustomDatePicker>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
            <input
              type="text"
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Payment from XYZ"
              value={t.description}
              onChange={e => setField('description', e.target.value)}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount (RM)</label>
            <input
              type="number"
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder-emerald-300 dark:placeholder-emerald-500/50"
              placeholder="e.g. 1500"
              value={t.amount}
              onChange={e => setField('amount', e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setShowCustomCategory(false); setField('category', cat); }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    !showCustomCategory && currentCategory === cat
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setShowCustomCategory(true); setField('category', ''); }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1 ${
                  showCustomCategory
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            {showCustomCategory && (
              <input
                type="text"
                autoFocus
                className="w-full bg-gray-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-500/50 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Custom category..."
                value={customCategoryInput}
                onChange={e => setCustomCategoryInput(e.target.value)}
              />
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setField('status', s)}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    (t.status || 'Completed') === s
                      ? s === 'Completed'
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all active:scale-[0.95]"
          >
            SAVE {transactionType.toUpperCase()}
          </button>
        </form>
      </div>
    </>
  );
}
