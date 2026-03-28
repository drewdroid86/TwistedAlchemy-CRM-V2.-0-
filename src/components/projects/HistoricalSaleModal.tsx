import React from 'react';
import { Project, Brand, InventoryItem, Customer } from '../../types';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoricalSaleModalProps {
  setIsHistoricalModalOpen: (isOpen: boolean) => void;
  historicalSale: Partial<Project>;
  setHistoricalSale: (project: Partial<Project>) => void;
  handleCreateHistorical: (e: React.FormEvent) => void;
  inventory: InventoryItem[];
  customers: Customer[];
}

export default function HistoricalSaleModal({
  setIsHistoricalModalOpen,
  historicalSale,
  setHistoricalSale,
  handleCreateHistorical,
  inventory,
  customers
}: HistoricalSaleModalProps) {
  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="text-xl font-serif italic font-bold text-stone-900">Log Historical Sale</h3>
          <button onClick={() => setIsHistoricalModalOpen(false)} className="text-stone-400 hover:text-stone-900">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleCreateHistorical} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-500 uppercase">Sale Date</label>
            <input
              type="date"
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
              value={historicalSale.createdAt}
              onChange={(e) => setHistoricalSale({...historicalSale, createdAt: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Brand</label>
              <select
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                value={historicalSale.brand}
                onChange={(e) => setHistoricalSale({...historicalSale, brand: e.target.value as Brand})}
              >
                <option value="Twisted Twig">Twisted Twig</option>
                <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Actual Sale Price ($)</label>
              <input
                type="number"
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                value={historicalSale.financials?.actual_sale_price}
                onChange={(e) => setHistoricalSale({
                  ...historicalSale,
                  financials: { ...historicalSale.financials!, actual_sale_price: parseFloat(e.target.value) || 0 }
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Inventory Item (Optional)</label>
              <select
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                value={historicalSale.inventory_item_id || ''}
                onChange={(e) => setHistoricalSale({...historicalSale, inventory_item_id: e.target.value})}
              >
                <option value="">None</option>
                {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Customer (Optional)</label>
              <select
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                value={historicalSale.client_id || ''}
                onChange={(e) => setHistoricalSale({...historicalSale, client_id: e.target.value})}
              >
                <option value="">None</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Item/Raw Cost ($)</label>
              <input
                type="number"
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                value={historicalSale.financials?.item_cost}
                onChange={(e) => setHistoricalSale({
                  ...historicalSale,
                  financials: { ...historicalSale.financials!, item_cost: parseFloat(e.target.value) || 0 }
                })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Supplies Cost ($)</label>
              <input
                type="number"
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                value={historicalSale.financials?.supplies_cost}
                onChange={(e) => setHistoricalSale({
                  ...historicalSale,
                  financials: { ...historicalSale.financials!, supplies_cost: parseFloat(e.target.value) || 0 }
                })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-olive-accent text-white py-3 rounded-2xl font-bold hover:opacity-90 transition-all mt-4"
          >
            Log Sale
          </button>
        </form>
      </motion.div>
    </div>
  );
}
