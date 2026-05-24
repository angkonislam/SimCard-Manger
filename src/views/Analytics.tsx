import { useState, useMemo } from 'react';
import { Menu, LayoutGrid, Users, Layers, Calendar, X, ChevronDown, Search, Check, ArrowUpRight, ExternalLink } from 'lucide-react';
import { NotificationCenter } from '../components/NotificationCenter';
import { ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { useApp } from '../AppContext';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { DashboardSubView } from '../constants';
import { formatMonthLabel, getMonthKey, getBrandColor } from '../utils';

export function Analytics() {
  const {
    setIsMenuOpen,
    dashboardSubView, setDashboardSubView,
    fromDate, setFromDate, toDate, setToDate,
    dataDateRange,
    isDashboardCustomerDropdownOpen, setIsDashboardCustomerDropdownOpen,
    customerDropdownSearch, setCustomerDropdownSearch,
    selectedDashboardCustomers, setSelectedDashboardCustomers,
    dashboardCustomerNames,
    selectedItem, setSelectedItem,
    liveDashboardData,
    isEditingTarget, setIsEditingTarget,
    tempTargetValue, setTempTargetValue,
    productTargets, setProductTargets,
    targets, setTargets,
    customerSortOrder, setCustomerSortOrder,
    productSortBy, setProductSortBy,
    productSortOrder, setProductSortOrder,
    salesRows,
    can,
    visibleInventoryItems,
    setSelectedInventoryItem,
    customers,
    setSelectedCustomer,
    setView,
  } = useApp();
  const canEdit = !!can?.('edit:data');

  const drillToProduct = (productName: string) => {
    const item = (visibleInventoryItems || []).find((i: any) => i.name === productName);
    if (item) {
      setSelectedInventoryItem(item);
      setView('inventory-details');
    }
  };
  const drillToCustomer = (customerName: string) => {
    const c = (customers || []).find((x: any) => x.name === customerName || x.shortName === customerName);
    if (c) {
      setSelectedCustomer(c);
      setView('customer-details');
    }
  };

  // Daily stats from date range above (already filtered by fromDate/toDate in liveDashboardData)
  const dailyStatsAll = liveDashboardData.overview.dailyStats as any[];

  // Products dataset re-filtered when selectedItem is a Customer
  const effectiveProductsDataset = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'Customer') {
      return liveDashboardData.products.dataset as any[];
    }
    // Re-aggregate products from raw salesRows filtered by selected customer + date range
    const rows = (salesRows as any[]).filter((r: any) => {
      if (r.customer_name !== selectedItem.name) return false;
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      return true;
    });
    const map: Record<string, { name: string; qty: number; sales: number }> = {};
    rows.forEach((r: any) => {
      if (!map[r.product]) map[r.product] = { name: r.product, qty: 0, sales: 0 };
      map[r.product].qty += r.qty;
      map[r.product].sales += r.qty * r.rate;
    });
    return Object.values(map)
      .sort((a, b) => b.sales - a.sales)
      .map((item, idx) => ({
        ...item,
        sales: parseFloat(item.sales.toFixed(2)),
        color: getBrandColor(item.name, idx),
      }));
  }, [selectedItem, salesRows, fromDate, toDate, liveDashboardData.products.dataset]);

  // Customers dataset re-filtered when selectedItem is a Product
  const effectiveCustomersDataset = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'Product') {
      return liveDashboardData.customers.top as any[];
    }
    // Re-aggregate customers from raw salesRows filtered by selected product + date range
    const rows = (salesRows as any[]).filter((r: any) => {
      if (r.product !== selectedItem.name) return false;
      if (fromDate && r.date < fromDate) return false;
      if (toDate && r.date > toDate) return false;
      return true;
    });
    const map: Record<string, { name: string; value: number; qty: number }> = {};
    rows.forEach((r: any) => {
      if (!map[r.customer_name]) map[r.customer_name] = { name: r.customer_name, value: 0, qty: 0 };
      map[r.customer_name].value += r.qty * r.rate;
      map[r.customer_name].qty += r.qty;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [selectedItem, salesRows, fromDate, toDate, liveDashboardData.customers.top]);

  // Chart variant toggles
  const [productChartType, setProductChartType] = useState<'doughnut' | 'pie'>('doughnut');
  const [dailyChartType, setDailyChartType] = useState<'area' | 'line'>('area');

  // Color shade helper for 3D gradient stops
  const shade = (hex: string, pct: number) => {
    const m = hex.replace('#', '').match(/.{2}/g);
    if (!m || m.length < 3) return hex;
    const [r, g, b] = m.map((x) => parseInt(x, 16));
    const adj = (c: number) =>
      Math.max(0, Math.min(255, Math.round(c + (pct > 0 ? (255 - c) * (pct / 100) : c * (pct / 100)))));
    return `#${[adj(r), adj(g), adj(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  };

  // Scrollable chart inner width — adaptive per-day width, capped to safe SVG size
  const daysCount = Math.max(1, dailyStatsAll.length);

  // Auto-switch to monthly view when range > 90 days
  const useMonthly = daysCount > 90;

  // Aggregate daily data into monthly buckets when in monthly mode
  const monthlyStats = (() => {
    if (!useMonthly) return [] as { label: string; monthKey: string; sales: number; qty: number }[];
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const map: Record<string, { label: string; monthKey: string; sales: number; qty: number }> = {};
    for (const row of dailyStatsAll) {
      if (!row.date) continue;
      const key = row.date.substring(0, 7); // "yyyy-MM"
      if (!map[key]) {
        const [y, m] = key.split('-');
        map[key] = { label: `${MONTHS[parseInt(m, 10) - 1]} '${y.slice(2)}`, monthKey: key, sales: 0, qty: 0 };
      }
      map[key].sales += row.sales;
      map[key].qty += row.qty;
    }
    return Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  })();

  // Browser SVG width cap ≈ 32767px. Use 28000 to be safe.
  const MAX_CHART_WIDTH = 28000;
  const MIN_PER_DAY = 12;
  const MAX_PER_DAY = 60;
  const idealWidth = daysCount * MAX_PER_DAY;
  const PER_DAY_WIDTH = idealWidth <= MAX_CHART_WIDTH
    ? MAX_PER_DAY
    : Math.max(MIN_PER_DAY, Math.floor(MAX_CHART_WIDTH / daysCount));
  const chartInnerWidth = useMonthly
    ? Math.max(monthlyStats.length * 80, 320)
    : Math.max(daysCount * PER_DAY_WIDTH, 320);

  // Format yyyy-MM-dd to "DD MMM YYYY" (e.g. "25 Apr 2026")
  const formatFullDate = (iso?: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}`;
  };

  // Shared tooltip for daily charts — full date header + formatted values
  const DailyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    const seen = new Set<string>();
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] px-4 py-3 min-w-[160px]">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
          {row.label || formatFullDate(row.date) || `Day ${row.day}`}
        </p>
        <div className="space-y-1.5">
          {payload.map((p: any, i: number) => {
            if (seen.has(p.dataKey)) return null;
            seen.add(p.dataKey);
            const isSales = p.dataKey === 'sales';
            const color = isSales ? '#10b981' : '#4d96ff';
            const label = isSales ? 'Sales' : 'Qty';
            const val = isSales
              ? `RM ${Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${Number(p.value).toLocaleString()} units`;
            return (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{label}</span>
                </div>
                <span className="text-[12px] font-black tracking-tight" style={{ color }}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Pie/Doughnut tooltip — show product name + percentage + sales
  const ProductTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    const prod = effectiveProductsDataset.find((p: any) => p.name === row.name);
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] px-4 py-3 min-w-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="text-[12px] font-black text-gray-900 dark:text-gray-200 tracking-tight">{row.name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Share</span>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{row.value}%</span>
          </div>
          {prod && (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Sales</span>
                <span className="text-[11px] font-black text-gray-900 dark:text-gray-200">RM {prod.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Qty</span>
                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{prod.qty.toLocaleString()} units</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Customer bar tooltip — stacked sales + qty
  const CustomerTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0]?.payload;
    if (!row) return null;
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] px-4 py-3 min-w-[180px]">
        <p className="text-[12px] font-black text-gray-900 dark:text-gray-200 tracking-tight mb-2">{row.name}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Sales</span>
            </div>
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">RM {Number(row.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4d96ff]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Qty</span>
            </div>
            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{Number(row.qty || 0).toLocaleString()} units</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden transition-colors">
      <div className="px-4 sm:px-6 pb-2 pt-4 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-200 tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutGrid },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'products', label: 'Products', icon: Layers },
              ].map(nav => {
                const isActiveTab = dashboardSubView === nav.id;
                const IconTab = nav.icon;
                return (
                  <button key={nav.id} onClick={() => setDashboardSubView(nav.id as DashboardSubView)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isActiveTab ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    <IconTab className="w-3.5 h-3.5" />
                    {nav.label}
                  </button>
                );
              })}
            </div>
            <NotificationCenter />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex-1 space-y-1 pl-3">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">From Date</label>
              <CustomDatePicker value={fromDate} onChange={setFromDate} align="left" minDate={dataDateRange.min || undefined} maxDate={dataDateRange.max || undefined}>
                <div className="flex items-center gap-2 cursor-pointer group">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-gray-900 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{fromDate ? fromDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                </div>
              </CustomDatePicker>
            </div>
            <div className="w-px h-8 bg-gray-100 dark:bg-slate-800" />
            <div className="flex-1 space-y-1 pl-3">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">To Date</label>
              <CustomDatePicker value={toDate} onChange={setToDate} align="right" minDate={dataDateRange.min || undefined} maxDate={dataDateRange.max || undefined}>
                <div className="flex items-center gap-2 cursor-pointer group">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-gray-900 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{toDate ? toDate.split('-').reverse().join('-') : 'DD-MM-YYYY'}</span>
                </div>
              </CustomDatePicker>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-500 ml-1 shrink-0" />
            <div className="flex-1 relative">
              <button
                onClick={() => { setIsDashboardCustomerDropdownOpen((o: boolean) => !o); setCustomerDropdownSearch(''); }}
                className="w-full flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 px-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className={`text-sm font-bold truncate ${selectedDashboardCustomers.length === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-300'}`}>
                  {selectedDashboardCustomers.length === 0
                    ? 'All customers'
                    : selectedDashboardCustomers.length === 1
                      ? selectedDashboardCustomers[0]
                      : `${selectedDashboardCustomers.length} customers selected`}
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {selectedDashboardCustomers.length > 0 && (
                    <button onClick={e => { e.stopPropagation(); setSelectedDashboardCustomers([]); }} className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors">
                      <X className="w-2.5 h-2.5 text-gray-600 dark:text-gray-300" />
                    </button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isDashboardCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isDashboardCustomerDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setIsDashboardCustomerDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl z-[101] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="p-3 border-b border-gray-50 dark:border-slate-800">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <input autoFocus type="text" placeholder="Search customer..." value={customerDropdownSearch}
                          onChange={e => setCustomerDropdownSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto no-scrollbar">
                      {!customerDropdownSearch && (
                        <button onClick={() => { setSelectedDashboardCustomers([]); setIsDashboardCustomerDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors border-b border-gray-50 dark:border-slate-800 ${selectedDashboardCustomers.length === 0 ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selectedDashboardCustomers.length === 0 ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-slate-800'}`}>
                            {selectedDashboardCustomers.length === 0 && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          All Customers
                        </button>
                      )}
                      {dashboardCustomerNames
                        .filter((n: string) => n.toLowerCase().includes(customerDropdownSearch.toLowerCase()))
                        .map((name: string) => {
                          const isSel = selectedDashboardCustomers.includes(name);
                          return (
                            <button key={name}
                              onClick={() => setSelectedDashboardCustomers((prev: string[]) =>
                                isSel ? prev.filter(n => n !== name) : [...prev, name]
                              )}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${isSel ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSel ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-slate-800'}`}>
                                {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className="truncate text-left">{name}</span>
                            </button>
                          );
                        })}
                      {dashboardCustomerNames.filter((n: string) => n.toLowerCase().includes(customerDropdownSearch.toLowerCase())).length === 0 && (
                        <p className="px-4 py-6 text-xs font-bold text-gray-400 dark:text-gray-500 text-center">No customers found</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-40 space-y-6 sm:space-y-8 mt-3 sm:mt-4">
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 tracking-tight capitalize">
                {selectedItem ? selectedItem.name : dashboardSubView}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em]">
                  {selectedItem ? `Filtered by ${selectedItem.type}` : 'Apr 1 · 9 · Global Stats'}
                </p>
                {selectedItem && (
                  <button onClick={() => setSelectedItem(null)} className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-5 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-lg group hover:shadow-md dark:hover:shadow-xl transition-shadow">
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">TOTAL SALES</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-200 tracking-tight">
                {selectedItem ? (selectedItem.sales / 1000).toFixed(2) : (liveDashboardData.overview.totalSales / 1000).toFixed(2)}K
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-3">
                RM {(selectedItem ? selectedItem.sales : liveDashboardData.overview.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <div onClick={(e) => {
                e.stopPropagation();
                if (!canEdit) return;
                if (selectedItem) {
                  setIsEditingTarget(`product-money-${selectedItem.name}`);
                  setTempTargetValue(productTargets[`money-${selectedItem.name}`]?.toString() || '');
                } else {
                  setIsEditingTarget('money');
                  setTempTargetValue(targets.money?.toString() || '');
                }
              }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit transition-all ${canEdit ? 'cursor-pointer' : ''} ${(() => {
                  const moneyTarget = selectedItem ? productTargets[`money-${selectedItem.name}`] : targets.money;
                  const moneyActual = selectedItem ? selectedItem.sales : liveDashboardData.overview.totalSales;
                  const moneyDone = moneyTarget && moneyActual >= moneyTarget;
                  return moneyDone
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25'
                    : moneyTarget
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 hover:bg-blue-500/20 dark:hover:bg-blue-500/25'
                      : 'bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25';
                })()}`}>
                {isEditingTarget === (selectedItem ? `product-money-${selectedItem.name}` : 'money') ? (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input type="number" className="w-16 bg-white border border-gray-100 rounded px-1 py-0.5 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={tempTargetValue} onChange={e => setTempTargetValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = parseInt(tempTargetValue);
                          if (selectedItem) setProductTargets({ ...productTargets, [`money-${selectedItem.name}`]: isNaN(val) ? 0 : val });
                          else setTargets({ ...targets, money: isNaN(val) ? null : val });
                          setIsEditingTarget(null);
                        }
                        if (e.key === 'Escape') setIsEditingTarget(null);
                      }} autoFocus />
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const val = parseInt(tempTargetValue);
                      if (selectedItem) setProductTargets({ ...productTargets, [`money-${selectedItem.name}`]: isNaN(val) ? 0 : val });
                      else setTargets({ ...targets, money: isNaN(val) ? null : val });
                      setIsEditingTarget(null);
                    }} className="text-[10px] font-black text-blue-600 uppercase">Set</button>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const moneyTarget = selectedItem ? productTargets[`money-${selectedItem.name}`] : targets.money;
                      const moneyActual = selectedItem ? selectedItem.sales : liveDashboardData.overview.totalSales;
                      const moneyDone = !!(moneyTarget && moneyActual >= moneyTarget);
                      const color = moneyDone ? 'text-emerald-600 dark:text-emerald-400' : moneyTarget ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400';
                      return (
                        <>
                          <ArrowUpRight className={`w-2 h-2 fill-current ${color}`} />
                          <span className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${color} flex items-center gap-1 whitespace-nowrap`}>
                              {moneyTarget ? `RM ${moneyTarget.toLocaleString()}` : 'SET MONTHLY TARGET'}
                              {moneyDone && <span className="text-emerald-500">✓</span>}
                            </span>
                            {moneyTarget && <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{formatMonthLabel((fromDate || getMonthKey()).substring(0, 7))}</span>}
                          </span>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
            <div className="p-3.5 sm:p-5 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-lg group hover:shadow-md dark:hover:shadow-xl transition-shadow">
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">TOTAL QTY</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-200 tracking-tight">
                {(selectedItem ? selectedItem.qty : liveDashboardData.overview.totalQty).toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-3">
                {selectedItem ? 'units itemized' : 'units sold'}
              </p>
              <div onClick={(e) => {
                e.stopPropagation();
                if (!canEdit) return;
                if (selectedItem) {
                  setIsEditingTarget(`product-inventory-${selectedItem.name}`);
                  setTempTargetValue(productTargets[`inventory-${selectedItem.name}`]?.toString() || '');
                } else {
                  setIsEditingTarget('inventory');
                  setTempTargetValue(targets.inventory?.toString() || '');
                }
              }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit transition-all ${canEdit ? 'cursor-pointer' : ''} ${(() => {
                  const qtyTarget = selectedItem ? productTargets[`inventory-${selectedItem.name}`] : targets.inventory;
                  const qtyActual = selectedItem ? selectedItem.qty : liveDashboardData.overview.totalQty;
                  const qtyDone = qtyTarget && qtyActual >= qtyTarget;
                  return qtyDone
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25'
                    : qtyTarget
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 hover:bg-blue-500/20 dark:hover:bg-blue-500/25'
                      : 'bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25';
                })()}`}>
                {isEditingTarget === (selectedItem ? `product-inventory-${selectedItem.name}` : 'inventory') ? (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input type="number" className="w-16 bg-white border border-gray-100 rounded px-1 py-0.5 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={tempTargetValue} onChange={e => setTempTargetValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = parseInt(tempTargetValue);
                          if (selectedItem) setProductTargets({ ...productTargets, [`inventory-${selectedItem.name}`]: isNaN(val) ? 0 : val });
                          else setTargets({ ...targets, inventory: isNaN(val) ? null : val });
                          setIsEditingTarget(null);
                        }
                        if (e.key === 'Escape') setIsEditingTarget(null);
                      }} autoFocus />
                    <button onClick={(e) => {
                      e.stopPropagation();
                      const val = parseInt(tempTargetValue);
                      if (selectedItem) setProductTargets({ ...productTargets, [`inventory-${selectedItem.name}`]: isNaN(val) ? 0 : val });
                      else setTargets({ ...targets, inventory: isNaN(val) ? null : val });
                      setIsEditingTarget(null);
                    }} className="text-[10px] font-black text-blue-600 uppercase">Set</button>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const qtyTarget = selectedItem ? productTargets[`inventory-${selectedItem.name}`] : targets.inventory;
                      const qtyActual = selectedItem ? selectedItem.qty : liveDashboardData.overview.totalQty;
                      const qtyDone = !!(qtyTarget && qtyActual >= qtyTarget);
                      const color = qtyDone ? 'text-emerald-600 dark:text-emerald-400' : qtyTarget ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400';
                      return (
                        <>
                          <ArrowUpRight className={`w-2 h-2 fill-current ${color}`} />
                          <span className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${color} flex items-center gap-1 whitespace-nowrap`}>
                              {qtyTarget ? `${qtyTarget} UNITS` : 'SET MONTHLY TARGET'}
                              {qtyDone && <span className="text-emerald-500">✓</span>}
                            </span>
                            {qtyTarget && <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{formatMonthLabel((fromDate || getMonthKey()).substring(0, 7))}</span>}
                          </span>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {dashboardSubView === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-lg relative overflow-hidden chart-highlight-active group hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-center mb-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 tracking-tight">Product share</h3>
                <div className="inline-flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-slate-800 rounded-full">
                  {(['doughnut', 'pie'] as const).map(t => (
                    <button key={t} onClick={() => setProductChartType(t)}
                      className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all ${productChartType === t ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-72 -mt-2" style={{ perspective: '1400px' }}>
                <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(38deg) rotateZ(0deg)' }}>
                  {/* Side wall depth layers (back to front) */}
                  {Array.from({ length: 14 }).map((_, layerIdx) => {
                    const depth = 14 - layerIdx; // closer to viewer = lower depth value
                    const darkenPct = -(depth * 4); // bottom darkest
                    return (
                      <div key={`layer-${layerIdx}`} className="absolute inset-0" style={{ transform: `translateZ(${-depth * 2.2}px)` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={liveDashboardData.overview.productShare} cx="50%" cy="50%"
                              innerRadius={productChartType === 'doughnut' ? 70 : 0}
                              outerRadius={100}
                              paddingAngle={productChartType === 'doughnut' ? 2 : 0}
                              dataKey="value" stroke="none" isAnimationActive={false}>
                              {liveDashboardData.overview.productShare.map((entry: any, ci: number) => (
                                <Cell key={`wall-${layerIdx}-${ci}`} fill={shade(entry.color, darkenPct)} style={{ pointerEvents: 'none' }} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })}
                  {/* Top face with gradients + interactivity */}
                  <div className="absolute inset-0" style={{ transform: 'translateZ(0px)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {liveDashboardData.overview.productShare.map((entry: any, index: number) => (
                            <radialGradient key={`pieGrad-${index}`} id={`pieGrad-${index}`} cx="35%" cy="30%" r="75%" fx="30%" fy="25%">
                              <stop offset="0%" stopColor={shade(entry.color, 55)} stopOpacity={1} />
                              <stop offset="55%" stopColor={shade(entry.color, 10)} stopOpacity={1} />
                              <stop offset="100%" stopColor={shade(entry.color, -15)} stopOpacity={1} />
                            </radialGradient>
                          ))}
                          <radialGradient id="pieGloss" cx="50%" cy="20%" r="60%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                            <stop offset="60%" stopColor="#ffffff" stopOpacity={0.05} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                          </radialGradient>
                        </defs>
                        <Pie data={liveDashboardData.overview.productShare} cx="50%" cy="50%"
                          innerRadius={productChartType === 'doughnut' ? 70 : 0}
                          outerRadius={100}
                          paddingAngle={productChartType === 'doughnut' ? 2 : 0}
                          dataKey="value" stroke="rgba(255,255,255,0.5)" strokeWidth={1}
                          animationDuration={1200}>
                          {liveDashboardData.overview.productShare.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index})`} className="cursor-pointer outline-none transition-opacity hover:opacity-90"
                              onClick={() => {
                                const product = effectiveProductsDataset.find((p: any) => p.name === entry.name);
                                if (product) setSelectedItem({ name: product.name, sales: product.sales, qty: product.qty, type: 'Product' });
                              }} />
                          ))}
                        </Pie>
                        <Pie data={liveDashboardData.overview.productShare} cx="50%" cy="50%"
                          innerRadius={productChartType === 'doughnut' ? 70 : 0}
                          outerRadius={100}
                          paddingAngle={productChartType === 'doughnut' ? 2 : 0}
                          dataKey="value" stroke="none" fill="url(#pieGloss)" isAnimationActive={false}
                          style={{ pointerEvents: 'none' }} />
                        <Tooltip content={<ProductTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Ground shadow */}
                <div className="absolute left-1/2 -translate-x-1/2 w-44 h-6 rounded-full bg-black/20 dark:bg-black/40 blur-xl" style={{ bottom: '-4px' }} />
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-2">
                {liveDashboardData.overview.productShare.map((item: any) => (
                  <button key={item.name} onClick={() => {
                    const product = effectiveProductsDataset.find((p: any) => p.name === item.name);
                    if (product) setSelectedItem({ name: product.name, sales: product.sales, qty: product.qty, type: 'Product' });
                  }} className="flex items-center gap-2 group cursor-pointer text-left outline-none">
                    <div className="w-3 h-3 rounded-sm shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: item.color }} />
                    <span className={`text-[11px] font-bold transition-colors ${selectedItem?.name === item.name ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                      {item.name} {item.value}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-lg mb-12 relative overflow-hidden chart-highlight-active group hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 tracking-tight">Daily Sales vs Qty</h3>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{useMonthly ? 'Aggregated monthly performance' : 'Real-time performance updates'}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-slate-800 rounded-full">
                    {(['area', 'line'] as const).map(t => (
                      <button key={t} onClick={() => setDailyChartType(t)}
                        className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest transition-all ${dailyChartType === t ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4d96ff] shadow-[0_0_10px_rgba(77,150,255,0.3)]" />
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Qty</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mb-2 px-1">
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">? Sales (RM)</span>
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Qty ?</span>
              </div>
              <div className="h-56 overflow-x-auto overflow-y-hidden chart-scroll" style={{ touchAction: 'pan-x' }}>
                <div style={{ width: chartInnerWidth, height: '100%', touchAction: 'pan-x' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {dailyChartType === 'area' ? (
                    <AreaChart data={useMonthly ? monthlyStats : dailyStatsAll} margin={{ top: 0, right: 42, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGradientSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="chartGradientQty" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4d96ff" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#4d96ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey={useMonthly ? 'label' : 'day'} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#94a3b8' }} dy={10}
                        interval="preserveStartEnd" minTickGap={20}
                        tickFormatter={(v: any, idx: number) => {
                          if (useMonthly) return String(v);
                          const row = dailyStatsAll[idx];
                          if (!row || !row.date) return String(v);
                          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                          const [y, m, d] = row.date.split('-');
                          const mi = parseInt(m, 10) - 1;
                          return daysCount > 120 ? `${months[mi]} '${y.slice(2)}` : `${parseInt(d, 10)} ${months[mi]}`;
                        }} />
                      <YAxis yAxisId="sales" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#10b981' }} width={44} />
                      <YAxis yAxisId="qty" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#4d96ff' }} width={36}
                        domain={[0, (dataMax: number) => Math.ceil(dataMax * 2.2)]} />
                      <Tooltip content={<DailyTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area yAxisId="sales" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#chartGradientSales)"
                        className="cursor-pointer"
                        onClick={(data: any) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            const d = data.activePayload[0].payload;
                            setSelectedItem({ name: `Day ${d.day}`, sales: d.sales, qty: d.qty, type: 'Daily' });
                          }
                        }} animationDuration={1500} />
                      <Area yAxisId="qty" type="monotone" dataKey="qty" stroke="#4d96ff" strokeWidth={3} fillOpacity={1} fill="url(#chartGradientQty)"
                        className="cursor-pointer"
                        onClick={(data: any) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            const d = data.activePayload[0].payload;
                            setSelectedItem({ name: `Day ${d.day}`, sales: d.sales, qty: d.qty, type: 'Daily' });
                          }
                        }} animationDuration={2000} />
                    </AreaChart>
                  ) : (
                    <LineChart data={useMonthly ? monthlyStats : dailyStatsAll} margin={{ top: 0, right: 42, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:[&_line]:stroke-slate-800" vertical={false} />
                      <XAxis dataKey={useMonthly ? 'label' : 'day'} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#94a3b8' }} dy={10}
                        interval="preserveStartEnd" minTickGap={20}
                        tickFormatter={(v: any, idx: number) => {
                          if (useMonthly) return String(v);
                          const row = dailyStatsAll[idx];
                          if (!row || !row.date) return String(v);
                          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                          const [y, m, d] = row.date.split('-');
                          const mi = parseInt(m, 10) - 1;
                          return daysCount > 120 ? `${months[mi]} '${y.slice(2)}` : `${parseInt(d, 10)} ${months[mi]}`;
                        }} />
                      <YAxis yAxisId="sales" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#10b981' }} width={44} />
                      <YAxis yAxisId="qty" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#4d96ff' }} width={36}
                        domain={[0, (dataMax: number) => Math.ceil(dataMax * 2.2)]} />
                      <Tooltip content={<DailyTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Line yAxisId="sales" type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3}
                        dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2, className: 'cursor-pointer' }}
                        animationDuration={1500} />
                      <Line yAxisId="qty" type="monotone" dataKey="qty" stroke="#4d96ff" strokeWidth={3}
                        dot={{ r: 3, fill: '#4d96ff', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#4d96ff', stroke: '#fff', strokeWidth: 2, className: 'cursor-pointer' }}
                        animationDuration={2000} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-lg mb-12 relative overflow-hidden chart-highlight-active group hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 tracking-tight">Daily Breakdown</h3>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{useMonthly ? 'Monthly aggregated column view' : 'Side-by-side column comparison'}</p>
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-1 rounded-full uppercase tracking-widest">Column</span>
              </div>
              <div className="h-64 overflow-x-auto overflow-y-hidden chart-scroll" style={{ touchAction: 'pan-x' }}>
                <div style={{ width: chartInnerWidth, height: '100%', touchAction: 'pan-x' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={useMonthly ? monthlyStats : dailyStatsAll} margin={{ top: 6, right: 12, left: -12, bottom: 0 }} barGap={4}>
                    <defs>
                      <linearGradient id="bar3dSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ee7b7" stopOpacity={1} />
                        <stop offset="45%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="bar3dSalesHighlight" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
                        <stop offset="30%" stopColor="#ffffff" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#000000" stopOpacity={0.15} />
                      </linearGradient>
                      <linearGradient id="bar3dQty" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#93c5fd" stopOpacity={1} />
                        <stop offset="45%" stopColor="#4d96ff" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="bar3dQtyHighlight" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
                        <stop offset="30%" stopColor="#ffffff" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#000000" stopOpacity={0.15} />
                      </linearGradient>
                      <filter id="bar3dShadow" x="-30%" y="-10%" width="160%" height="130%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                        <feOffset dx="1" dy="3" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.45" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:[&_line]:stroke-slate-800" vertical={false} />
                    <XAxis dataKey={useMonthly ? 'label' : 'day'} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#94a3b8' }} dy={8}
                      interval="preserveStartEnd" minTickGap={20}
                      tickFormatter={(v: any, idx: number) => {
                        if (useMonthly) return String(v);
                        const row = dailyStatsAll[idx];
                        if (!row || !row.date) return String(v);
                        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const [y, m, d] = row.date.split('-');
                        const mi = parseInt(m, 10) - 1;
                        return daysCount > 120 ? `${months[mi]} '${y.slice(2)}` : `${parseInt(d, 10)} ${months[mi]}`;
                      }} />
                    <YAxis yAxisId="sales" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#10b981' }} width={44} />
                    <YAxis yAxisId="qty" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: '800', fill: '#4d96ff' }} width={36}
                      domain={[0, (dataMax: number) => Math.ceil(dataMax * 2.2)]} />
                    <Tooltip content={<DailyTooltip />} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
                    <Bar yAxisId="sales" dataKey="sales" fill="url(#bar3dSales)" radius={[6, 6, 0, 0]} maxBarSize={20}
                      filter="url(#bar3dShadow)"
                      stroke="rgba(255,255,255,0.25)" strokeWidth={0.5}
                      className="cursor-pointer"
                      onClick={(data: any) => {
                        if (data && data.payload) {
                          const d = data.payload;
                          setSelectedItem({ name: `Day ${d.day}`, sales: d.sales, qty: d.qty, type: 'Daily' });
                        }
                      }} animationDuration={1500} />
                    <Bar yAxisId="sales" dataKey="sales" fill="url(#bar3dSalesHighlight)" radius={[6, 6, 0, 0]} maxBarSize={20}
                      isAnimationActive={false} style={{ pointerEvents: 'none' }} />
                    <Bar yAxisId="qty" dataKey="qty" fill="url(#bar3dQty)" radius={[6, 6, 0, 0]} maxBarSize={20}
                      filter="url(#bar3dShadow)"
                      stroke="rgba(255,255,255,0.25)" strokeWidth={0.5}
                      className="cursor-pointer"
                      onClick={(data: any) => {
                        if (data && data.payload) {
                          const d = data.payload;
                          setSelectedItem({ name: `Day ${d.day}`, sales: d.sales, qty: d.qty, type: 'Daily' });
                        }
                      }} animationDuration={2000} />
                    <Bar yAxisId="qty" dataKey="qty" fill="url(#bar3dQtyHighlight)" radius={[6, 6, 0, 0]} maxBarSize={20}
                      isAnimationActive={false} style={{ pointerEvents: 'none' }} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#4d96ff]" />
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Qty</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {dashboardSubView === 'customers' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-slate-800 chart-highlight-active group transition-all hover:border-emerald-300 dark:hover:border-emerald-500/30">
              <div className="relative z-10 flex items-center justify-between mb-6 px-2 flex-wrap gap-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200">
                  {selectedItem?.type === 'Product' ? `Customers — ${selectedItem.name}` : 'Market Share — Sales vs Qty'}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Sales</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4d96ff] shadow-[0_0_10px_rgba(77,150,255,0.3)]" />
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Qty</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCustomerSortOrder((prev: string) => prev === 'asc' ? 'desc' : 'asc'); }}
                    className="relative z-20 text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer active:scale-95"
                  >
                    Sort {customerSortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical"
                    data={(() => {
                      const top = [...effectiveCustomersDataset].sort((a: any, b: any) => {
                        const multiplier = customerSortOrder === 'asc' ? 1 : -1;
                        return (a.value - b.value) * multiplier;
                      }).slice(0, 10).reverse();
                      // Scale qty to visual parity with sales so both segments are readable
                      const maxSales = Math.max(...top.map((c: any) => c.value || 0), 1);
                      const maxQty = Math.max(...top.map((c: any) => c.qty || 0), 1);
                      const scale = maxSales / maxQty;
                      return top.map((c: any) => ({
                        ...c,
                        salesScaled: c.value,
                        qtyScaled: (c.qty || 0) * scale * 0.6, // 60% so qty doesn't dominate
                      }));
                    })()}
                    margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} width={100} />
                    <Tooltip content={<CustomerTooltip />} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
                    <Bar stackId="a" dataKey="salesScaled" fill="#10b981" barSize={14} className="cursor-pointer"
                      onClick={(d: any) => {
                        const row = d?.payload || d;
                        if (row?.name) setSelectedItem({ name: row.name, sales: row.value, qty: row.qty || 0, type: 'Customer' });
                      }} />
                    <Bar stackId="a" dataKey="qtyScaled" fill="#4d96ff" radius={[0, 6, 6, 0]} barSize={14} className="cursor-pointer"
                      onClick={(d: any) => {
                        const row = d?.payload || d;
                        if (row?.name) setSelectedItem({ name: row.name, sales: row.value, qty: row.qty || 0, type: 'Customer' });
                      }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {dashboardSubView === 'products' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden mb-12">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-slate-800">
                    <th className="text-left px-6 py-5 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                      onClick={() => {
                        if (productSortBy === 'name') setProductSortOrder((prev: string) => prev === 'asc' ? 'desc' : 'asc');
                        else { setProductSortBy('name'); setProductSortOrder('asc'); }
                      }}>
                      Product {productSortBy === 'name' ? (productSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-right px-4 py-5 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                      onClick={() => {
                        if (productSortBy === 'qty') setProductSortOrder((prev: string) => prev === 'asc' ? 'desc' : 'asc');
                        else { setProductSortBy('qty'); setProductSortOrder('desc'); }
                      }}>
                      Qty {productSortBy === 'qty' ? (productSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-right px-6 py-5 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
                      onClick={() => {
                        if (productSortBy === 'sales') setProductSortOrder((prev: string) => prev === 'asc' ? 'desc' : 'asc');
                        else { setProductSortBy('sales'); setProductSortOrder('desc'); }
                      }}>
                      Sales (RM) {productSortBy === 'sales' ? (productSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800 text-[13px]">
                  {[...effectiveProductsDataset].sort((a: any, b: any) => {
                    const multiplier = productSortOrder === 'asc' ? 1 : -1;
                    if (productSortBy === 'name') return a.name.localeCompare(b.name) * multiplier;
                    return ((a[productSortBy] as number) - (b[productSortBy] as number)) * multiplier;
                  }).map((p: any) => (
                    <tr key={p.name}
                      onClick={() => setSelectedItem({ name: p.name, sales: p.sales, qty: p.qty, type: 'Product' })}
                      className={`cursor-pointer transition-colors ${selectedItem?.name === p.name ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 group/row">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="font-bold text-gray-900 dark:text-gray-300">{p.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); drillToProduct(p.name); }}
                            className="opacity-0 group-hover/row:opacity-100 ml-1 p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-all"
                            aria-label={`Open ${p.name} details`}
                            title="Open product"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-gray-500 dark:text-gray-400 tracking-tight">{p.qty.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-gray-900 dark:text-gray-200 tracking-tight">{p.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 cursor-pointer" onClick={() => setSelectedItem(null)}>
                    <td className="px-6 py-5 text-[11px] font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest">
                      {selectedItem?.type === 'Customer' ? `${selectedItem.name} Total` : 'Total'}
                    </td>
                    <td className="px-4 py-5 text-right font-black text-gray-500 dark:text-gray-400">
                      {(selectedItem?.type === 'Customer' ? selectedItem.qty : liveDashboardData.overview.totalQty).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-gray-900 dark:text-gray-200">
                      {(selectedItem?.type === 'Customer' ? selectedItem.sales : liveDashboardData.overview.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-100 dark:border-slate-800 rounded-2xl z-20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] lg:hidden">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutGrid },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'products', label: 'Products', icon: Layers },
        ].map(nav => {
          const isActive = dashboardSubView === nav.id;
          const Icon = nav.icon;
          return (
            <button key={nav.id} onClick={() => setDashboardSubView(nav.id as DashboardSubView)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-500 ease-out ${isActive ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg min-w-[110px]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-slate-800 w-12'}`}>
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {isActive && <span className="text-[11px] font-bold tracking-tight animate-in slide-in-from-left-2 fade-in duration-300">{nav.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
