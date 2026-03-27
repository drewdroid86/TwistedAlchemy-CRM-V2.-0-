import React, { useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument } from '../services/firebaseService';
import { InventoryItem, Brand } from '../types';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit2, Package, Ruler, X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUpload from '../components/ImageUpload';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<Brand | 'All'>('Twisted Twig');
  
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    owner: 'Twisted Twig',
    type: 'Furniture Piece',
    quantity: 1,
    acquisition_cost: 0,
    location: 'Shop floor'
  });

  useEffect(() => {
    return subscribeToCollection<InventoryItem>('inventory', setItems);
  }, []);

  const filteredItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = filterBrand === 'All' || item.owner === filterBrand;
      return matchesSearch && matchesBrand;
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDocument('inventory', newItem);
    setIsModalOpen(false);
    setNewItem({
      owner: 'Twisted Twig',
      type: 'Furniture Piece',
      quantity: 1,
      acquisition_cost: 0,
      location: 'Shop floor'
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteDocument('inventory', id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center card-refined p-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search inventory..."
            className="w-full pl-10 pr-4 py-2 bg-app-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            className="bg-app-bg border border-border rounded-lg px-4 py-2 text-sm focus:outline-none"
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value as Brand | 'All')}
          >
            <option value="All">All Brands</option>
            <option value="Twisted Twig">Twisted Twig</option>
            <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-refined hover:shadow-lg transition-all group overflow-hidden flex flex-col"
            >
              {item.imageUrl ? (
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="h-48 bg-stone-100 flex items-center justify-center text-stone-300">
                  <Package size={48} />
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    item.owner === 'Twisted Twig' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.owner}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-900">
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id!)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-stone-900">{item.name}</h3>
                  {item.quantity <= 2 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">LOW</span>
                  )}
                </div>
                <p className="text-sm text-stone-500 mb-4">{item.type}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold mb-1">Quantity</p>
                    <p className="text-sm font-semibold text-stone-900 flex items-center gap-1">
                      {item.type === 'Raw Material' ? <Ruler size={14} /> : <Package size={14} />}
                      {item.quantity} {item.type === 'Raw Material' ? 'BF' : 'Units'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold mb-1">Cost</p>
                    <p className="text-sm font-semibold text-stone-900">${item.acquisition_cost.toLocaleString()}</p>
                  </div>
                </div>
                {item.owner === 'Twisted Twig' && item.current_condition && (
                  <div className="mt-4">
                    <p className="text-[10px] text-stone-400 uppercase font-bold mb-1">Condition</p>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-olive-accent h-full rounded-full" 
                        style={{ width: `${item.current_condition * 10}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-serif italic font-bold text-stone-900">Add Inventory Item</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-900">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Owner</label>
                  <select 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                    value={newItem.owner}
                    onChange={(e) => setNewItem({...newItem, owner: e.target.value as Brand})}
                  >
                    <option value="Twisted Twig">Twisted Twig</option>
                    <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Type</label>
                  <select 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value as any})}
                  >
                    <option value="Furniture Piece">Furniture Piece</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Supply">Supply</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Item Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                  placeholder="e.g., Victorian Oak Dresser"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                    value={newItem.quantity || 0}
                    onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                    value={newItem.acquisition_cost || 0}
                    onChange={(e) => setNewItem({...newItem, acquisition_cost: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Location</label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                  placeholder="e.g., Shop floor, Bay 2"
                  value={newItem.location || ''}
                  onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                />
              </div>

              {newItem.owner === 'Twisted Twig' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Condition (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="w-full accent-stone-900"
                    value={newItem.current_condition || 5}
                    onChange={(e) => setNewItem({...newItem, current_condition: parseInt(e.target.value)})}
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-bold">
                    <span>POOR</span>
                    <span>PRISTINE</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Item Photo</label>
                {newItem.imageUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden group">
                    <img src={newItem.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button"
                      onClick={() => setNewItem({...newItem, imageUrl: undefined})}
                      className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <ImageUpload onUpload={(url) => setNewItem({...newItem, imageUrl: url})} />
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-olive-accent text-white py-3 rounded-2xl font-bold hover:opacity-90 transition-all mt-4"
              >
                Save Item
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
