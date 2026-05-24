import { ChevronLeft, Trash2, Archive, Home, HardDrive, Wallet, Plus, Edit2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbProduct, DbSupplier } from '../types';
import { NotificationCenter } from '../components/NotificationCenter';

export function InventoryDetails() {
  const {
    selectedInventoryItem, setSelectedInventoryItem,
    setView,
    inventoryDeleteConfirm, setInventoryDeleteConfirm,
    editingInventorySection, setEditingInventorySection,
    setDbProducts, setDbSuppliers,
    getProductCompanyName, getProductStock, getProductSuppliers,
    addingSupplierForProduct, setAddingSupplierForProduct,
    newSupplierDraft, setNewSupplierDraft,
    editingSupplierRow, setEditingSupplierRow,
    can,
  } = useApp();

  if (!selectedInventoryItem) return null;

  const productName = selectedInventoryItem.name;
  const suppliers = getProductSuppliers(productName);
  const totalQty = suppliers.reduce((s: number, x: any) => s + x.qty, 0);
  const avgPrice = suppliers.length === 0 ? 0
    : totalQty > 0
      ? suppliers.reduce((s: number, x: any) => s + x.unit_price * x.qty, 0) / totalQty
      : suppliers.reduce((s: number, x: any) => s + x.unit_price, 0) / suppliers.length;

  const saveStockInfo = async () => {
    const name = selectedInventoryItem.name.trim();
    const company = selectedInventoryItem.category.trim();
    if (name && isSupabaseConfigured) {
      await supabase.from('products').upsert(
        { name, company_name: company, stock_qty: getProductStock(name) },
        { onConflict: 'name' }
      );
      const { data: refreshed } = await supabase.from('products').select('*').eq('is_hidden', false);
      if (refreshed) setDbProducts(refreshed as DbProduct[]);
    }
    setEditingInventorySection(null);
  };

  const saveNewSupplier = async () => {
    if (!newSupplierDraft.name.trim()) return;
    const draft = newSupplierDraft;
    const { data: newSupp } = await supabase.from('product_suppliers').insert({ product_name: productName, supplier_name: draft.name.trim(), qty: parseInt(draft.qty) || 0, unit_price: parseFloat(draft.unitPrice) || 0 }).select().single();
    if (newSupp) setDbSuppliers((prev: any[]) => [...prev, newSupp as DbSupplier]);
    setAddingSupplierForProduct(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto pb-10 transition-colors">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => { setView('inventory-list'); setInventoryDeleteConfirm(false); setEditingInventorySection(null); }}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 flex items-center justify-center border border-gray-100 dark:border-slate-800 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-gray-300" />
          </button>
          <h1 className="text-sm font-bold text-gray-900 dark:text-gray-200 tracking-wide uppercase">Product detail</h1>
          <div className="flex items-center gap-1.5">
            {can?.('delete:data') && (
              <button
                onClick={() => setInventoryDeleteConfirm(true)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-full transition-colors shrink-0 flex items-center justify-center border border-gray-100 dark:border-slate-800 shadow-sm"
              >
                <Trash2 className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
              </button>
            )}
            <NotificationCenter />
          </div>
        </div>

        {inventoryDeleteConfirm && (
          <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/30 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-3">Hide <span className="font-black">{selectedInventoryItem.name}</span> from inventory?</p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const name = selectedInventoryItem.name;
                  await supabase.from('products').upsert({ name, is_hidden: true }, { onConflict: 'name' });
                  setDbProducts((prev: any[]) => prev.filter((p: any) => p.name !== name));
                  setInventoryDeleteConfirm(false);
                  setView('inventory-list');
                }}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95"
              >
                Hide
              </button>
              <button
                onClick={() => setInventoryDeleteConfirm(false)}
                className="flex-1 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-emerald-200 dark:border-emerald-500/30">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {selectedInventoryItem.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-1">{selectedInventoryItem.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            {getProductCompanyName(selectedInventoryItem.name) || selectedInventoryItem.category} · <span className={selectedInventoryItem.status === 'In Stock' ? 'text-green-600 dark:text-emerald-400' : selectedInventoryItem.status === 'Low Stock' ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}>{selectedInventoryItem.status}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm dark:shadow-lg border border-gray-100 dark:border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">STOCK INFO</h3>
            {can?.('edit:data') && (
              <button
                onClick={async () => {
                  if (editingInventorySection === 'stock-info') {
                    await saveStockInfo();
                  } else {
                    setEditingInventorySection('stock-info');
                  }
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editingInventorySection === 'stock-info' ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
              >
                {editingInventorySection === 'stock-info' ? 'Done' : 'Edit'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-slate-800">
            <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-700">
              <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-0.5">Product name</p>
              {editingInventorySection === 'stock-info'
                ? <input type="text" value={selectedInventoryItem.name} onChange={e => setSelectedInventoryItem({ ...selectedInventoryItem, name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveStockInfo(); }} className="font-bold text-gray-900 dark:text-gray-300 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                : <p className="font-bold text-gray-900 dark:text-gray-300 text-sm">{selectedInventoryItem.name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-slate-800">
            <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-700">
              <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-0.5">Company Name</p>
              {editingInventorySection === 'stock-info'
                ? <input type="text" value={getProductCompanyName(selectedInventoryItem.name) || selectedInventoryItem.category} onChange={e => setSelectedInventoryItem({ ...selectedInventoryItem, category: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveStockInfo(); }} className="font-bold text-gray-900 dark:text-gray-300 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                : <p className="font-bold text-gray-900 dark:text-gray-300 text-sm">{getProductCompanyName(selectedInventoryItem.name) || selectedInventoryItem.category}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4 py-3">
            <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-700">
              <HardDrive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-0.5">Quantity in stock</p>
              {editingInventorySection === 'stock-info'
                ? <input type="number" value={getProductStock(selectedInventoryItem.name)} onChange={async e => { const v = parseInt(e.target.value); const val = isNaN(v) ? 0 : v; const name = selectedInventoryItem.name; await supabase.from('products').upsert({ name, stock_qty: val }, { onConflict: 'name' }); setDbProducts((prev: any[]) => prev.some((p: any) => p.name === name) ? prev.map((p: any) => p.name === name ? { ...p, stock_qty: val } : p) : [...prev, { id: 0, name, company_name: '', stock_qty: val, is_hidden: false }]); }} onKeyDown={e => { if (e.key === 'Enter') saveStockInfo(); }} className="font-bold text-gray-900 dark:text-gray-300 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                : <p className="font-bold text-gray-900 dark:text-gray-300 text-sm">{getProductStock(selectedInventoryItem.name)} pcs</p>}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm dark:shadow-lg border border-gray-100 dark:border-slate-800 mb-6">
          <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Average Supplier Unit Price</h3>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-500/30">
              <Wallet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-0.5">Weighted avg from {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-2xl">{suppliers.length === 0 ? '—' : `RM ${avgPrice.toFixed(2)}`}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-lg mb-6">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Suppliers</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">{suppliers.length} entries</span>
              {can?.('edit:data') && (
                <button
                  onClick={() => { setAddingSupplierForProduct(productName); setNewSupplierDraft({ name: '', qty: '', unitPrice: '' }); }}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center hover:scale-105 transition-transform shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>
          </div>

          {addingSupplierForProduct === productName && (
            <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 animate-in fade-in duration-200">
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">New Supplier</p>
              <div className="space-y-2">
                <input type="text" placeholder="Supplier name" value={newSupplierDraft.name} onChange={e => setNewSupplierDraft((d: any) => ({ ...d, name: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') saveNewSupplier(); }}
                  className="w-full text-sm font-bold bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Qty (pcs)" value={newSupplierDraft.qty} onChange={e => setNewSupplierDraft((d: any) => ({ ...d, qty: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') saveNewSupplier(); }}
                    className="text-sm font-bold bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                  <input type="number" placeholder="Unit price (RM)" step="0.01" value={newSupplierDraft.unitPrice} onChange={e => setNewSupplierDraft((d: any) => ({ ...d, unitPrice: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') saveNewSupplier(); }}
                    className="text-sm font-bold bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveNewSupplier}
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95"
                  >Save</button>
                  <button onClick={() => setAddingSupplierForProduct(null)}
                    className="flex-1 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95"
                  >Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {suppliers.length === 0 && (
              <p className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 py-8">No suppliers yet · tap + to add</p>
            )}
            {suppliers.map((sup: any) => (
              <div key={sup.id} className="px-5 py-4">
                {editingSupplierRow === sup.id ? (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <input type="text" value={sup.supplier_name} onChange={async e => { const changes = { supplier_name: e.target.value }; await supabase.from('product_suppliers').update(changes).eq('id', sup.id); setDbSuppliers((prev: any[]) => prev.map((s: any) => s.id === sup.id ? { ...s, ...changes } : s)); }}
                      className="w-full text-sm font-bold bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={sup.qty} onChange={async e => { const changes = { qty: parseInt(e.target.value) || 0 }; await supabase.from('product_suppliers').update(changes).eq('id', sup.id); setDbSuppliers((prev: any[]) => prev.map((s: any) => s.id === sup.id ? { ...s, ...changes } : s)); }}
                        className="text-sm font-bold bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" placeholder="Qty" />
                      <input type="number" step="0.01" value={sup.unit_price} onChange={async e => { const changes = { unit_price: parseFloat(e.target.value) || 0 }; await supabase.from('product_suppliers').update(changes).eq('id', sup.id); setDbSuppliers((prev: any[]) => prev.map((s: any) => s.id === sup.id ? { ...s, ...changes } : s)); }}
                        className="text-sm font-bold bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" placeholder="Unit price" />
                    </div>
                    <button onClick={() => setEditingSupplierRow(null)} className="w-full py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95">Done</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 dark:from-emerald-500/30 dark:to-blue-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                        {sup.supplier_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-300 text-sm">{sup.supplier_name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">{sup.qty} pcs · RM {sup.unit_price.toFixed(2)}/unit</p>
                        <p className="text-[11px] font-bold text-green-600 dark:text-emerald-400">Total cost: RM {(sup.qty * sup.unit_price).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {can?.('edit:data') && (
                        <button onClick={() => setEditingSupplierRow(sup.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      )}
                      {can?.('delete:data') && (
                        <button onClick={async () => { await supabase.from('product_suppliers').delete().eq('id', sup.id); setDbSuppliers((prev: any[]) => prev.filter((s: any) => s.id !== sup.id)); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
