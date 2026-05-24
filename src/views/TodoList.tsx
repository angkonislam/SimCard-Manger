import { useState, useEffect } from 'react';
import { Menu, Plus, Check, Trash2, Flag, Calendar, Search, ListTodo, X, CheckCircle2, Pencil } from 'lucide-react';
import { useApp } from '../AppContext';
import { NotificationCenter } from '../components/NotificationCenter';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { isWithin90Days } from '../utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Priority = 'low' | 'medium' | 'high';

interface Todo {
  id: string;
  text: string;
  description?: string;
  done: boolean;
  priority: Priority;
  due?: string; // yyyy-MM-dd
  createdAt: string;
}

const STORAGE_KEY = 'simcard_todos_v1';

const SAMPLE_TODOS: Todo[] = [
  { id: 't1', text: 'Restock Hot Unlimited SIMs — 200 units', done: false, priority: 'high', due: '2026-05-18', createdAt: '2026-05-14T09:00:00Z' },
  { id: 't2', text: 'Send invoice reminder to MF Hossen', done: false, priority: 'high', due: '2026-05-16', createdAt: '2026-05-14T10:15:00Z' },
  { id: 't3', text: 'Reconcile bank statement with money tracking', done: false, priority: 'medium', due: '2026-05-20', createdAt: '2026-05-13T14:00:00Z' },
  { id: 't4', text: 'Call DiGi rep about 6GB bulk pricing', done: false, priority: 'medium', createdAt: '2026-05-12T11:30:00Z' },
  { id: 't5', text: 'Update customer Zaman Traders contact info', done: true, priority: 'low', createdAt: '2026-05-11T16:00:00Z' },
  { id: 't6', text: 'Backup database to external drive', done: true, priority: 'medium', createdAt: '2026-05-10T08:00:00Z' },
];

const priorityStyles: Record<Priority, { bg: string; text: string; dot: string; label: string }> = {
  high:   { bg: 'bg-red-50 dark:bg-red-500/15',       text: 'text-red-600 dark:text-red-400',       dot: 'bg-red-500',     label: 'High' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-500/15',   text: 'text-amber-600 dark:text-amber-400',   dot: 'bg-amber-500',   label: 'Medium' },
  low:    { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Low' },
};

const formatDue = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
};

export function TodoList() {
  const { setIsMenuOpen } = useApp();

  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Todo[] = JSON.parse(raw);
        return parsed.filter(t => isWithin90Days(t.createdAt));
      }
    } catch {}
    return SAMPLE_TODOS.filter(t => isWithin90Days(t.createdAt));
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'smart' | 'created' | 'due' | 'priority' | 'alpha'>('smart');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [newText, setNewText] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDue, setNewDue] = useState('');

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setNewText(todo.text);
    setNewDesc(todo.description ?? '');
    setNewPriority(todo.priority);
    setNewDue(todo.due ?? '');
    setIsAddOpen(true);
  };

  const closeModal = () => {
    setIsAddOpen(false);
    setEditingTodo(null);
    setNewText(''); setNewDesc(''); setNewPriority('medium'); setNewDue('');
  };

  // Fetch from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('TodoList').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) { console.error('TodoList fetch error:', error); return; }
      if (data && data.length > 0) {
        const mapped: Todo[] = data.map((r: any) => ({
          id: String(r.id),
          text: String(r.text ?? ''),
          description: r.description ? String(r.description) : undefined,
          done: Boolean(r.done),
          priority: (r.priority as Priority) || 'medium',
          due: r.due ? String(r.due).substring(0, 10) : undefined,
          createdAt: String(r.created_at ?? new Date().toISOString()),
        })).filter(t => isWithin90Days(t.createdAt));
        setTodos(mapped);
      }
    });
  }, []);

  // Persist to localStorage (fallback when no Supabase)
  useEffect(() => {
    const fresh = todos.filter(t => isWithin90Days(t.createdAt));
    if (fresh.length !== todos.length) { setTodos(fresh); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch {}
  }, [todos]);

  const toggle = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const updated = { ...todo, done: !todo.done };
    setTodos(prev => prev.map(t => t.id === id ? updated : t));
    if (isSupabaseConfigured) {
      await supabase.from('TodoList').update({ done: updated.done }).eq('id', id);
    }
  };

  const remove = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (isSupabaseConfigured) {
      await supabase.from('TodoList').delete().eq('id', id);
    }
  };

  const add = async () => {
    const text = newText.trim();
    if (!text) return;

    if (editingTodo) {
      // Edit mode
      const updated: Todo = { ...editingTodo, text, description: newDesc.trim() || undefined, priority: newPriority, due: newDue || undefined };
      setTodos(prev => prev.map(t => t.id === editingTodo.id ? updated : t));
      closeModal();
      if (isSupabaseConfigured) {
        await supabase.from('TodoList').update({
          text: updated.text,
          description: updated.description ?? null,
          priority: updated.priority,
          due: updated.due ?? null,
        }).eq('id', updated.id);
      }
      return;
    }

    const tempId = `t${Date.now()}`;
    const t: Todo = { id: tempId, text, description: newDesc.trim() || undefined, done: false, priority: newPriority, due: newDue || undefined, createdAt: new Date().toISOString() };
    setTodos(prev => [t, ...prev]);
    closeModal();
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('TodoList').insert({
        text: t.text,
        description: t.description ?? null,
        done: t.done,
        priority: t.priority,
        due: t.due ?? null,
        created_at: t.createdAt,
      }).select('id').single();
      if (data) {
        setTodos(prev => prev.map(x => x.id === tempId ? { ...x, id: String(data.id) } : x));
      }
    }
  };

  const filtered = todos
    .filter(t => filter === 'all' ? true : filter === 'active' ? !t.done : t.done)
    .filter(t => !search || t.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // done items always sink
      if (a.done !== b.done) return a.done ? 1 : -1;
      const prioOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'due': {
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return a.due.localeCompare(b.due);
        }
        case 'priority':
          return prioOrder[a.priority] - prioOrder[b.priority];
        case 'alpha':
          return a.text.localeCompare(b.text);
        case 'smart':
        default:
          return prioOrder[a.priority] - prioOrder[b.priority];
      }
    });

  const activeCount = todos.filter(t => !t.done).length;
  const doneCount = todos.filter(t => t.done).length;
  const highCount = todos.filter(t => !t.done && t.priority === 'high').length;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 sm:px-6 pb-2 pt-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-200 tracking-tight">Todo List</h1>
          <NotificationCenter />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <ListTodo className="w-3 h-3 text-emerald-500" />
              <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Active</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-200 tabular-nums">{activeCount}</p>
          </div>
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Flag className="w-3 h-3 text-red-500" />
              <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">High Pri</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-200 tabular-nums">{highCount}</p>
          </div>
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
              <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Done</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-200 tabular-nums">{doneCount}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search todos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-semibold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
          />
        </div>

        {/* Filter pills + sort */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'active', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${
                filter === f
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30'
              }`}
            >
              {f}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="ml-auto shrink-0 px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            title="Sort"
          >
            <option value="smart">Smart</option>
            <option value="created">Newest</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="alpha">A-Z</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-40 mt-3 sm:mt-4">
        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
        </p>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:to-blue-500/20 flex items-center justify-center mb-4">
              <ListTodo className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-300">Nothing here</p>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-1">Tap + to add your first task</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => {
              const ps = priorityStyles[t.priority];
              return (
                <div
                  key={t.id}
                  className={`group relative p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all ${
                    t.done ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggle(t.id)}
                      className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90 ${
                        t.done
                          ? 'bg-gradient-to-br from-emerald-500 to-blue-500 border-transparent'
                          : 'border-gray-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                      }`}
                    >
                      {t.done && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-gray-900 dark:text-gray-300 ${t.done ? 'line-through' : ''}`}>
                        {t.text}
                      </p>
                      {t.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{t.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${ps.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${ps.text}`}>{ps.label}</span>
                        </span>
                        {t.due && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800">
                            <Calendar className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                            <span className="text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">{formatDue(t.due)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button
                        onClick={() => openEdit(t)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(t.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-24 lg:bottom-8 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-30"
        title="Add todo"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Modal */}
      {isAddOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] animate-in fade-in duration-200" onClick={closeModal} />
          <div className="fixed inset-x-4 top-[8%] z-[81] max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-200 tracking-tight">{editingTodo ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Due Date — top */}
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Due Date (Optional)</label>
                <CustomDatePicker value={newDue} onChange={setNewDue} align="left" maxDate="2099-12-31">
                  <div className="mt-1.5 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl flex items-center gap-2 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                      {newDue ? formatDue(newDue) : 'Pick a date'}
                    </span>
                    {newDue && (
                      <button
                        onClick={e => { e.stopPropagation(); setNewDue(''); }}
                        className="ml-auto w-5 h-5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    )}
                  </div>
                </CustomDatePicker>
              </div>
              {/* Task */}
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Task</label>
                <input
                  autoFocus
                  type="text"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && add()}
                  placeholder="What needs doing?"
                  className="w-full mt-1.5 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              {/* Description */}
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Add more details..."
                  className="w-full mt-1.5 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>
              {/* Priority */}
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Priority</label>
                <div className="flex gap-2 mt-1.5">
                  {(['low', 'medium', 'high'] as Priority[]).map(p => {
                    const ps = priorityStyles[p];
                    const active = newPriority === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                          active ? `${ps.bg} ${ps.text} ring-2 ring-current` : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                        {ps.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex gap-2">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                Cancel
              </button>
              <button
                onClick={add}
                disabled={!newText.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {editingTodo ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
