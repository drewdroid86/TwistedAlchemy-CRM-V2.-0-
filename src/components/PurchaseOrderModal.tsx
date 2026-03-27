import React from 'react';
import { PurchaseOrder, Brand } from '../types';
import { X, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPO: Partial<PurchaseOrder>;
  setNewPO: (po: Partial<PurchaseOrder>) => void;
  handleCreate: (e: React.FormEvent) => Promise<void>;
}

export default function PurchaseOrderModal({
  isOpen,
  onClose,
  newPO,
  setNewPO,
  handleCreate
}: PurchaseOrderModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="text-xl font-serif italic font-bold text-stone-900">Purchase Order Details</h3>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Brand</label>
                  <select
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none"
                    value={newPO.brand}
                    onChange={(e) => setNewPO({...newPO, brand: e.target.value as Brand})}
                  >
                    <option value="Twisted Twig">Twisted Twig</option>
                    <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Status</label>
                  <select
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none"
                    value={newPO.status}
                    onChange={(e) => setNewPO({...newPO, status: e.target.value as any})}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Home Depot, Rockler"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none"
                    value={newPO.vendor}
                    onChange={(e) => setNewPO({...newPO, vendor: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none"
                    value={newPO.date}
                    onChange={(e) => setNewPO({...newPO, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Line Items</h4>
                {newPO.items?.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Description"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...(newPO.items || [])];
                          newItems[index].description = e.target.value;
                          setNewPO({...newPO, items: newItems});
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...(newPO.items || [])];
                          newItems[index].quantity = parseFloat(e.target.value);
                          setNewPO({...newPO, items: newItems, total_amount: newItems.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)});
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Price"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm"
                        value={item.unit_price}
                        onChange={(e) => {
                          const newItems = [...(newPO.items || [])];
                          newItems[index].unit_price = parseFloat(e.target.value);
                          setNewPO({...newPO, items: newItems, total_amount: newItems.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)});
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = newPO.items?.filter((_, i) => i !== index);
                        setNewPO({...newPO, items: newItems, total_amount: newItems?.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)});
                      }}
                      className="col-span-1 text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNewPO({...newPO, items: [...(newPO.items || []), { description: '', quantity: 1, unit_price: 0 }]})}
                  className="text-xs font-bold text-stone-900 flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                <div className="text-right">
                  <p className="text-[10px] text-stone-400 uppercase font-bold">Total Amount</p>
                  <p className="text-2xl font-bold text-stone-900">${newPO.total_amount?.toLocaleString()}</p>
                </div>
                <button
                  type="submit"
                  className="bg-olive-accent text-white px-10 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
                >
                  Save Purchase Order
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
