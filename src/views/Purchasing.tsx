import React, { useState, useEffect } from 'react';
import { usePurchases } from '../hooks/usePurchases';
import { Brand, Project, Purchase } from '../types';
import { 
  Plus, 
  Search, 
  ExternalLink,
  ChevronRight,
  X,
  Trash2,
  Calendar,
  Store,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { subscribeToCollection } from '../services/firebaseService';
import { motion, AnimatePresence } from 'motion/react';

export default function Purchasing() {
  const { purchases, loading, addPurchase, removePurchase } = usePurchases();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<Brand | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newPurchase, setNewPurchase] = useState<Omit<Purchase, 'id'>>({
    vendor: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    total_cost: 0,
    date: new Date().toISOString().split('T')[0],
    owner: 'Twisted Twig',
    linked_project_id: ''
  });

  useEffect(() => {
    const unsub = subscribeToCollection<Project>('projects', setProjects);
    return () => unsub();
  }, []);

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = ownerFilter === 'All' || p.owner === ownerFilter;
    return matchesSearch && matchesOwner;
  });

  const handleAddItem = () => {
    setNewPurchase({
      ...newPurchase,
      items: [...newPurchase.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = newPurchase.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    setNewPurchase({ ...newPurchase, items: newItems, total_cost: newTotal });
  };

  const handleItemChange = (index: number, field: keyof Purchase['items'][0], value: string | number) => {
    const newItems = [...newPurchase.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const newTotal = newItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    setNewPurchase({ ...newPurchase, items: newItems, total_cost: newTotal });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPurchase(newPurchase);
    setIsModalOpen(false);
    setNewPurchase({
      vendor: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      total_cost: 0,
      date: new Date().toISOString().split('T')[0],
      owner: 'Twisted Twig',
      linked_project_id: ''
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Purchasing</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage vendor purchases and track expenses.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#2563eb] text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            <Plus size={22} /> Add Purchase
          </button>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by vendor..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              className="bg-slate-50 border border-[#e2e8f0] rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 focus:bg-white w-full md:w-64 transition-all"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as Brand | 'All')}
            >
              <option value="All">All Brands</option>
              <option value="Twisted Twig">Twisted Twig</option>
              <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0]">
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Total Cost</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic">Loading purchases...</td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic">No purchases found matching your filters.</td>
                  </tr>
                ) : filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                      {new Date(purchase.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-lg">{purchase.vendor}</div>
                      <div className="text-sm text-slate-500 font-medium">{purchase.items.length} item(s) purchased</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        purchase.owner === 'Twisted Twig'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {purchase.owner}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-bold">
                      {purchase.linked_project_id ? (
                        <div className="flex items-center gap-2 text-[#2563eb] hover:underline cursor-pointer">
                          <Briefcase size={16} />
                          Project #{purchase.linked_project_id.slice(-4)}
                          <ChevronRight size={16} />
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-lg font-black text-slate-900 text-right">
                      ${purchase.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {purchase.receipt_url && (
                          <a
                            href={purchase.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-[#2563eb] rounded-xl hover:bg-blue-50 transition-all"
                          >
                            <ExternalLink size={20} />
                          </a>
                        )}
                        <button
                          onClick={() => purchase.id && removePurchase(purchase.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Purchase Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden"
            >
              <div className="p-8 border-b border-[#e2e8f0] flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">New Purchase Record</h2>
                  <p className="text-slate-500 font-medium">Capture expense details and link to projects.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 text-slate-400 hover:text-slate-900 bg-white border border-[#e2e8f0] rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Store size={14} /> Vendor Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Home Depot, Rockler"
                      className="w-full px-5 py-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#2563eb]/5 focus:bg-white focus:border-[#2563eb]/30 transition-all font-medium"
                      value={newPurchase.vendor}
                      onChange={(e) => setNewPurchase({ ...newPurchase, vendor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} /> Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#2563eb]/5 focus:bg-white focus:border-[#2563eb]/30 transition-all font-medium"
                      value={newPurchase.date}
                      onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Plus size={14} /> Brand Owner
                    </label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#2563eb]/5 focus:bg-white focus:border-[#2563eb]/30 transition-all font-medium"
                      value={newPurchase.owner}
                      onChange={(e) => setNewPurchase({ ...newPurchase, owner: e.target.value as Brand })}
                    >
                      <option value="Twisted Twig">Twisted Twig</option>
                      <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Briefcase size={14} /> Linked Project (Optional)
                    </label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border border-[#e2e8f0] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#2563eb]/5 focus:bg-white focus:border-[#2563eb]/30 transition-all font-medium"
                      value={newPurchase.linked_project_id}
                      onChange={(e) => setNewPurchase({ ...newPurchase, linked_project_id: e.target.value })}
                    >
                      <option value="">None</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>Project #{p.id?.slice(-4)} ({p.brand})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Line Items</h3>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-bold text-[#2563eb] hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newPurchase.items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-[3] space-y-1">
                          <input
                            type="text"
                            placeholder="Description"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 focus:bg-white transition-all text-sm font-medium"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <input
                            type="number"
                            placeholder="Qty"
                            required
                            min="1"
                            className="w-full px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 focus:bg-white transition-all text-sm font-medium"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-32 space-y-1 relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input
                            type="number"
                            placeholder="Price"
                            required
                            step="0.01"
                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 focus:bg-white transition-all text-sm font-medium"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        {newPurchase.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / Summary */}
                <div className="pt-8 border-t border-[#e2e8f0] flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-[24px]">
                    <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Expense</div>
                    <div className="text-3xl font-black">${newPurchase.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <button
                    type="submit"
                    className="w-full md:w-auto px-12 py-5 bg-[#2563eb] text-white rounded-[24px] font-black text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-[#2563eb]/20 active:scale-95 shadow-blue-500/10"
                  >
                    Save Purchase
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
