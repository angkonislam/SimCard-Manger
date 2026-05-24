/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, Suspense, lazy } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Invoice, LineItem, InvoiceStatus, Customer, InventoryItem, Transaction, SalesRow, DbProduct, DbSupplier } from './types';
import { MOCK_CUSTOMERS, MOCK_INVENTORY, MOCK_TRANSACTIONS, INITIAL_INVOICES } from './data/mockData';
import { View, Module, DashboardSubView, PRODUCT_COLS, STORAGE_TARGETS, STORAGE_COMPLETION, STORAGE_LAST_MONTH } from './constants';
import { getBrandColor, getMonthKey, localDateStr, isWithin90Days } from './utils';
import { TransactionModal } from './modals/TransactionModal';
import { CustomerPickerModal } from './modals/CustomerPickerModal';
import { InvoicePreview } from './views/InvoicePreview';
import { CustomerModal } from './modals/CustomerModal';
import { InventoryItemModal } from './modals/InventoryItemModal';
import { AppContext } from './AppContext';
import { CustomersList } from './views/CustomersList';
import { InventoryDetails } from './views/InventoryDetails';
import { CustomerDetails } from './views/CustomerDetails';
import { Sidebar, MobileMenu } from './components/Sidebar';
// Heavy views — code split via React.lazy
const Dashboard      = lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const Analytics      = lazy(() => import('./views/Analytics').then(m => ({ default: m.Analytics })));
const CreateInvoice  = lazy(() => import('./views/CreateInvoice').then(m => ({ default: m.CreateInvoice })));
const InventoryList  = lazy(() => import('./views/InventoryList').then(m => ({ default: m.InventoryList })));
const MoneyTracking  = lazy(() => import('./views/MoneyTracking').then(m => ({ default: m.MoneyTracking })));
const TodoList       = lazy(() => import('./views/TodoList').then(m => ({ default: m.TodoList })));
const Notes          = lazy(() => import('./views/Notes').then(m => ({ default: m.Notes })));
import { AuthScreen } from './views/AuthScreen';
import { AppBootSkeleton, ContentSkeleton } from './components/SkeletonLoader';
import { NewMonthPrompt } from './modals/NewMonthPrompt';
import { Permission, can as canFn, canViewModule } from './lib/roles';
import { useToast } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import { useAuth } from './hooks/useAuth';
import { downloadInvoicePDF } from './lib/invoicePdf';

export default function App() {
  const toast = useToast();
  // ── Auth session + role gate (extracted hook) ────────────
  const { session, authChecked, userRole, roleChecked } = useAuth();
  const can = (p: Permission) => canFn(userRole, p);

  const [view, setView] = useState<View>(() => {
    return (localStorage.getItem('app_last_view') as View) || 'analytics';
  });
  const [activeModule, setActiveModule] = useState<Module>(() => {
    return (localStorage.getItem('app_last_module') as Module) || 'analytics-dashboard';
  });
  const [dashboardSubView, setDashboardSubView] = useState<DashboardSubView>('overview');
  const [profitSubTab, setProfitSubTab] = useState<'customer' | 'product' | 'invoice'>('customer');
  const [inventorySubView, setInventorySubView] = useState<'stock' | 'profit'>('stock');
  const [customerFilter, setCustomerFilter] = useState('Due');
  const [customerSort, setCustomerSort] = useState('due-desc');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Initial state empty — populated from Supabase fetches on mount. No mock data leakage.
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 90-day rolling-window purge for transactions
  useEffect(() => {
    const fresh = transactions.filter(t => isWithin90Days(t.date));
    if (fresh.length !== transactions.length) setTransactions(fresh);
  }, [transactions]);

  // If active module becomes disallowed (role change or login), bounce to dashboard.
  useEffect(() => {
    if (!userRole) return;
    if (!canViewModule(userRole, activeModule)) {
      setActiveModule('analytics-dashboard');
      setView('analytics');
    }
  }, [userRole, activeModule]);

  // Persist active page so refresh restores same location.
  useEffect(() => {
    localStorage.setItem('app_last_view', view);
    localStorage.setItem('app_last_module', activeModule);
  }, [view, activeModule]);

  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const dateAutoInitialized = useRef(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingSection, setEditingSection] = useState<'contact' | 'financial' | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Customer>>({});
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [isInventorySearchActive, setIsInventorySearchActive] = useState(false);
  const [inventorySort, setInventorySort] = useState('Default');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [moneySearchQuery, setMoneySearchQuery] = useState('');
  const [moneyFilter, setMoneyFilter] = useState('All');
  const [targets, setTargets] = useState<{inventory:number|null;money:number|null;customers:number|null;}>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TARGETS(getMonthKey()));
      if (saved) return JSON.parse(saved).targets;
    } catch {}
    return { inventory: 500, money: 10000, customers: 20 };
  });
  const [productTargets, setProductTargets] = useState<Record<string,number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TARGETS(getMonthKey()));
      if (saved) return JSON.parse(saved).productTargets || {};
    } catch {}
    return {};
  });
  const [isEditingTarget, setIsEditingTarget] = useState<string | null>(null);
  const [editingStockProduct, setEditingStockProduct] = useState<string | null>(null);
  const [tempProductStock, setTempProductStock] = useState('');
  const [addingSupplierForProduct, setAddingSupplierForProduct] = useState<string | null>(null);
  const [newSupplierDraft, setNewSupplierDraft] = useState({ name: '', qty: '', unitPrice: '' });
  const [editingSupplierRow, setEditingSupplierRow] = useState<string | null>(null); // supplierId
  const [inventoryDeleteConfirm, setInventoryDeleteConfirm] = useState(false);

  const [dbProducts, setDbProducts] = useState<DbProduct[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<DbSupplier[]>([]);
  const productCosts = useMemo<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('productCosts') || '{}'); } catch { return {}; }
  }, []);
  const [editingInventorySection, setEditingInventorySection] = useState<string | null>(null);
  const [showNewMonthPrompt, setShowNewMonthPrompt] = useState(false);
  const [lastMonthSummary, setLastMonthSummary] = useState<{month:string;completedModules:string[];completedProducts:string[]}|null>(null);
  const [newMonthDraftTargets, setNewMonthDraftTargets] = useState<{inventory:number|null;money:number|null;customers:number|null}>({ inventory: 500, money: 10000, customers: 20 });
  const [selectedDashboardCustomers, setSelectedDashboardCustomers] = useState<string[]>([]);
  const [isDashboardCustomerDropdownOpen, setIsDashboardCustomerDropdownOpen] = useState(false);
  const [customerDropdownSearch, setCustomerDropdownSearch] = useState('');
  const [tempTargetValue, setTempTargetValue] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [customerPickerSearch, setCustomerPickerSearch] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isInlineAddingCustomer, setIsInlineAddingCustomer] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ name: string; sales: number; qty: number; type: string } | null>(null);
  const [productSortBy, setProductSortBy] = useState<'name' | 'qty' | 'sales'>('sales');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customerSortOrder, setCustomerSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sidebar collapsed state (desktop only)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('sidebarCollapsed') === 'true'; } catch { return false; }
  });
  const toggleSidebar = () => setSidebarCollapsed(prev => {
    localStorage.setItem('sidebarCollapsed', String(!prev));
    return !prev;
  });

  // Theme state (light/dark/system)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      return (localStorage.getItem('appTheme') as any) || 'system';
    } catch {
      return 'system';
    }
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => prev === 'light' ? 'dark' : 'light');
  };

  // Helper functions for Supabase-backed inventory data
  const getProductStock = (name: string): number => {
    const p = dbProducts.find(x => x.name === name);
    if (p?.stock_qty != null) return p.stock_qty;
    return dbSuppliers.filter(s => s.product_name === name).reduce((sum, s) => sum + s.qty, 0);
  };
  const getProductSuppliers = (name: string): DbSupplier[] =>
    dbSuppliers.filter(s => s.product_name === name);
  const isProductHidden = (name: string): boolean =>
    dbProducts.find(p => p.name === name)?.is_hidden ?? false;
  const getProductCompanyName = (name: string): string =>
    dbProducts.find(p => p.name === name)?.company_name || '';

  // Draft invoice state
  const [draftInvoice, setDraftInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: `INV-2026-00${INITIAL_INVOICES.length + 42}`,
    items: [],
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: 'Net 14 days',
    vat: 0,
  });

  const [tempCustomer, setTempCustomer] = useState<Customer>(MOCK_CUSTOMERS[0]);
  const [isInventoryItemModalOpen, setIsInventoryItemModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'full' | 'basic' | 'add-supplier'>('full');
  const [tempInventoryItem, setTempInventoryItem] = useState<InventoryItem>(MOCK_INVENTORY[0]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'Income' | 'Expense'>('Income');
  const [tempTransaction, setTempTransaction] = useState({ date: new Date().toISOString().split('T')[0], amount: '', description: '' });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Fetch + unpivot Sales_Data wide table → SalesRow[]
  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true);
      try {
        // Paginate — Supabase default limit is 1000, table has 3500+ rows
        const PAGE_SIZE = 1000;
        let allData: Record<string, unknown>[] = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('Sales_Data')
            .select('*')
            .order('List_ID', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;

          allData = [...allData, ...(data as Record<string, unknown>[])];
          from += PAGE_SIZE;
          hasMore = data.length === PAGE_SIZE;
        }

        if (allData.length === 0) {
          console.warn('⚠️ Sales_Data empty. Check RLS: ALTER TABLE "Sales_Data" DISABLE ROW LEVEL SECURITY;');
          setIsLoading(false);
          return;
        }

        // Unpivot: each wide row → N SalesRows (one per product with qty > 0)
        const rows: SalesRow[] = [];
        for (const row of allData) {
          const date = String(row['Date'] ?? '').substring(0, 10);
          const list_id = String(row['List_ID'] ?? '');
          const customer_name = String(row['Customer Name'] ?? 'Unknown').trim() || 'Unknown';

          for (const product of PRODUCT_COLS) {
            const qty  = Number(row[`${product} (Qty)`]  ?? 0);
            const rate = Number(row[`${product} (Rate)`] ?? 0);
            if (qty > 0) {
              rows.push({ date, list_id, customer_name, product, qty, rate });
            }
          }
        }

        console.log(`✅ Sales_Data: ${allData.length} rows → ${rows.length} sales lines`);
        setSalesRows(rows);

        // Date range auto-init handled by useEffect on dataDateRange.max
      } catch (err) {
        console.error('❌ Failed to fetch Sales_Data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // Fetch Client_Details → customers state
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const PAGE_SIZE = 1000;
        let allData: Record<string, unknown>[] = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('Client_Details')
            .select('*')
            .order('Client ID', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData = [...allData, ...(data as Record<string, unknown>[])];
          from += PAGE_SIZE;
          hasMore = data.length === PAGE_SIZE;
        }
        if (allData.length === 0) return;

        if (allData[0]) console.log('📋 Client_Details keys:', Object.keys(allData[0]));
        const mapped: Customer[] = allData.map(row => {
          const fullName = String(row['Customer Name'] ?? '');
          const words = fullName.trim().split(/\s+/);
          const initials = words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
          return {
            id: String(row['Client ID']),
            customerId: String(row['Client ID']),
            name: fullName,
            shortName: String(row['Short Name'] ?? ''),
            email: '',
            initials,
            contact: row['Contact'] ? String(row['Contact']) : undefined,
            location: row['Location'] ? String(row['Location']) : undefined,
            whatsappGroup: row['Whatsapp Group Name'] ? String(row['Whatsapp Group Name']) : undefined,
            balance: row['Due Amount💲'] != null ? Number(row['Due Amount💲']) : 0,
            dueAmount: row['Due Amount💲'] != null ? Number(row['Due Amount💲']) : 0,
            lastMonthSales: row['Last Month Sales💲'] != null ? Number(row['Last Month Sales💲']) : undefined,
            lastPaymentDate: (() => {
              const k = Object.keys(row).find(x => x.toLowerCase().includes('last payment date') || x.toLowerCase().includes('payment date'));
              return k && row[k] ? String(row[k]).substring(0, 10) : undefined;
            })(),
            lastPaid: (() => {
              const k = Object.keys(row).find(x => x.toLowerCase().includes('last paid'));
              return k && row[k] != null ? Number(row[k]) : undefined;
            })(),
            status: row['Status'] ? String(row['Status']) : undefined,
            group: 'Standard',
          };
        });

        console.log(`✅ Client_Details: ${mapped.length} customers loaded`);
        setCustomers(mapped);
      } catch (err) {
        console.error('❌ Failed to fetch Client_Details:', err);
      }
    };
    fetchClients();

    const clientChannel = supabase.channel('client-details-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Client_Details' }, () => {
        fetchClients();
      })
      .subscribe();

    return () => { supabase.removeChannel(clientChannel); };
  }, []);

  // Fetch products and suppliers from Supabase
  useEffect(() => {
    const fetchProductsAndSuppliers = async () => {
      try {
        // fetch products
        const { data: prodData } = await supabase.from('products').select('*').eq('is_hidden', false);
        if (prodData) setDbProducts(prodData as DbProduct[]);
        // fetch suppliers
        const { data: suppData } = await supabase.from('product_suppliers').select('*');
        if (suppData) setDbSuppliers(suppData as DbSupplier[]);
      } catch (err) {
        console.error('❌ Failed to fetch products/suppliers:', err);
      }
    };
    fetchProductsAndSuppliers();

    // Real-time subscriptions for products and suppliers
    const channel = supabase.channel('products-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').eq('is_hidden', false);
        if (data) setDbProducts(data as DbProduct[]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_suppliers' }, async () => {
        const { data } = await supabase.from('product_suppliers').select('*');
        if (data) setDbSuppliers(data as DbSupplier[]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch invoices from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const fetchInvoices = async () => {
      const { data, error } = await supabase.from('invoice').select('*').order('created_at', { ascending: false });
      if (error) { console.error('invoice fetch error:', error); return; }
      if (data) {
        const mapped = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          invoiceNumber: String(row.invoice_number ?? ''),
          issueDate: String(row.issue_date ?? ''),
          dueDate: '',
          paymentTerms: '',
          notes: row.notes ? String(row.notes) : undefined,
          items: (row.item as LineItem[]) || [],
          itemCosts: (row.item_costs as Record<string, number>) || undefined,
          status: 'unpaid' as InvoiceStatus,
          subtotal: Number(row.subtotal ?? 0),
          vat: Number(row.return ?? 0),
          total: Number(row.total ?? 0),
          customer: {
            id: String(row.customer_id ?? ''),
            customerId: String(row.customer_id ?? ''),
            name: String(row.customer_name ?? ''),
            email: '', initials: String(row.customer_name ?? '').split(' ').slice(0,2).map((w: string) => w[0]?.toUpperCase() ?? '').join(''),
          },
        } as Invoice));
        setInvoices(mapped);
      }
    };
    fetchInvoices();
  }, [isSupabaseConfigured]);

  // Fetch drafts from Supabase
  const refetchDrafts = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('draft_invoices')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('draft_invoices fetch error:', error);
      // Surface schema/RLS issues so they get fixed instead of silently empty
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        toast.error('Drafts table missing. Run the draft_invoices SQL.');
      }
      return;
    }
    if (data) setDrafts(data);
  };
  useEffect(() => { refetchDrafts(); }, [isSupabaseConfigured]);

  // Fetch transactions from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('moneytracking')
        .select('*')
        .order('date', { ascending: false });
      if (error) { console.error('transactions fetch error:', error); return; }
      if (data && data.length > 0) {
        const mapped = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          type: String(row.type) as 'Income' | 'Expense',
          category: String(row.category ?? 'Other'),
          amount: Number(row.amount ?? 0),
          date: String(row.date ?? '').substring(0, 10),
          description: String(row.description ?? ''),
          status: String(row.status ?? 'Completed') as 'Completed' | 'Pending' | 'Failed',
          referenceId: row.reference_id ? String(row.reference_id) : undefined,
        })) as Transaction[];
        setTransactions(mapped.filter(t => isWithin90Days(t.date)));
      }
    };
    fetchTransactions();
  }, [isSupabaseConfigured]);

  // Refetch products + suppliers whenever inventory module is opened
  useEffect(() => {
    if (!isSupabaseConfigured || activeModule !== 'inventory-module') return;
    supabase.from('products').select('*').eq('is_hidden', false).then(({ data }) => {
      if (data) setDbProducts(data as DbProduct[]);
    });
    supabase.from('product_suppliers').select('*').then(({ data }) => {
      if (data) setDbSuppliers(data as DbSupplier[]);
    });
  }, [activeModule, isSupabaseConfigured]);

  // Sync unique products from salesRows → products table (runs once after salesRows load)
  const hasSyncedProducts = useRef(false);
  useEffect(() => {
    if (!isSupabaseConfigured || salesRows.length === 0 || hasSyncedProducts.current) return;
    hasSyncedProducts.current = true;
    const syncProducts = async () => {
      const uniqueNames = [...new Set(salesRows.map(r => r.product).filter(Boolean))];
      const rows = uniqueNames.map(name => ({ name, company_name: '', stock_qty: null, is_hidden: false }));
      const { error } = await supabase.from('products').upsert(rows, { onConflict: 'name', ignoreDuplicates: true });
      if (!error) {
        const { data } = await supabase.from('products').select('*').eq('is_hidden', false);
        if (data) setDbProducts(data as DbProduct[]);
        console.log(`✅ Synced ${uniqueNames.length} products to products table`);
      } else {
        console.error('❌ Product sync error:', error.message);
      }
    };
    syncProducts();
  }, [salesRows, isSupabaseConfigured]);


  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const invDate = inv.issueDate; // YYYY-MM-DD format
      const afterFrom = fromDate ? invDate >= fromDate : true;
      const beforeTo = toDate ? invDate <= toDate : true;

      return matchesSearch && afterFrom && beforeTo;
    });
  }, [invoices, searchQuery, fromDate, toDate]);

  // ── Live dashboard data built from Supabase salesRows + date filter ────────
  const liveDashboardData = useMemo(() => {
    // Apply date + customer filter
    const filtered = salesRows.filter(r => {
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      if (selectedDashboardCustomers.length > 0 && !selectedDashboardCustomers.includes(r.customer_name)) return false;
      return true;
    });

    // Overview totals
    const totalSales = filtered.reduce((s, r) => s + r.qty * r.rate, 0);
    const totalQty   = filtered.reduce((s, r) => s + r.qty, 0);

    // Product share pie — % of total revenue per product
    const prodRevMap: Record<string, number> = {};
    filtered.forEach(r => {
      prodRevMap[r.product] = (prodRevMap[r.product] || 0) + r.qty * r.rate;
    });
    const totalProdRev = Object.values(prodRevMap).reduce((s, v) => s + v, 0) || 1;
    const productShare = Object.entries(prodRevMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value: parseFloat(((value / totalProdRev) * 100).toFixed(1)),
        color: getBrandColor(name, idx),
      }));

    // Daily stats — every date in [fromDate, toDate] range, 0-fill missing days
    const dailyMap: Record<string, { sales: number; qty: number }> = {};
    filtered.forEach(r => {
      if (!dailyMap[r.date]) dailyMap[r.date] = { sales: 0, qty: 0 };
      dailyMap[r.date].sales += r.qty * r.rate;
      dailyMap[r.date].qty   += r.qty;
    });
    // Determine actual range: use fromDate/toDate if set, else min/max from data
    const rangeStart = fromDate || Object.keys(dailyMap).sort()[0];
    const rangeEnd   = toDate   || Object.keys(dailyMap).sort().slice(-1)[0];
    const dailyStats: { day: number; date: string; sales: number; qty: number }[] = [];
    if (rangeStart && rangeEnd) {
      // Parse yyyy-MM-dd as UTC to avoid timezone-induced date drift
      const [sy, sm, sd] = rangeStart.split('-').map(Number);
      const [ey, em, ed] = rangeEnd.split('-').map(Number);
      const cur = new Date(Date.UTC(sy, sm - 1, sd));
      const end = new Date(Date.UTC(ey, em - 1, ed));
      while (cur.getTime() <= end.getTime()) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
        const d = String(cur.getUTCDate()).padStart(2, '0');
        const iso = `${y}-${m}-${d}`;
        const stats = dailyMap[iso] || { sales: 0, qty: 0 };
        dailyStats.push({
          day: cur.getUTCDate(),
          date: iso,
          sales: parseFloat(stats.sales.toFixed(2)),
          qty: stats.qty,
        });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    // Top customers — aggregate revenue + qty per customer
    const custMap: Record<string, { name: string; location: string; value: number; qty: number }> = {};
    filtered.forEach(r => {
      if (!custMap[r.customer_name]) custMap[r.customer_name] = { name: r.customer_name, location: '', value: 0, qty: 0 };
      custMap[r.customer_name].value += r.qty * r.rate;
      custMap[r.customer_name].qty += r.qty;
    });
    const topCustomers = Object.values(custMap).sort((a, b) => b.value - a.value).slice(0, 10);

    // Products dataset for table + charts
    const allProd: Record<string, { name: string; qty: number; sales: number }> = {};
    filtered.forEach(r => {
      const key = r.product;
      if (!allProd[key]) allProd[key] = { name: r.product, qty: 0, sales: 0 };
      allProd[key].qty   += r.qty;
      allProd[key].sales += r.qty * r.rate;
    });
    const productsDataset = Object.values(allProd)
      .sort((a, b) => b.sales - a.sales)
      .map((item, idx) => ({
        ...item,
        sales: parseFloat(item.sales.toFixed(2)),
        color: getBrandColor(item.name, idx),
      }));

    const activeSkus = productsDataset.filter(p => p.qty > 0).length;
    const avgPerUnit = filtered.length > 0
      ? parseFloat((filtered.reduce((s, r) => s + r.rate, 0) / filtered.length).toFixed(1))
      : 0;

    return {
      overview:  { totalSales, totalQty, productShare, dailyStats },
      customers: { top: topCustomers },
      products:  { activeSkus, totalProducts: productsDataset.length, avgPerUnit, dataset: productsDataset },
    };
  }, [salesRows, fromDate, toDate, selectedDashboardCustomers]);

  // Product inventory derived from real sales data (all-time)
  const productInventoryData = useMemo((): InventoryItem[] => {
    if (salesRows.length === 0) return [];
    const map: Record<string, { qty: number; sales: number; rates: number[]; lastDate: string }> = {};
    salesRows.forEach(r => {
      if (!map[r.product]) map[r.product] = { qty: 0, sales: 0, rates: [], lastDate: '' };
      map[r.product].qty += r.qty;
      map[r.product].sales += r.qty * r.rate;
      if (r.rate > 0) map[r.product].rates.push(r.rate);
      if (r.date > map[r.product].lastDate) map[r.product].lastDate = r.date;
    });
    return Object.entries(map)
      .filter(([, v]) => v.qty > 0)
      .sort((a, b) => b[1].qty - a[1].qty)
      .map(([name, v], idx) => {
        const avgRate = v.rates.length > 0 ? v.rates.reduce((s, r) => s + r, 0) / v.rates.length : 0;
        return {
          id: `prod-${idx}`,
          sku: name.toUpperCase().replace(/[\s()]/g, '-'),
          name,
          category: 'SIM Card',
          supplierName: '-',
          stock: v.qty,
          unit: 'pcs',
          price: parseFloat(avgRate.toFixed(2)),
          cost: parseFloat((avgRate * 0.85).toFixed(2)),
          status: 'In Stock' as const,
          lastUpdated: v.lastDate,
        };
      });
  }, [salesRows]);

  // Merge salesRows-derived products + manually added custom products (from dbProducts)
  const visibleInventoryItems = useMemo((): InventoryItem[] => {
    const existingNames = new Set(productInventoryData.map(i => i.name));
    const customItems: InventoryItem[] = dbProducts
      .filter(p => !existingNames.has(p.name))
      .map((p, idx) => ({
        id: String(p.id || `custom-${idx}`),
        sku: p.name.toUpperCase().replace(/[\s()]/g, '-'),
        name: p.name,
        category: p.company_name || 'SIM Card',
        supplierName: '-',
        stock: getProductStock(p.name),
        unit: 'pcs',
        price: 0,
        cost: 0,
        status: 'In Stock' as const,
        lastUpdated: '',
      }));
    return [...productInventoryData, ...customItems];
  }, [productInventoryData, dbProducts, dbSuppliers]);

  // Profit analytics — by customer, product, invoice (invoice-table data only, filtered by date range)
  const profitData = useMemo(() => {
    const getCostPrice = (productName: string, itemCosts?: Record<string, number>): number => {
      // use snapshot from invoice if available
      if (itemCosts?.[productName] != null && itemCosts[productName] > 0) return itemCosts[productName];
      // 1. weighted avg from product_suppliers
      const suppliers = getProductSuppliers(productName);
      if (suppliers.length > 0) {
        const totalQty = suppliers.reduce((s: number, x: { qty: number; unit_price: number }) => s + x.qty, 0);
        if (totalQty > 0) return suppliers.reduce((s: number, x: { qty: number; unit_price: number }) => s + x.unit_price * x.qty, 0) / totalQty;
        return suppliers.reduce((s: number, x: { unit_price: number }) => s + x.unit_price, 0) / suppliers.length;
      }
      // 2. localStorage manual override
      if (productCosts[productName] != null && productCosts[productName] > 0) return productCosts[productName];
      // 3. products table avg_cost
      const prod = dbProducts.find(p => p.name === productName);
      if (prod?.avg_cost != null && prod.avg_cost > 0) return prod.avg_cost;
      // 4. inventory cost field
      const prodItem = productInventoryData.find(p => p.name === productName);
      return prodItem ? prodItem.cost : 0;
    };

    // Filter invoices by date range
    const filteredInvoices = invoices.filter(inv =>
      (!fromDate || inv.issueDate >= fromDate) && (!toDate || inv.issueDate <= toDate)
    );

    // By customer — from invoices
    const custMap: Record<string, { revenue: number; cost: number; qty: number }> = {};
    filteredInvoices.forEach(inv => {
      const name = inv.customer.name;
      if (!custMap[name]) custMap[name] = { revenue: 0, cost: 0, qty: 0 };
      custMap[name].revenue += inv.total;
      inv.items.forEach(item => {
        custMap[name].cost += item.quantity * getCostPrice(item.description, inv.itemCosts);
        custMap[name].qty += item.quantity;
      });
    });
    const byCustomer = Object.entries(custMap)
      .map(([name, d]) => ({ name, revenue: d.revenue, cost: d.cost, profit: d.revenue - d.cost, qty: d.qty, margin: d.revenue > 0 ? (d.revenue - d.cost) / d.revenue * 100 : 0 }))
      .sort((a, b) => b.profit - a.profit);

    // By product — from invoices
    const prodMap: Record<string, { revenue: number; cost: number; qty: number }> = {};
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const name = item.description;
        if (!prodMap[name]) prodMap[name] = { revenue: 0, cost: 0, qty: 0 };
        prodMap[name].revenue += item.quantity * item.unitPrice;
        prodMap[name].cost += item.quantity * getCostPrice(name, inv.itemCosts);
        prodMap[name].qty += item.quantity;
      });
    });
    const byProduct = Object.entries(prodMap)
      .map(([name, d]) => ({ name, revenue: d.revenue, cost: d.cost, profit: d.revenue - d.cost, qty: d.qty, margin: d.revenue > 0 ? (d.revenue - d.cost) / d.revenue * 100 : 0 }))
      .sort((a, b) => b.profit - a.profit);

    // Totals
    const totalRevenue = filteredInvoices.reduce((s, inv) => s + inv.total, 0);
    const totalCost = filteredInvoices.reduce((s, inv) =>
      s + inv.items.reduce((si, item) => si + item.quantity * getCostPrice(item.description, inv.itemCosts), 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalMargin = totalRevenue > 0 ? totalProfit / totalRevenue * 100 : 0;
    return { byCustomer, byProduct, totalRevenue, totalCost, totalProfit, totalMargin, getCostPrice };
  }, [invoices, fromDate, toDate, dbSuppliers, productInventoryData, dbProducts, productCosts]);

  // Unique sorted customer names from real sales data
  const dashboardCustomerNames = useMemo(() =>
    Array.from(new Set(salesRows.map(r => r.customer_name))).sort(),
  [salesRows]);

  // Min/max dates from actual sales data
  const dataDateRange = useMemo(() => {
    if (salesRows.length === 0) return { min: '', max: '' };
    const dates = salesRows.map(r => r.date).filter(Boolean).sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [salesRows]);

  // Auto-calculate last 30 days sales per customer from salesRows
  const customerLastMonthSales = useMemo(() => {
    if (salesRows.length === 0) return {} as Record<string, number>;
    let startStr: string;
    let endStr: string;
    if (fromDate && toDate) {
      startStr = fromDate;
      endStr = toDate;
    } else {
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth();
      const lastDayPrevMonth = new Date(y, m, 0).getDate();
      startStr = localDateStr(m === 0 ? y - 1 : y, m === 0 ? 12 : m, 1);
      endStr = localDateStr(m === 0 ? y - 1 : y, m === 0 ? 12 : m, lastDayPrevMonth);
    }
    const map: Record<string, number> = {};
    salesRows.forEach(r => {
      if (r.date >= startStr && r.date <= endStr) {
        map[r.customer_name] = (map[r.customer_name] || 0) + r.qty * r.rate;
      }
    });
    return map;
  }, [salesRows, fromDate, toDate]);

  const customerCurrMonthSales = useMemo(() => {
    if (salesRows.length === 0) return {} as Record<string, number>;
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const startStr = localDateStr(y, m, 1);
    const endStr = localDateStr(y, m, lastDay);
    const map: Record<string, number> = {};
    salesRows.forEach(r => {
      if (r.date >= startStr && r.date <= endStr) {
        map[r.customer_name] = (map[r.customer_name] || 0) + r.qty * r.rate;
      }
    });
    return map;
  }, [salesRows]);

  const targetCompletions = useMemo(() => {
    const incomeActual = transactions.filter(t => t.type === 'Income').reduce((s,t) => s + t.amount, 0);
    const completedModules: string[] = [];
    if (targets.money && incomeActual >= targets.money) completedModules.push('money');
    if (targets.customers && customers.length >= targets.customers) completedModules.push('customers');
    const productSalesMap: Record<string,number> = {};
    (liveDashboardData?.products?.dataset || []).forEach(p => { productSalesMap[p.name] = p.sales; });
    const completedProducts: string[] = [];
    Object.entries(productTargets).forEach(([key, target]: [string, number]) => {
      if (!key.startsWith('money-') || !target) return;
      const name = key.replace('money-', '');
      if ((productSalesMap[name] || 0) >= target) completedProducts.push(name);
    });
    return { completedModules, completedProducts };
  }, [targets, productTargets, transactions, customers, liveDashboardData]);

  // Auto-set dates to latest data month (runs once when data first loads)
  useEffect(() => {
    if (!dataDateRange.max) return;
    if (dateAutoInitialized.current) return;
    dateAutoInitialized.current = true;
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const latestDataMonth = dataDateRange.max.substring(0, 7);
    if (latestDataMonth >= currentMonthPrefix) {
      setFromDate(`${currentMonthPrefix}-01`);
      setToDate(now.toISOString().split('T')[0]);
    } else {
      setFromDate(`${latestDataMonth}-01`);
      setToDate(dataDateRange.max);
    }
  }, [dataDateRange.max, dataDateRange.min]);
  // ──────────────────────────────────────────────────────────────────────────

  // Detect new month → archive completion + show prompt
  useEffect(() => {
    const month = getMonthKey();
    const lastMonth = localStorage.getItem(STORAGE_LAST_MONTH);
    if (!lastMonth) {
      localStorage.setItem(STORAGE_LAST_MONTH, month);
      return;
    }
    if (lastMonth !== month) {
      // new month detected
      try {
        const lastCompletion = localStorage.getItem(STORAGE_COMPLETION(lastMonth));
        if (lastCompletion) setLastMonthSummary(JSON.parse(lastCompletion));
        const lastTargetsSaved = localStorage.getItem(STORAGE_TARGETS(lastMonth));
        if (lastTargetsSaved) {
          const parsed = JSON.parse(lastTargetsSaved);
          setNewMonthDraftTargets(parsed.targets || { inventory: 500, money: 10000, customers: 20 });
        }
      } catch {}
      setShowNewMonthPrompt(true);
      localStorage.setItem(STORAGE_LAST_MONTH, month);
    }
  }, []);

  // Persist targets to localStorage
  useEffect(() => {
    try {
      const month = getMonthKey();
      localStorage.setItem(STORAGE_TARGETS(month), JSON.stringify({ targets, productTargets }));
      localStorage.setItem(STORAGE_LAST_MONTH, month);
    } catch {}
  }, [targets, productTargets]);

  useEffect(() => {
    try {
      const month = getMonthKey();
      localStorage.setItem(STORAGE_COMPLETION(month), JSON.stringify({ month, ...targetCompletions }));
    } catch {}
  }, [targetCompletions]);


  // Save customer section edits to Supabase Client_Details
  const deleteCustomer = async () => {
    if (!selectedCustomer) return;
    const numericId = parseInt(selectedCustomer.customerId, 10);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('Client_Details')
          .delete()
          .eq('Client ID', numericId);
        if (error) { toast.error('Delete failed: ' + error.message); return; }
      }
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      const removedName = selectedCustomer.name;
      setSelectedCustomer(null);
      setDeleteConfirm(false);
      setView('customers-list');
      toast.success(`Deleted ${removedName}`);
    } catch (err: any) {
      toast.error(err?.message || 'Delete error');
    }
  };

  const saveCustomerSection = async () => {
    if (!selectedCustomer || !isSupabaseConfigured) return;
    setIsSavingCustomer(true);
    try {
      const updates: Record<string, unknown> = {};
      if ('contact' in editDraft)        updates['Contact'] = editDraft.contact ?? null;
      if ('location' in editDraft)       updates['Location'] = editDraft.location ?? null;
      if ('whatsappGroup' in editDraft)  updates['Whatsapp Group Name'] = editDraft.whatsappGroup ?? null;
      if ('status' in editDraft)         updates['Status'] = editDraft.status ?? null;
      if ('dueAmount' in editDraft)      updates['Due Amount💲'] = editDraft.dueAmount ?? null;
      if ('lastMonthSales' in editDraft) updates['Last Month Sales💲'] = editDraft.lastMonthSales ?? null;
      if ('lastPaid' in editDraft)       updates['Last Paid💲'] = editDraft.lastPaid ?? null;
      if ('lastPaymentDate' in editDraft) updates['Last Payment Date'] = editDraft.lastPaymentDate ?? null;
      const { error } = await supabase
        .from('Client_Details')
        .update(updates)
        .eq('Client ID', Number(selectedCustomer.customerId));
      if (!error) {
        const updated = { ...selectedCustomer, ...editDraft };
        setSelectedCustomer(updated);
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingSection(null);
        setEditDraft({});
        toast.success('Customer updated');
      } else {
        toast.error('Save failed: ' + error.message);
      }
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Compute next sequential numeric client ID
  const getNextClientId = () => {
    const ids = customers
      .map(c => parseInt(c.customerId, 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    if (ids.length === 0) return '1001';
    // Fill gaps first
    for (let i = 0; i < ids.length - 1; i++) {
      if (ids[i + 1] - ids[i] > 1) return String(ids[i] + 1);
    }
    return String(ids[ids.length - 1] + 1);
  };

  // Open modal for new customer with auto-generated fields
  const openNewCustomerModal = () => {
    const nextId = getNextClientId();
    setTempCustomer({
      id: '',
      customerId: nextId,
      name: '',
      shortName: '',
      email: '',
      initials: '',
      contact: '',
      location: '',
      whatsappGroup: '',
      group: 'Standard',
      balance: 0,
      dueAmount: 0,
      creditLimit: 0,
      paymentTerms: 'Net 30',
      status: 'Active',
      taxId: '',
      address: '',
      remarks: '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingDraftId(null);
    setDraftInvoice({
      id: Math.random().toString(36).substring(2, 9),
      invoiceNumber: `INV-2026-00${invoices.length + 43}`, // Simple increment logic
      items: [],
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 14 days',
      customer: null,
      status: 'draft',
      subtotal: 0,
      vat: 0,
      total: 0
    });
    setView('create-details');
  };

  const calculateTotals = (items: LineItem[], returnValue: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal - returnValue;
    return { subtotal, total };
  };

  // ── Draft invoice handlers ─────────────────────────────
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);

  const saveDraft = async () => {
    if (!draftInvoice.customer?.name) {
      toast.error('Pick a customer before saving draft');
      return;
    }
    const payload = {
      invoice_number: draftInvoice.invoiceNumber || '',
      customer_data: draftInvoice.customer,
      items: draftInvoice.items || [],
      issue_date: draftInvoice.issueDate || new Date().toISOString().slice(0, 10),
      subtotal: draftInvoice.subtotal ?? 0,
      return_amount: draftInvoice.vat ?? 0,
      total: draftInvoice.total ?? 0,
      updated_at: new Date().toISOString(),
    };
    try {
      if (editingDraftId) {
        const { error } = await supabase.from('draft_invoices').update(payload).eq('id', editingDraftId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('draft_invoices').insert(payload);
        if (error) throw error;
      }
      // Refetch to guarantee UI matches DB (handles RLS / cached state issues)
      await refetchDrafts();
      toast.success('Draft saved');
      setEditingDraftId(null);
      setView('dashboard');
      setActiveModule('invoices-module');
    } catch (err: any) {
      const msg = err?.message || 'unknown';
      console.error('Draft save error:', err);
      if (msg.includes('does not exist') || err?.code === '42P01') {
        toast.error('Draft table missing — run draft_invoices SQL in Supabase');
      } else {
        toast.error('Draft save failed: ' + msg);
      }
    }
  };

  const loadDraft = (draft: any) => {
    // Normalize issue_date to YYYY-MM-DD regardless of how Supabase serialized it
    let issueDate = '';
    if (draft.issue_date) {
      const s = String(draft.issue_date);
      issueDate = s.length >= 10 ? s.slice(0, 10) : s;
    } else {
      issueDate = new Date().toISOString().slice(0, 10);
    }
    const loaded: Partial<Invoice> = {
      id: Math.random().toString(36).substring(2, 9),
      invoiceNumber: draft.invoice_number || `INV-2026-00${invoices.length + 43}`,
      customer: draft.customer_data,
      items: draft.items || [],
      issueDate,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: 'Net 14 days',
      status: 'draft',
      subtotal: Number(draft.subtotal ?? 0),
      vat: Number(draft.return_amount ?? 0),
      total: Number(draft.total ?? 0),
    };
    setDraftInvoice(loaded);
    setEditingDraftId(draft.id);
    setView('create-review');
    setActiveModule('data-input');
  };

  const deleteDraft = async (id: number) => {
    try {
      const { error } = await supabase.from('draft_invoices').delete().eq('id', id);
      if (error) throw error;
      setDrafts(prev => prev.filter(d => d.id !== id));
      toast.success('Draft deleted');
    } catch (err: any) {
      toast.error('Delete failed: ' + (err?.message || 'unknown'));
    }
  };

  const finalizeInvoice = async (opts?: { withPdf?: boolean }) => {
    if (!draftInvoice.customer?.name) {
      toast.error('Customer missing — pick one before saving');
      return;
    }
    if (!draftInvoice.items || draftInvoice.items.length === 0) {
      toast.error('Add at least one item before saving');
      return;
    }
    // Ensure required fields are present even when finalizing from a loaded draft
    const newLocalId = draftInvoice.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const finalInvoice = {
      ...draftInvoice,
      id: newLocalId,
      status: 'unpaid' as InvoiceStatus,
    } as Invoice;

    const { customer } = finalInvoice;

    // Snapshot avg cost per product at this moment
    const itemCostsSnapshot: Record<string, number> = {};
    for (const item of finalInvoice.items || []) {
      try {
        itemCostsSnapshot[item.description] = profitData.getCostPrice(item.description);
      } catch {
        itemCostsSnapshot[item.description] = 0;
      }
    }
    finalInvoice.itemCosts = itemCostsSnapshot;

    // Save to invoice table — unique id from timestamp avoids duplicate-key collisions
    let dbInsertOK = true;
    try {
      const uniqueId = `${Date.now()}`.slice(-9);
      const { error } = await supabase.from('invoice').insert({
        id: uniqueId,
        invoice_number: finalInvoice.invoiceNumber,
        customer_id: customer?.customerId || customer?.id,
        customer_name: customer?.name,
        issue_date: finalInvoice.issueDate,
        item: (finalInvoice.items || []).map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
        item_costs: itemCostsSnapshot,
        subtotal: finalInvoice.subtotal,
        return: finalInvoice.vat ?? 0,
        total: finalInvoice.total,
        notes: finalInvoice.notes || null,
      });
      if (error) {
        dbInsertOK = false;
        console.error('invoice insert error:', error);
        toast.error('Invoice DB save failed: ' + error.message);
      }
    } catch (err: any) {
      dbInsertOK = false;
      console.error('invoice insert exception:', err);
      toast.error('Invoice save error: ' + (err?.message || 'unknown'));
    }

    // Save to Sales_Data (independent)
    if (isSupabaseConfigured && customer?.name) {
      try {
        const salesRow: Record<string, unknown> = {
          'Date': finalInvoice.issueDate,
          'Customer Name': customer.name,
          'Total Sales (MYR)': finalInvoice.total ?? 0,
        };
        for (const p of dbProducts) {
          salesRow[`${p.name} (Rate)`] = 0;
          salesRow[`${p.name} (Qty)`] = 0;
        }
        for (const item of finalInvoice.items || []) {
          salesRow[`${item.description} (Rate)`] = item.unitPrice;
          salesRow[`${item.description} (Qty)`] = item.quantity;
        }
        console.log('💾 Inserting Sales_Data row:', salesRow);
        const { error: salesErr, data: salesData } = await supabase.from('Sales_Data').insert(salesRow).select();
        if (salesErr) console.error('❌ Sales_Data insert error:', salesErr.message, salesErr.details, salesErr.hint);
        else console.log('✅ Sales_Data inserted:', salesData);
      } catch (err) {
        console.error('Sales_Data exception:', err);
      }
    }

    // Local-first add so UI updates immediately regardless of DB outcome
    setInvoices(prev => {
      // Avoid duplicates if invoice already present (e.g. retries)
      if (prev.some(p => p.invoiceNumber === finalInvoice.invoiceNumber)) return prev;
      return [finalInvoice, ...prev];
    });

    // If finalized from a draft, remove the draft row (only when DB save OK to avoid losing it)
    if (editingDraftId && dbInsertOK) {
      try {
        await supabase.from('draft_invoices').delete().eq('id', editingDraftId);
        setDrafts(prev => prev.filter(d => d.id !== editingDraftId));
      } catch (err) {
        console.error('Draft cleanup failed:', err);
      }
      setEditingDraftId(null);
    } else if (editingDraftId && !dbInsertOK) {
      // Keep draft so user can retry
      console.warn('Keeping draft because invoice DB insert failed');
    }

    setView('dashboard');
    setActiveModule('invoices-module');
    if (dbInsertOK) {
      toast.success(`Invoice ${finalInvoice.invoiceNumber} created`);
    } else {
      toast.error('Invoice saved locally only — DB sync failed, draft preserved');
    }

    // Trigger PDF download if requested
    if (opts?.withPdf) {
      downloadInvoicePDF({
        invoiceNumber: finalInvoice.invoiceNumber || '',
        issueDate: finalInvoice.issueDate || '',
        customer: {
          customerId: customer?.customerId,
          name: customer?.name || '',
          contact: customer?.contact,
          location: customer?.location,
        },
        items: (finalInvoice.items || []).map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        subtotal: finalInvoice.subtotal ?? 0,
        returnAmount: finalInvoice.vat ?? 0,
        total: finalInvoice.total ?? 0,
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('moneytracking').delete().eq('id', id);
      if (error) { toast.error('Delete failed: ' + error.message); return; }
    }
    setTransactions((prev: Transaction[]) => prev.filter(t => t.id !== id));
    toast.success('Transaction deleted');
  };

  // Build context value with everything views/modals need
  const ctxValue = {
    // theme
    theme, toggleTheme,
    // sidebar
    sidebarCollapsed, toggleSidebar,
    // navigation
    view, setView, activeModule, setActiveModule, dashboardSubView, setDashboardSubView,
    profitSubTab, setProfitSubTab, inventorySubView, setInventorySubView,
    // ui flags
    isMenuOpen, setIsMenuOpen, isLoading, setIsLoading,
    isCustomerSearchOpen, setIsCustomerSearchOpen,
    isCustomerModalOpen, setIsCustomerModalOpen,
    isCustomerPickerOpen, setIsCustomerPickerOpen, customerPickerSearch, setCustomerPickerSearch,
    isInventoryItemModalOpen, setIsInventoryItemModalOpen,
    isTransactionModalOpen, setIsTransactionModalOpen,
    isInventorySearchActive, setIsInventorySearchActive, inventorySearchQuery, setInventorySearchQuery,
    isSortDropdownOpen, setIsSortDropdownOpen,
    isDashboardCustomerDropdownOpen, setIsDashboardCustomerDropdownOpen,
    showNewMonthPrompt, setShowNewMonthPrompt,
    // data
    customers, setCustomers, inventory, setInventory, invoices, setInvoices,
    transactions, setTransactions, salesRows, setSalesRows,
    dbProducts, setDbProducts, dbSuppliers, setDbSuppliers,
    productCosts,
    // selections + drafts
    selectedCustomer, setSelectedCustomer, selectedInventoryItem, setSelectedInventoryItem,
    selectedInvoice, setSelectedInvoice, selectedItem, setSelectedItem,
    selectedDashboardCustomers, setSelectedDashboardCustomers,
    draftInvoice, setDraftInvoice,
    tempCustomer, setTempCustomer, tempInventoryItem, setTempInventoryItem,
    tempTransaction, setTempTransaction, transactionType, setTransactionType,
    editingTransactionId, setEditingTransactionId, deleteTransaction,
    editingItemId, setEditingItemId, editMode, setEditMode,
    editingSection, setEditingSection, editDraft, setEditDraft,
    isSavingCustomer, setIsSavingCustomer, deleteConfirm, setDeleteConfirm,
    inventoryDeleteConfirm, setInventoryDeleteConfirm,
    editingInventorySection, setEditingInventorySection,
    editingStockProduct, setEditingStockProduct, tempProductStock, setTempProductStock,
    addingSupplierForProduct, setAddingSupplierForProduct,
    newSupplierDraft, setNewSupplierDraft,
    editingSupplierRow, setEditingSupplierRow,
    isInlineAddingCustomer, setIsInlineAddingCustomer,
    newItemDesc, setNewItemDesc, newItemQty, setNewItemQty, newItemPrice, setNewItemPrice,
    isEditingTarget, setIsEditingTarget, tempTargetValue, setTempTargetValue,
    customerDropdownSearch, setCustomerDropdownSearch,
    // filters/sorts
    customerFilter, setCustomerFilter, customerSort, setCustomerSort,
    customerSortOrder, setCustomerSortOrder, productSortBy, setProductSortBy,
    productSortOrder, setProductSortOrder, inventorySort, setInventorySort,
    moneySearchQuery, setMoneySearchQuery, moneyFilter, setMoneyFilter, searchQuery, setSearchQuery,
    fromDate, setFromDate, toDate, setToDate,
    // targets
    targets, setTargets, productTargets, setProductTargets,
    lastMonthSummary, setLastMonthSummary,
    newMonthDraftTargets, setNewMonthDraftTargets,
    // computed
    profitData, customerLastMonthSales, customerCurrMonthSales,
    dataDateRange, productInventoryData, dashboardCustomerNames,
    targetCompletions, liveDashboardData, visibleInventoryItems, filteredInvoices,
    // helpers + handlers
    getProductStock, getProductSuppliers, isProductHidden, getProductCompanyName,
    getNextClientId, openNewCustomerModal, handleCreateNew, finalizeInvoice, calculateTotals,
    saveCustomerSection, deleteCustomer,
    // drafts
    drafts, setDrafts, saveDraft, loadDraft, deleteDraft, editingDraftId,
    // role-based access
    userRole, can, canViewModule: (m: Module) => canViewModule(userRole, m),
  };

  // Auth gates — active whenever Supabase is configured (dev + prod)
  const authGateActive = isSupabaseConfigured;

  if (authGateActive && (!authChecked || (session && !roleChecked))) {
    return <AppBootSkeleton />;
  }
  if (authGateActive && !session) {
    return <AuthScreen />;
  }

  return (
    <AppContext.Provider value={ctxValue}>
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-300 font-sans overflow-x-hidden transition-colors duration-300">
      <OfflineBanner />
      <Sidebar />

      {/* ── Content Area ─────────────────────────────────────── */}
      <div className={`flex justify-center lg:justify-start min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}>
      <div className="w-full max-w-[430px] mx-auto lg:max-w-none bg-white min-h-screen shadow-2xl lg:shadow-none relative flex flex-col">
        
        <MobileMenu />

        <Suspense fallback={<ContentSkeleton view={view} />}>
          {isLoading && (view === 'dashboard' || view === 'analytics') ? (
            <ContentSkeleton view={view} />
          ) : (
            <>
              {view === 'dashboard' && <Dashboard />}

              {view === 'invoice-preview' && selectedInvoice && (
                <InvoicePreview
                  selectedInvoice={selectedInvoice}
                  setView={setView}
                  setActiveModule={setActiveModule}
                />
              )}

              {view === 'inventory-list' && <InventoryList />}

              {view === 'money-tracking' && <MoneyTracking />}

              {view === 'customers-list' && <CustomersList />}

              {view === 'inventory-details' && selectedInventoryItem && <InventoryDetails />}

              {view === 'customer-details' && selectedCustomer && <CustomerDetails />}

              {view.startsWith('create') && <CreateInvoice />}

              {view === 'analytics' && <Analytics />}

              {view === 'todo-list' && <TodoList />}

              {view === 'notes' && <Notes />}
            </>
          )}
        </Suspense>

          {isTransactionModalOpen && (
          <TransactionModal
            transactionType={transactionType}
            tempTransaction={tempTransaction}
            setTempTransaction={setTempTransaction}
            transactions={transactions}
            setTransactions={setTransactions}
            onClose={() => setIsTransactionModalOpen(false)}
          />
        )}

        {isInventoryItemModalOpen && (
          <InventoryItemModal
            tempInventoryItem={tempInventoryItem}
            setTempInventoryItem={setTempInventoryItem}
            editMode={editMode}
            setEditMode={setEditMode}
            selectedInventoryItem={selectedInventoryItem}
            setSelectedInventoryItem={setSelectedInventoryItem}
            inventory={inventory}
            setInventory={setInventory}
            setDbProducts={setDbProducts}
            onClose={() => setIsInventoryItemModalOpen(false)}
          />
        )}

        {isCustomerPickerOpen && (
          <CustomerPickerModal
            customers={customers}
            customerPickerSearch={customerPickerSearch}
            setCustomerPickerSearch={setCustomerPickerSearch}
            draftInvoice={draftInvoice}
            setDraftInvoice={setDraftInvoice}
            onClose={() => setIsCustomerPickerOpen(false)}
          />
        )}

        {isCustomerModalOpen && (
          <CustomerModal
            tempCustomer={tempCustomer}
            setTempCustomer={setTempCustomer}
            customers={customers}
            setCustomers={setCustomers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            setDraftInvoice={setDraftInvoice}
            onClose={() => setIsCustomerModalOpen(false)}
          />
        )}

      {showNewMonthPrompt && <NewMonthPrompt />}

      </div>
      </div>
    </div>
    </AppContext.Provider>
  );
}
