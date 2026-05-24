import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Bell, AlertTriangle, Package, Target, X, CheckCircle2, Check, Trash2, CheckCheck, Users, Wallet, ListTodo } from 'lucide-react';
import { useApp } from '../AppContext';
import { Customer, Invoice, InventoryItem } from '../types';
import { getMonthKey } from '../utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
type AlertCategory = 'target' | 'customer' | 'stock' | 'money' | 'todo';

interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  detail: string;
  meta?: string;
}

const DAYS_PAYMENT_THRESHOLD = 7;
const LARGE_DUE_THRESHOLD = 1000; // RM — "besi tk"
// v3 — bump key for new category set
const STORAGE_DISMISSED = 'notifications_dismissed_v3';
const STORAGE_READ = 'notifications_read_v3';

// Clean up old keys
try {
  localStorage.removeItem('notifications_dismissed');
  localStorage.removeItem('notifications_read');
  localStorage.removeItem('notifications_dismissed_v2');
  localStorage.removeItem('notifications_read_v2');
} catch {}

function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  // Compare date-only at local midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const ms = d.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}

function saveSet(key: string, set: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}

interface NotificationCenterProps {
  iconClass?: string;
  buttonClass?: string;
  dotClass?: string;
}

interface TodoRow {
  id: string | number;
  text: string;
  due?: string | null;
  done?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export function NotificationCenter({
  iconClass = 'w-5 h-5 text-gray-600 dark:text-gray-400',
  buttonClass = 'p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 relative',
  dotClass = 'absolute top-2 right-2',
}: NotificationCenterProps) {
  const {
    customers = [] as Customer[],
    invoices = [] as Invoice[],
    visibleInventoryItems = [] as InventoryItem[],
    targets = { money: null, inventory: null, customers: null },
    productTargets = {} as Record<string, number>,
    liveDashboardData,
    transactions = [] as any[],
  } = useApp();
  const inventory = visibleInventoryItems;

  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadSet(STORAGE_DISMISSED));
  const [readIds, setReadIds] = useState<Set<string>>(() => loadSet(STORAGE_READ));
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch todos for notification
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('TodoList').select('id, text, due, done, priority').then(({ data }) => {
      if (data) setTodos(data as TodoRow[]);
    });
  }, [isOpen]); // refetch when opened

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside, true);
    return () => document.removeEventListener('mousedown', onClickOutside, true);
  }, []);

  const allAlerts = useMemo<Alert[]>(() => {
    const out: Alert[] = [];

    // ── 1. TARGETS ─────────────────────────────────────────
    const monthLabel = (() => {
      try {
        const k = getMonthKey();
        const d = new Date(k + '-01');
        return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      } catch { return 'this month'; }
    })();

    const incomeActual = (transactions as any[]).filter((t: any) => t.type === 'Income').reduce((s: number, t: any) => s + t.amount, 0);
    if (targets.money && targets.money > 0) {
      const pct = Math.min(100, Math.round((incomeActual / targets.money) * 100));
      const met = incomeActual >= targets.money;
      out.push({
        id: `target-money-${getMonthKey()}`,
        category: 'target',
        severity: met ? 'success' : pct >= 70 ? 'info' : 'warning',
        title: `Sales target ${met ? 'reached' : `${pct}%`}`,
        detail: `RM ${incomeActual.toLocaleString(undefined, { minimumFractionDigits: 0 })} / RM ${targets.money.toLocaleString()}`,
        meta: monthLabel,
      });
    }

    const totalQty = liveDashboardData?.overview?.totalQty ?? 0;
    if (targets.inventory && targets.inventory > 0) {
      const pct = Math.min(100, Math.round((totalQty / targets.inventory) * 100));
      const met = totalQty >= targets.inventory;
      out.push({
        id: `target-qty-${getMonthKey()}`,
        category: 'target',
        severity: met ? 'success' : pct >= 70 ? 'info' : 'warning',
        title: `Qty target ${met ? 'reached' : `${pct}%`}`,
        detail: `${totalQty.toLocaleString()} / ${targets.inventory.toLocaleString()} units`,
        meta: monthLabel,
      });
    }

    if (targets.customers && targets.customers > 0) {
      const met = customers.length >= targets.customers;
      const pct = Math.min(100, Math.round((customers.length / targets.customers) * 100));
      out.push({
        id: `target-customers-${getMonthKey()}`,
        category: 'target',
        severity: met ? 'success' : pct >= 70 ? 'info' : 'warning',
        title: `Customer target ${met ? 'reached' : `${pct}%`}`,
        detail: `${customers.length} / ${targets.customers}`,
        meta: monthLabel,
      });
    }

    // Product-level targets
    Object.entries(productTargets || {}).forEach(([product, tgtRaw]) => {
      const tgt = Number(tgtRaw);
      if (!tgt || tgt <= 0) return;
      const sold = Number((liveDashboardData?.products?.list ?? []).find((p: any) => p.name === product)?.qty ?? 0);
      const pct = Math.min(100, Math.round((sold / tgt) * 100));
      const met = sold >= tgt;
      out.push({
        id: `target-prod-${product}-${getMonthKey()}`,
        category: 'target',
        severity: met ? 'success' : pct >= 70 ? 'info' : 'warning',
        title: `${product} ${met ? 'reached' : `${pct}%`}`,
        detail: `${sold.toLocaleString()} / ${tgt.toLocaleString()} units`,
        meta: monthLabel,
      });
    });

    // ── 2. CUSTOMERS ───────────────────────────────────────
    (customers as Customer[]).forEach(c => {
      const due = Number(c.dueAmount ?? c.balance ?? 0);
      const lastPayDays = daysSince(c.lastPaymentDate);

      // Large due amount
      if (due >= LARGE_DUE_THRESHOLD) {
        out.push({
          id: `cust-bigdue-${c.id}`,
          category: 'customer',
          severity: due >= LARGE_DUE_THRESHOLD * 3 ? 'critical' : 'warning',
          title: c.name,
          detail: `Large due: RM ${due.toLocaleString()}`,
          meta: c.location ? `Location: ${c.location}` : c.customerId,
        });
      }

      // Hasn't paid in 7+ days (only if has a due balance)
      if (due > 0 && lastPayDays !== null && lastPayDays >= DAYS_PAYMENT_THRESHOLD) {
        out.push({
          id: `cust-nopay-${c.id}`,
          category: 'customer',
          severity: lastPayDays >= 30 ? 'critical' : lastPayDays >= 14 ? 'warning' : 'info',
          title: c.name,
          detail: `No payment in ${lastPayDays} days`,
          meta: `Due RM ${due.toLocaleString()}`,
        });
      }
    });

    // Also include overdue invoices (customer-related)
    (invoices as Invoice[]).forEach(inv => {
      if (inv.status !== 'unpaid' || !inv.dueDate) return;
      const days = daysSince(inv.dueDate);
      if (days === null || days < DAYS_PAYMENT_THRESHOLD) return;
      if (!inv.total || inv.total <= 0) return;
      out.push({
        id: `inv-${inv.id}`,
        category: 'customer',
        severity: days >= 14 ? 'critical' : 'warning',
        title: inv.customer?.name || `Invoice ${inv.invoiceNumber}`,
        detail: `RM ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} unpaid`,
        meta: `${days}d overdue · ${inv.invoiceNumber}`,
      });
    });

    // ── 3. INVENTORY (STOCK) ───────────────────────────────
    (inventory as InventoryItem[]).forEach(item => {
      const stock = item.stock ?? 0;
      if (item.status === 'Out of Stock' || stock <= 0) {
        out.push({
          id: `stock-out-${item.id}`,
          category: 'stock',
          severity: 'critical',
          title: item.name,
          detail: 'Out of stock',
          meta: item.sku ? `SKU ${item.sku}` : item.category,
        });
      } else if (item.status === 'Low Stock' || stock < 10) {
        out.push({
          id: `stock-low-${item.id}`,
          category: 'stock',
          severity: 'warning',
          title: item.name,
          detail: `Only ${stock} ${item.unit || 'units'} left`,
          meta: item.sku ? `SKU ${item.sku}` : item.category,
        });
      } else if (stock >= 500) {
        // Overstock alert
        out.push({
          id: `stock-high-${item.id}`,
          category: 'stock',
          severity: 'info',
          title: item.name,
          detail: `High stock: ${stock} ${item.unit || 'units'}`,
          meta: item.sku ? `SKU ${item.sku}` : item.category,
        });
      }
    });

    // ── 4. MONEY TRACKING (pending by date) ────────────────
    (transactions as any[]).forEach(t => {
      if (t.status !== 'Pending') return;
      const daysOld = daysSince(t.date);
      if (daysOld === null) return;
      const severity: AlertSeverity = daysOld >= 14 ? 'critical' : daysOld >= 7 ? 'warning' : 'info';
      out.push({
        id: `money-pend-${t.id}`,
        category: 'money',
        severity,
        title: t.description || `${t.type} - ${t.category}`,
        detail: `Pending: ${t.type === 'Income' ? '+' : '-'} RM ${Number(t.amount).toLocaleString()}`,
        meta: daysOld <= 0 ? 'Today' : `${daysOld}d old · ${t.category}`,
      });
    });

    // ── 5. TODOS (by date) ─────────────────────────────────
    todos.forEach(t => {
      if (t.done) return;
      const due = t.due;
      if (!due) {
        // Undated todos — show as info only if high priority
        if (t.priority === 'high') {
          out.push({
            id: `todo-${t.id}`,
            category: 'todo',
            severity: 'info',
            title: t.text,
            detail: 'High priority · no due date',
            meta: 'TODO',
          });
        }
        return;
      }
      const daysLeft = daysUntil(due);
      if (daysLeft === null) return;
      // Overdue
      if (daysLeft < 0) {
        out.push({
          id: `todo-${t.id}`,
          category: 'todo',
          severity: daysLeft <= -7 ? 'critical' : 'warning',
          title: t.text,
          detail: `Overdue by ${Math.abs(daysLeft)}d`,
          meta: due,
        });
      } else if (daysLeft === 0) {
        out.push({
          id: `todo-${t.id}`,
          category: 'todo',
          severity: 'warning',
          title: t.text,
          detail: 'Due today',
          meta: due,
        });
      } else if (daysLeft <= 3) {
        out.push({
          id: `todo-${t.id}`,
          category: 'todo',
          severity: 'info',
          title: t.text,
          detail: `Due in ${daysLeft}d`,
          meta: due,
        });
      }
    });

    // Sort: severity first, then category
    const sevOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2, success: 3 };
    const catOrder: Record<AlertCategory, number> = { target: 0, customer: 1, stock: 2, money: 3, todo: 4 };
    return out.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || catOrder[a.category] - catOrder[b.category]);
  }, [customers, invoices, visibleInventoryItems, targets, productTargets, liveDashboardData, transactions, todos]);

  const alerts = useMemo(() => allAlerts.filter(a => !dismissed.has(a.id)), [allAlerts, dismissed]);
  const unreadCount = useMemo(() => alerts.filter(a => !readIds.has(a.id)).length, [alerts, readIds]);

  const counts = useMemo(() => {
    const critical = alerts.filter(a => a.severity === 'critical' && !readIds.has(a.id)).length;
    const warning = alerts.filter(a => a.severity === 'warning' && !readIds.has(a.id)).length;
    return { critical, warning, total: alerts.length, unread: unreadCount };
  }, [alerts, readIds, unreadCount]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<AlertCategory, Alert[]> = { target: [], customer: [], stock: [], money: [], todo: [] };
    alerts.forEach(a => groups[a.category].push(a));
    return groups;
  }, [alerts]);

  const dismissOne = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set<string>(prev);
      next.add(id);
      saveSet(STORAGE_DISMISSED, next);
      return next;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set<string>(prev);
      next.add(id);
      saveSet(STORAGE_READ, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set<string>(prev);
      alerts.forEach(a => next.add(a.id));
      saveSet(STORAGE_READ, next);
      return next;
    });
  }, [alerts]);

  const clearAll = useCallback(() => {
    setDismissed(prev => {
      const next = new Set<string>(prev);
      alerts.forEach(a => next.add(a.id));
      saveSet(STORAGE_DISMISSED, next);
      return next;
    });
  }, [alerts]);

  const hasUnread = counts.unread > 0;
  const dotColor = counts.critical > 0 ? 'bg-red-500' : counts.warning > 0 ? 'bg-amber-500' : 'bg-emerald-500';

  const categoryLabels: Record<AlertCategory, string> = {
    target: 'Monthly Targets',
    customer: 'Customers & Dues',
    stock: 'Inventory Stock',
    money: 'Pending Transactions',
    todo: 'To-Do Tasks',
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(o => !o)}
        className={buttonClass}
        aria-label="Notifications"
      >
        <Bell className={iconClass} />
        {hasUnread && (
          <span className={`${dotClass} w-2 h-2 rounded-full ${dotColor} ring-2 ring-white dark:ring-slate-900`} />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[101] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200">Notifications</h3>
                {counts.total > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${counts.critical > 0 ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : counts.warning > 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'}`}>
                    {counts.total}
                  </span>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            {/* Action bar */}
            {alerts.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40">
                <button
                  onClick={markAllRead}
                  disabled={counts.unread === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-slate-700" />
                <button
                  onClick={clearAll}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              </div>
            )}

            {/* Body */}
            <div className="max-h-[480px] overflow-y-auto no-scrollbar">
              {alerts.length === 0 ? (
                <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">All clear</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No alerts right now</p>
                </div>
              ) : (
                (Object.keys(groupedByCategory) as AlertCategory[]).map(cat => {
                  const items = groupedByCategory[cat];
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="px-4 pt-3 pb-1.5 flex items-center gap-2 sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <CategoryIcon cat={cat} />
                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {categoryLabels[cat]}
                        </span>
                        <span className="ml-auto text-[10px] font-bold text-gray-400 dark:text-gray-500">{items.length}</span>
                      </div>
                      {items.map(alert => (
                        <AlertRow
                          key={alert.id}
                          alert={alert}
                          isRead={readIds.has(alert.id)}
                          onRead={() => markRead(alert.id)}
                          onDelete={() => dismissOne(alert.id)}
                        />
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryIcon({ cat }: { cat: AlertCategory }) {
  if (cat === 'target')   return <Target   className="w-3.5 h-3.5 text-emerald-500" />;
  if (cat === 'customer') return <Users    className="w-3.5 h-3.5 text-amber-500" />;
  if (cat === 'stock')    return <Package  className="w-3.5 h-3.5 text-blue-500" />;
  if (cat === 'money')    return <Wallet   className="w-3.5 h-3.5 text-pink-500" />;
  return <ListTodo className="w-3.5 h-3.5 text-violet-500" />;
}

interface AlertRowProps {
  alert: Alert;
  isRead: boolean;
  onRead: () => void;
  onDelete: () => void;
  key?: string;
}

function AlertRow({ alert, isRead, onRead, onDelete }: AlertRowProps) {
  const sevStyle: Record<AlertSeverity, { dot: string; bg: string; text: string }> = {
    critical: { dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-600 dark:text-red-400' },
    warning:  { dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400' },
    info:     { dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10',       text: 'text-blue-600 dark:text-blue-400' },
    success:  { dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  };
  const s = sevStyle[alert.severity];

  return (
    <div className={`group px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors border-b border-gray-50 dark:border-slate-800/50 last:border-0 flex items-start gap-3 ${isRead ? 'opacity-55' : ''}`}>
      <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center shrink-0 mt-0.5 relative`}>
        {alert.severity === 'critical' || alert.severity === 'warning'
          ? <AlertTriangle className={`w-3.5 h-3.5 ${s.text}`} />
          : alert.severity === 'success'
            ? <CheckCircle2 className={`w-3.5 h-3.5 ${s.text}`} />
            : <div className={`w-2 h-2 rounded-full ${s.dot}`} />}
        {!isRead && <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${s.dot} ring-2 ring-white dark:ring-slate-900`} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-200'}`}>{alert.title}</p>
        <p className={`text-[11px] ${s.text} font-semibold truncate`}>{alert.detail}</p>
        {alert.meta && <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate mt-0.5">{alert.meta}</p>}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        {!isRead && (
          <button
            onClick={onRead}
            title="Mark as read"
            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
