import React, { useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, deleteDocument } from '../services/firebaseService';
import { Project, InventoryItem, ShopNote, Brand } from '../types';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Hammer, 
  Package,
  ChevronRight,
  MessageSquare,
  Send,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [notes, setNotes] = useState<ShopNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [filterBrand, setFilterBrand] = useState<Brand | 'All'>('Twisted Twig');

  useEffect(() => {
    const unsubProjects = subscribeToCollection<Project>('projects', setProjects);
    const unsubInventory = subscribeToCollection<InventoryItem>('inventory', setInventory);
    const unsubNotes = subscribeToCollection<ShopNote>('shop_notes', (data) => {
      // Sort notes by newest first
      setNotes(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
    return () => {
      unsubProjects();
      unsubInventory();
      unsubNotes();
    };
  }, []);

  const activeProjects = projects.filter(p => p.status !== 'Complete' && (filterBrand === 'All' || p.brand === filterBrand));
  const completedProjects = projects.filter(p => p.status === 'Complete' && (filterBrand === 'All' || p.brand === filterBrand));
  
  const totalWIPValue = activeProjects.reduce((acc, p) => acc + (p.financials.target_sale_price || 0), 0);
  const totalRevenue = completedProjects.reduce((acc, p) => acc + (p.financials.actual_sale_price || 0), 0);
  
  const lowStock = inventory.filter(i => i.quantity <= 2 && (filterBrand === 'All' || i.owner === filterBrand));

  const stats = [
    { label: 'Active Projects', value: activeProjects.length, icon: Hammer, color: 'bg-app-bg text-text-secondary' },
    { label: 'WIP Value', value: `$${totalWIPValue.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-50 text-accent' },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-app-bg text-text-secondary' },
    { label: 'Low Stock Items', value: lowStock.length, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  ];

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    await createDocument('shop_notes', {
      text: newNote.trim(),
      author: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Unknown',
      createdAt: new Date().toISOString()
    });
    setNewNote('');
  };

  const handleDeleteNote = async (id: string) => {
    await deleteDocument('shop_notes', id);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif italic font-bold text-stone-900">Shop Floor Overview</h2>
          <p className="text-stone-500 mt-1">Here's what's happening across {filterBrand === 'All' ? 'both brands' : filterBrand} today.</p>
        </div>
        <select
          className="bg-white border border-stone-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all text-sm font-semibold text-stone-600 shadow-sm"
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value as Brand | 'All')}
        >
          <option value="All">All Brands</option>
          <option value="Twisted Twig">Twisted Twig</option>
          <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-refined p-6 hover:shadow-lg transition-shadow"
            >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-stone-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shop Notes (Communication Hub) */}
        <div className="lg:col-span-1 card-refined flex flex-col h-[500px] overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center gap-2 bg-stone-50">
            <MessageSquare size={20} className="text-stone-400" />
            <h3 className="text-lg font-serif italic font-bold text-stone-900">Shop Notes</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {notes.map(note => (
                <motion.div 
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-stone-50 p-4 rounded-2xl border border-stone-100 group relative"
                >
                  <p className="text-sm text-stone-800 mb-2">{note.text}</p>
                  <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    <span>{note.author}</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteNote(note.id!)}
                    className="absolute -top-2 -right-2 bg-white border border-stone-200 text-stone-400 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))}
              {notes.length === 0 && (
                <div className="text-center text-stone-400 py-8 text-sm italic">
                  No notes yet. Leave a message for the shop floor!
                </div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handlePostNote} className="p-4 border-t border-stone-100 bg-stone-50">
            <div className="relative">
              <input
                type="text"
                placeholder="Jot down a quick note..."
                className="w-full pl-4 pr-12 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all text-sm"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!newNote.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-olive-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>

        {/* Recent Projects & Low Stock */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Projects */}
          <div className="card-refined overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-serif italic font-bold text-stone-900">Active Work Orders</h3>
              <button onClick={() => {}} className="text-stone-500 hover:text-stone-900 text-sm font-medium flex items-center gap-1">
                View Board <ChevronRight size={16} />
              </button>
            </div>
            <div className="divide-y divide-stone-100">
              {activeProjects.slice(0, 4).map(project => (
                <div key={project.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${
                      project.brand === 'Twisted Twig' ? 'bg-orange-400' : 'bg-blue-400'
                    }`} />
                    <div>
                      <p className="font-semibold text-stone-900">Project #{project.id?.slice(-4)}</p>
                      <p className="text-xs text-stone-500 mt-1">
                        <span className="font-medium text-stone-700">{project.status}</span> • Assigned to {project.assigned_to}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-900">${project.financials.target_sale_price.toLocaleString()}</p>
                    <p className="text-[10px] text-stone-400 uppercase font-bold">Target</p>
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <div className="p-12 text-center text-stone-400">
                  No active projects found.
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Inventory */}
          {lowStock.length > 0 && (
            <div className="card-refined overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-red-50/50">
                <h3 className="text-lg font-serif italic font-bold text-red-900">Inventory Alerts</h3>
                <Package size={20} className="text-red-400" />
              </div>
              <div className="divide-y divide-stone-100">
                {lowStock.slice(0, 3).map(item => (
                  <div key={item.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">{item.name}</p>
                      <p className="text-xs text-stone-500 mt-1">{item.owner} • {item.location}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${item.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.quantity} {item.type === 'Raw Material' ? 'BF' : 'Units'}
                      </p>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">Remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
