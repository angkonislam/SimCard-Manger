import { useEffect } from 'react';
import { Menu, Search, ChevronDown, Package } from 'lucide-react';
import { FAB } from '../components/FAB';
import { useApp } from '../AppContext';
import { NotificationCenter } from '../components/NotificationCenter';
import { ExportMenu } from '../components/ExportMenu';
import { getBrandColor, getMonthKey, formatMonthLabel } from '../utils';
import { supabase } from '../lib/supabase';

export function InventoryList() {
  const {
    setIsMenuOpen,
    isInventorySearchActive, setIsInventorySearchActive,
    inventorySearchQuery, setInventorySearchQuery,
    inventorySubView, setInventorySubView,
    inventorySort, setInventorySort,
    isSortDropdownOpen, setIsSortDropdownOpen,
    visibleInventoryItems,
    liveDashboardData,
    fromDate,
    getProductStock,
    getProductCompanyName,
    isProductHidden,
    setSelectedInventoryItem, setView,
    editingStockProduct, setEditingStockProduct,
    tempProductStock, setTempProductStock,
    setDbProducts,
    profitData,
    profitSubTab, setProfitSubTab,
    invoices,
    setTempInventoryItem, setIsInventoryItemModalOpen,
    can,
  } = useApp();

  useEffect(() => {
    if (inventorySubView === 'profit' && !can?.('view:profit')) {
      setInventorySubView('stock');
    }
  }, [inventorySubView, can, setInventorySubView]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto pb-40 relative group transition-colors">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0">
            <Menu className="w-5 h-5 text-gray-900 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 text-center flex-1">Inventory</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsInventorySearchActive(!isInventorySearchActive)}
              className={`p-2 border rounded-full transition-colors shrink-0 ${isInventorySearchActive ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30' : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              <Search className="w-4 h-4 text-gray-900 dark:text-gray-300" />
            </button>
            <ExportMenu
              filename="inventory"
              title="Inventory List"
              headers={['Name','Company','Status','Stock','Price','Cost']}
              rows={visibleInventoryItems.map((i: any) => ({
                Name: i.name,
                Company: getProductCompanyName?.(i.name) || i.category || '',
                Status: i.status,
                Stock: getProductStock?.(i.name) ?? i.stock ?? 0,
                Price: i.price ?? 0,
                Cost: i.cost ?? 0,
              }))}
            />
            <NotificationCenter />
          </div>
        </div>

        {isInventorySearchActive && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search SKU, product name, category..."
                value={inventorySearchQuery}
                onChange={(e) => setInventorySearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium"
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center mb-8 mx-1">
          <button
            onClick={() => setInventorySubView('stock')}
            className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-200 ${inventorySubView === 'stock' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'}`}
          >
            Stock
          </button>
          {can?.('view:profit') && (
            <button
              onClick={() => setInventorySubView('profit')}
              className={`flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-200 ${inventorySubView === 'profit' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'}`}
            >
              Profit
            </button>
          )}
        </div>

        {inventorySubView === 'stock' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 px-2 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black tracking-widest uppercase">Sold</div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{liveDashboardData.overview.totalQty.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Monthly Sold</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{formatMonthLabel((fromDate || getMonthKey()).substring(0, 7))}</p>
              </div>
              <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 px-2 bg-emerald-50 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black tracking-widest uppercase">Stock</div>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{visibleInventoryItems.reduce((s: number, i: any) => s + getProductStock(i.name), 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Total In Stock</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">PRODUCT CATALOG <span className="text-gray-400 dark:text-gray-500 font-bold normal-case tracking-normal">({visibleInventoryItems.filter((i: any) => i.name.toLowerCase().includes(inventorySearchQuery.toLowerCase())).length})</span></h2>
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all border bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/30 outline-none flex items-center gap-1.5"
                >
                  {inventorySort === 'Default' ? 'Stock ?' :
                    inventorySort === 'LowStock' ? 'Stock ?' :
                    inventorySort === 'sold-desc' ? 'Sold ?' :
                    inventorySort === 'sold-asc' ? 'Sold ?' :
                    inventorySort === 'last-sale-desc' ? 'Last Sale ?' :
                    inventorySort === 'last-sale-asc' ? 'Last Sale ?' :
                    inventorySort === 'A-Z' ? 'A?Z' : 'Z?A'}
                  <ChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </button>
                {isSortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortDropdownOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {[
                        { value: 'Default', label: 'Stock High?Low' },
                        { value: 'LowStock', label: 'Stock Low?High' },
                        { value: 'sold-desc', label: 'Sold/Mth High?Low' },
                        { value: 'sold-asc', label: 'Sold/Mth Low?High' },
                        { value: 'last-sale-desc', label: 'Last Sale Newest' },
                        { value: 'last-sale-asc', label: 'Last Sale Oldest' },
                        { value: 'A-Z', label: 'Name A?Z' },
                        { value: 'Z-A', label: 'Name Z?A' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setInventorySort(option.value); setIsSortDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${inventorySort === option.value ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {visibleInventoryItems.filter((item: any) =>
                item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) &&
                !isProductHidden(item.name)
              ).sort((a: any, b: any) => {
                if (inventorySort === 'A-Z') return a.name.localeCompare(b.name);
                if (inventorySort === 'Z-A') return b.name.localeCompare(a.name);
                if (inventorySort === 'LowStock') return getProductStock(a.name) - getProductStock(b.name);
                if (inventorySort === 'sold-desc') return (liveDashboardData.products.dataset.find((p: any) => p.name === b.name)?.qty ?? 0) - (liveDashboardData.products.dataset.find((p: any) => p.name === a.name)?.qty ?? 0);
                if (inventorySort === 'sold-asc') return (liveDashboardData.products.dataset.find((p: any) => p.name === a.name)?.qty ?? 0) - (liveDashboardData.products.dataset.find((p: any) => p.name === b.name)?.qty ?? 0);
                if (inventorySort === 'last-sale-desc') return (b.lastUpdated || '').localeCompare(a.lastUpdated || '');
                if (inventorySort === 'last-sale-asc') return (a.lastUpdated || '').localeCompare(b.lastUpdated || '');
                return getProductStock(b.name) - getProductStock(a.name);
              }).map((item: any) => {
                const brandColor = getBrandColor(item.name, 0);
                return (
                  <div
                    key={item.id}
                    onClick={() => { setSelectedInventoryItem(item); setView('inventory-details'); }}
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all active:scale-[0.98] hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-md dark:hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: brandColor + '20' }}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: brandColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-200 text-sm">{item.name}</h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">Last sale: {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</p>
                      </div>
                      {(() => {
                        const monthlyQty = liveDashboardData.products.dataset.find((p: any) => p.name === item.name)?.qty ?? 0;
                        const stockQty = getProductStock(item.name);
                        const isEditingStock = editingStockProduct === item.name;
                        const saveStock = async () => {
                          const v = parseInt(tempProductStock);
                          const val = isNaN(v) ? 0 : v;
                          const name = item.name;
                          await supabase.from('products').upsert({ name, stock_qty: val }, { onConflict: 'name' });
                          setDbProducts((prev: any[]) => prev.some((p: any) => p.name === name) ? prev.map((p: any) => p.name === name ? { ...p, stock_qty: val } : p) : [...prev, { id: 0, name, company_name: '', stock_qty: val, is_hidden: false }]);
                          setEditingStockProduct(null);
                        };
                        return (
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-center">
                              <p className="text-base font-black text-blue-600 dark:text-blue-400">{monthlyQty.toLocaleString()}</p>
                              <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">sold/mth</p>
                              <p className="text-[8px] text-gray-400 dark:text-gray-500 font-medium">{formatMonthLabel((fromDate || getMonthKey()).substring(0, 7))}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100 dark:bg-slate-700" />
                            <div className={`text-right ${can?.('edit:data') ? 'cursor-pointer' : ''}`} onClick={e => { e.stopPropagation(); if (!can?.('edit:data')) return; setEditingStockProduct(item.name); setTempProductStock(String(stockQty)); }}>
                              {isEditingStock ? (
                                <input
                                  type="number"
                                  value={tempProductStock}
                                  onChange={e => setTempProductStock(e.target.value)}
                                  onBlur={saveStock}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') saveStock(); }}
                                  className="w-14 text-right text-base font-black text-gray-900 dark:text-gray-300 border-b-2 border-emerald-500 bg-transparent focus:outline-none"
                                  autoFocus
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <p className={`text-base font-black ${stockQty === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{stockQty.toLocaleString()}</p>
                              )}
                              <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">stock</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {inventorySubView === 'profit' && (
          <div className="animate-in fade-in duration-300 space-y-6 pb-28">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Revenue</div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-200">RM {Math.round(profitData.totalRevenue).toLocaleString()}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{formatMonthLabel((fromDate || getMonthKey()).substring(0, 7))}</p>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Cost</div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-200">RM {Math.round(profitData.totalCost).toLocaleString()}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">estimated from suppliers</p>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Gross Profit</div>
                <p className={`text-xl font-bold ${profitData.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>RM {Math.round(profitData.totalProfit).toLocaleString()}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">revenue minus cost</p>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Margin</div>
                <p className={`text-xl font-bold ${profitData.totalMargin >= 0 ? 'text-gray-900 dark:text-gray-200' : 'text-red-500 dark:text-red-400'}`}>{profitData.totalMargin.toFixed(1)}%</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">gross margin</p>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-2xl">
              {(['customer', 'product', 'invoice'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setProfitSubTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold capitalize transition-all ${profitSubTab === tab ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  {tab === 'customer' ? 'Customer' : tab === 'product' ? 'Product' : 'Invoice'}
                </button>
              ))}
            </div>

            {profitSubTab === 'customer' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Profit by Customer</p>
                </div>
                {profitData.byCustomer.length === 0 ? (
                  <p className="text-center text-gray-300 text-sm py-10">No data</p>
                ) : profitData.byCustomer.map((c: any, i: number) => (
                  <div key={c.name} className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 w-5 shrink-0">#{i + 1}</span>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate">{c.name}</p>
                      </div>
                      <p className={`text-sm font-black shrink-0 ml-2 ${c.profit >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>RM {Math.round(c.profit).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Rev: <span className="font-bold text-gray-700 dark:text-gray-300">RM {Math.round(c.revenue).toLocaleString()}</span></span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">·</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Cost: <span className="font-bold text-gray-700 dark:text-gray-300">RM {Math.round(c.cost).toLocaleString()}</span></span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">·</span>
                      <span className={`text-[10px] font-bold ${c.margin >= 0 ? 'text-green-500 dark:text-emerald-400' : 'text-red-400'}`}>{c.margin.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1">
                      <div className={`h-1 rounded-full ${c.profit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(100, Math.max(0, c.margin))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {profitSubTab === 'product' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Profit by Product</p>
                </div>
                {profitData.byProduct.length === 0 ? (
                  <p className="text-center text-gray-300 text-sm py-10">No data</p>
                ) : profitData.byProduct.map((p: any, i: number) => (
                  <div key={p.name} className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 w-5 shrink-0">#{i + 1}</span>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: liveDashboardData.products.dataset.find((d: any) => d.name === p.name)?.color ?? '#94a3b8' }} />
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate">{p.name}</p>
                      </div>
                      <p className={`text-sm font-black shrink-0 ml-2 ${p.profit >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>RM {Math.round(p.profit).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Rev: <span className="font-bold text-gray-700 dark:text-gray-300">RM {Math.round(p.revenue).toLocaleString()}</span></span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">·</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Cost: <span className="font-bold text-gray-700 dark:text-gray-300">RM {Math.round(p.cost).toLocaleString()}</span></span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">·</span>
                      <span className={`text-[10px] font-bold ${p.margin >= 0 ? 'text-green-500 dark:text-emerald-400' : 'text-red-400'}`}>{p.margin.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1">
                      <div className={`h-1 rounded-full ${p.profit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(100, Math.max(0, p.margin))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {profitSubTab === 'invoice' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Profit by Invoice</p>
                </div>
                {invoices.length === 0 ? (
                  <p className="text-center text-gray-300 text-sm py-10">No invoices</p>
                ) : [...invoices].sort((a: any, b: any) => {
                  const pA = a.total - a.items.reduce((s: number, item: any) => s + item.quantity * profitData.getCostPrice(item.description, a.itemCosts), 0);
                  const pB = b.total - b.items.reduce((s: number, item: any) => s + item.quantity * profitData.getCostPrice(item.description, b.itemCosts), 0);
                  return pB - pA;
                }).map((inv: any) => {
                  const cost = inv.items.reduce((s: number, item: any) => s + item.quantity * profitData.getCostPrice(item.description, inv.itemCosts), 0);
                  const profit = inv.total - cost;
                  const margin = inv.total > 0 ? profit / inv.total * 100 : 0;
                  return (
                    <div key={inv.id} className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 last:border-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{inv.invoiceNumber}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-50 dark:bg-emerald-500/20 text-green-600 dark:text-emerald-400' : inv.status === 'draft' ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500' : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'}`}>
                            {inv.status}
                          </span>
                        </div>
                        <p className={`text-sm font-black shrink-0 ml-2 ${profit >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>RM {Math.round(profit).toLocaleString()}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">{inv.customer.name} · {inv.issueDate}</p>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Rev: <span className="font-bold text-gray-700 dark:text-gray-300">RM {Math.round(inv.total).toLocaleString()}</span></span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">·</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Cost: <span className="font-bold text-gray-700 dark:text-gray-300">RM {Math.round(cost).toLocaleString()}</span></span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">·</span>
                        <span className={`text-[10px] font-bold ${margin >= 0 ? 'text-green-500 dark:text-emerald-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1">
                        <div className={`h-1 rounded-full ${profit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-500' : 'bg-red-400'}`} style={{ width: `${Math.min(100, Math.max(0, margin))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {inventorySubView === 'stock' && can?.('edit:data') && (
        <FAB actions={[
          {
            label: 'Add New Stock',
            icon: <Package className="w-5 h-5" />,
            onClick: () => {
              setTempInventoryItem({ status: 'In Stock', stock: 0, price: 0, cost: 0, unit: 'pcs', category: 'Prepaid' } as any);
              setIsInventoryItemModalOpen(true);
            },
          },
        ]} />
      )}
    </div>
  );
}
