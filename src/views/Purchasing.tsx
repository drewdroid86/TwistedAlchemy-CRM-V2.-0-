import React, { useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument } from '../services/firebaseService';
import { PurchaseOrder, Brand } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Clock, 
  X,
  Trash2,
  ChevronRight,
  Loader2,
  DollarSign,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processReceiptImage } from '../services/receiptService';

export default function Purchasing() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({
    brand: 'Twisted Twig',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    total_amount: 0,
    status: 'Draft',
    items: [],
    notes: ''
  });

  useEffect(() => {
    const unsubPOs = subscribeToCollection<PurchaseOrder>('purchase_orders', (data) => {
      setPos(data.sort((a, b) => b.date.localeCompare(a.date)));
    });
    const unsubInventory = subscribeToCollection<InventoryItem>('inventory', setInventory);
    return () => {
      unsubPOs();
      unsubInventory();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDocument('purchase_orders', {
      ...newPO,
      createdAt: new Date().toISOString()
    } as PurchaseOrder);
    setIsModalOpen(false);
    setNewPO({
      brand: 'Twisted Twig',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      status: 'Draft',
      items: [],
      notes: ''
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const extractedData = await processReceiptImage(base64String);
        
        setNewPO({
          ...newPO,
          vendor: extractedData.vendor || '',
          date: extractedData.date || new Date().toISOString().split('T')[0],
          total_amount: extractedData.total_amount || 0,
          items: extractedData.items || [],
          notes: extractedData.notes || '',
          brand: extractedData.brand || 'Twisted Twig',
          status: 'Received'
        });
        setIsModalOpen(true);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing receipt:', error);
      setIsProcessing(false);
      alert('Failed to process receipt. Please enter details manually.');
    }
  };

  const filteredPOs = pos.filter(p => 
    p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif italic font-bold text-slate-900">Purchasing & Receipts</h2>
          <p className="text-slate-600 mt-1">Track shop expenses and intake receipts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all cursor-pointer shadow-sm">
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
            <span>{isProcessing ? 'Processing...' : 'Snap Receipt'}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
          </label>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Plus size={20} /> New PO
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Search by vendor or brand..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Monthly Spend</p>
            <p className="text-xl font-bold text-emerald-900">
              ${pos.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7)))
                .reduce((acc, p) => acc + p.total_amount, 0).toLocaleString()}
            </p>
          </div>
          <DollarSign className="text-emerald-400" size={24} />
        </div>
      </div>

      {/* PO List */}
      <div className="card-refined overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Brand</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredPOs.map((po) => (
                <tr key={po.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                    {new Date(po.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stone-100 rounded-lg">
                        <Store size={16} className="text-stone-600" />
                      </div>
                      <span className="font-bold text-stone-900">{po.vendor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      po.brand === 'Twisted Twig' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {po.brand}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-stone-900">
                    ${po.total_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${
                      po.status === 'Received' ? 'bg-emerald-100 text-emerald-700' : 
                      po.status === 'Ordered' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {po.status === 'Received' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPOs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New PO Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="text-xl font-serif italic font-bold text-stone-900">Purchase Order Details</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-900">
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
                      <div className="col-span-4">
                        <select
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm"
                          value={item.inventory_item_id || ''}
                          onChange={(e) => {
                            const newItems = [...(newPO.items || [])];
                            newItems[index].inventory_item_id = e.target.value;
                            setNewPO({...newPO, items: newItems});
                          }}
                        >
                          <option value="">Select Item</option>
                          {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.inventoryNumber})</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
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
    </div>
  );
}
