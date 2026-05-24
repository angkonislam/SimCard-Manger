import { X } from 'lucide-react';
import { InventoryItem, DbProduct } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { required, positiveNumber, combine } from '../lib/validation';

type EditMode = 'full' | 'basic' | 'add-supplier';

interface Props {
  tempInventoryItem: InventoryItem;
  setTempInventoryItem: (item: any) => void;
  editMode: EditMode;
  setEditMode: (m: EditMode) => void;
  selectedInventoryItem: InventoryItem | null;
  setSelectedInventoryItem: (i: InventoryItem) => void;
  inventory: InventoryItem[];
  setInventory: (i: InventoryItem[]) => void;
  setDbProducts: (p: DbProduct[]) => void;
  onClose: () => void;
}

export function InventoryItemModal({
  tempInventoryItem,
  setTempInventoryItem,
  editMode,
  setEditMode,
  selectedInventoryItem,
  setSelectedInventoryItem,
  inventory,
  setInventory,
  setDbProducts,
  onClose,
}: Props) {
  const toast = useToast();
  const handleSave = async () => {
    if (editMode === 'add-supplier') {
      const e = combine(
        required(tempInventoryItem.supplierName, 'Supplier name'),
        positiveNumber(tempInventoryItem.stock ?? 0, 'Stock'),
        positiveNumber(tempInventoryItem.price ?? 0, 'Cost'),
      );
      if (e) { toast.error(e); return; }
    } else {
      const e = combine(
        required(tempInventoryItem.name, 'Product name'),
        positiveNumber(tempInventoryItem.stock ?? 0, 'Stock'),
        positiveNumber(tempInventoryItem.price ?? 0, 'Price'),
        positiveNumber(tempInventoryItem.cost ?? 0, 'Cost'),
      );
      if (e) { toast.error(e); return; }
    }
    try {
      if (editMode === 'add-supplier') {
        const newSupplier = {
          id: `supp-${Date.now()}`,
          supplierName: tempInventoryItem.supplierName || 'Unknown',
          stock: tempInventoryItem.stock || 0,
          cost: tempInventoryItem.price || 0,
        };
        const updatedMainItem = { ...selectedInventoryItem! };
        if (!updatedMainItem.additionalSuppliers) updatedMainItem.additionalSuppliers = [];
        updatedMainItem.additionalSuppliers.push(newSupplier);

        const { error } = await supabase.from('inventory').update(updatedMainItem).eq('id', updatedMainItem.id);
        if (error) throw error;

        setSelectedInventoryItem(updatedMainItem);
        setInventory(inventory.map(i => i.id === updatedMainItem.id ? updatedMainItem : i));
      } else if (tempInventoryItem.id) {
        const { error } = await supabase.from('inventory').update(tempInventoryItem).eq('id', tempInventoryItem.id);
        if (error) throw error;

        if (selectedInventoryItem?.id === tempInventoryItem.id) {
          setSelectedInventoryItem(tempInventoryItem as InventoryItem);
        }
        setInventory(inventory.map(i => i.id === tempInventoryItem.id ? (tempInventoryItem as InventoryItem) : i));
      } else {
        const newItem = {
          ...tempInventoryItem,
          id: Math.random().toString(36).substring(2, 9),
          lastUpdated: new Date().toISOString().split('T')[0],
        };
        await supabase.from('products').upsert(
          { name: newItem.name, company_name: newItem.category || '', stock_qty: newItem.stock || null },
          { onConflict: 'name' }
        );
        const { data: refreshedProds } = await supabase.from('products').select('*').eq('is_hidden', false);
        if (refreshedProds) setDbProducts(refreshedProds as DbProduct[]);
        try {
          const { error } = await supabase.from('inventory').insert(newItem);
          if (!error) setInventory([...inventory, newItem as InventoryItem]);
        } catch (_) {}
        if (isSupabaseConfigured && newItem.name) {
          const { error: rpcErr } = await supabase.rpc('add_product_columns', { product_name: newItem.name });
          if (rpcErr) console.error('add_product_columns error:', rpcErr.message);
        }
      }
    } catch (err: any) {
      toast.error('Save failed: ' + (err?.message || 'unknown error'));
      return;
    }
    toast.success(tempInventoryItem.id ? 'Inventory updated' : 'Item added');
    onClose();
    setTempInventoryItem({} as any);
    setEditMode('full');
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Inventory item"
        className="fixed inset-x-4 top-[15%] bottom-[15%] md:left-1/2 md:right-auto md:-translate-x-1/2 md:top-[8%] md:bottom-[8%] bg-white dark:bg-slate-900 rounded-3xl z-[70] p-6 overflow-y-auto w-auto max-w-sm md:w-[30rem] md:max-w-md mx-auto md:mx-0 border border-gray-100 dark:border-slate-800 flex flex-col no-scrollbar"
        style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)' }}
      >
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-slate-900 pb-2 z-10">
          <h3 className="text-xs font-black text-gray-900 dark:text-gray-200 uppercase tracking-widest">
            {editMode === 'add-supplier' ? 'Add New Supplier' : (tempInventoryItem.id ? 'Update Stock' : 'Add New Stock')}
          </h3>
          <button
            onClick={() => { onClose(); setEditMode('full'); }}
            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4 text-gray-900 dark:text-gray-300" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          {editMode === 'add-supplier' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Supplier Name</label>
                <input
                  type="text"
                  value={tempInventoryItem.supplierName || ''}
                  onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, supplierName: e.target.value })}
                  placeholder="e.g. KS"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Stock (PCS)</label>
                <input
                  type="number"
                  value={tempInventoryItem.stock || 0}
                  onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Unit Price</label>
                <input
                  type="number"
                  value={tempInventoryItem.cost || 0}
                  onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Product Name *</label>
                <input
                  type="text"
                  value={tempInventoryItem.name || ''}
                  onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, name: e.target.value })}
                  placeholder="e.g. HotUN"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Stock (PCS)</label>
                <input
                  type="number"
                  value={tempInventoryItem.stock || 0}
                  onChange={(e) => {
                    const stock = parseInt(e.target.value) || 0;
                    let status = 'In Stock';
                    if (stock <= 0) status = 'Out of Stock';
                    else if (stock < 50) status = 'Low Stock';
                    setTempInventoryItem({ ...tempInventoryItem, stock, status: status as any });
                  }}
                  placeholder="0"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {tempInventoryItem.id && editMode === 'full' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Company Name</label>
                    <input
                      type="text"
                      value={tempInventoryItem.category || ''}
                      onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, category: e.target.value })}
                      placeholder="e.g. Prepaid"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">SKU</label>
                    <input
                      type="text"
                      value={tempInventoryItem.sku || ''}
                      onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, sku: e.target.value })}
                      placeholder="e.g. SKU-HOT80"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Unit</label>
                    <input
                      type="text"
                      value={tempInventoryItem.unit || ''}
                      onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, unit: e.target.value })}
                      placeholder="e.g. pcs"
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Buy Price</label>
                      <input
                        type="number"
                        value={tempInventoryItem.cost || ''}
                        onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, cost: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Sell Price</label>
                      <input
                        type="number"
                        value={tempInventoryItem.price || ''}
                        onChange={(e) => setTempInventoryItem({ ...tempInventoryItem, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-gray-900 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

        <button
          type="submit"
          className="w-full py-4 mt-6 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all active:scale-[0.95]"
        >
          {tempInventoryItem.id ? 'UPDATE STOCK' : (editMode === 'add-supplier' ? 'SAVE' : 'ADD NEW STOCK')}
        </button>
        </form>
      </div>
    </>
  );
}
