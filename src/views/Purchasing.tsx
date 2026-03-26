import React, { useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument } from '../services/firebaseService';
import { PurchaseOrder, Brand } from '../types';
import { 
  Plus, 
  Search, 
  Camera, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Loader2,
  DollarSign,
  Store
} from 'lucide-react';
import { processReceiptImage } from '../services/receiptService';
import PurchaseOrderModal from '../components/PurchaseOrderModal';

export default function Purchasing() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
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
    return subscribeToCollection<PurchaseOrder>('purchase_orders', (data) => {
      setPos(data.sort((a, b) => b.date.localeCompare(a.date)));
    });
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
          <h2 className="text-3xl font-serif italic font-bold text-stone-900">Purchasing & Receipts</h2>
          <p className="text-stone-500 mt-1">Track shop expenses and intake receipts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-stone-100 text-stone-900 px-6 py-3 rounded-2xl font-bold hover:bg-stone-200 transition-all cursor-pointer shadow-sm">
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
            <span>{isProcessing ? 'Processing...' : 'Snap Receipt'}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
          </label>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-olive-accent text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Plus size={20} /> New PO
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Search by vendor or brand..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all shadow-sm"
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
              <tr className="bg-stone-50 border-b border-stone-100">
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
                  <td className="px-6 py-4 text-sm text-stone-600 font-medium">
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
      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newPO={newPO}
        setNewPO={setNewPO}
        handleCreate={handleCreate}
      />
    </div>
  );
}
