import React, { useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, updateArrayField } from '../services/firebaseService';
import { Project, Brand, Customer, PricingStrategy, InventoryItem } from '../types';
import { Plus, Search, Filter, Hammer, Clock, CheckCircle2, AlertCircle, DollarSign, ChevronRight, X, Calculator, Camera, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Invoice from '../components/Invoice';
import ImageUpload from '../components/ImageUpload';
import { createRoot } from 'react-dom/client';

const PRICING_STRATEGIES: { id: PricingStrategy; desc: string }[] = [
  { id: 'Cost Plus', desc: 'Base cost + Supplies + Labor + Profit Margin (Simplest for early products)' },
  { id: 'Competitive', desc: 'Set prices to compete with local competition (Careful: race to the bottom)' },
  { id: 'Market Share', desc: 'Lower price to increase overall number of customers (Volume based)' },
  { id: 'Value Added', desc: 'Customer accepts a higher price based on perception of value/brand' },
  { id: 'Project Based', desc: 'Specific builds that have specific, unique costs' },
  { id: 'Bundle', desc: 'Pricing a group of items together' },
  { id: 'None', desc: 'No specific strategy selected' }
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterBrand, setFilterBrand] = useState<Brand | 'All'>('Twisted Twig');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };
  
  const [newProject, setNewProject] = useState<Partial<Project>>({
    brand: 'Twisted Twig',
    status: 'Intake',
    assigned_to: 'Andrew',
    financials: {
      item_cost: 0,
      supplies_cost: 0,
      labor_hours: 0,
      hourly_rate: 45,
      pricing_strategy: 'None',
      target_sale_price: 0
    },
    work_log: []
  });

  const [historicalSale, setHistoricalSale] = useState<Partial<Project>>({
    brand: 'Twisted Twig',
    status: 'Complete',
    assigned_to: 'N/A',
    financials: {
      item_cost: 0,
      supplies_cost: 0,
      target_sale_price: 0,
      actual_sale_price: 0
    },
    work_log: [],
    createdAt: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubProjects = subscribeToCollection<Project>('projects', setProjects);
    const unsubCustomers = subscribeToCollection<Customer>('customers', setCustomers);
    const unsubInventory = subscribeToCollection<InventoryItem>('inventory', setInventory);
    return () => {
      unsubProjects();
      unsubCustomers();
      unsubInventory();
    };
  }, []);

  const handleGenerateInvoice = (project: Project) => {
    const customer = customers.find(c => c.id === project.client_id);
    const inventoryItem = inventory.find(i => i.id === project.inventory_item_id);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Invoice</title></head><body><div id="root"></div></body></html>');
      const root = createRoot(printWindow.document.getElementById('root')!);
      root.render(<Invoice project={project} customer={customer} inventoryItem={inventoryItem} />);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDocument('projects', {
      ...newProject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsModalOpen(false);
  };

  const handleCreateHistorical = async (e: React.FormEvent) => {
    e.preventDefault();
    const docId = await createDocument('projects', {
      ...historicalSale,
      createdAt: new Date(historicalSale.createdAt!).toISOString(),
      updatedAt: new Date().toISOString()
    });
    if (historicalSale.client_id) {
      await updateArrayField('customers', historicalSale.client_id, 'purchase_history', docId, 'add');
    }
    setIsHistoricalModalOpen(false);
  };

  const [inlineError, setInlineError] = useState<{id: string, message: string} | null>(null);

  const updateStatus = async (id: string, status: Project['status']) => {
    const project = projects.find(p => p.id === id);
    if (status === 'Complete') {
      if (!project?.financials?.actual_sale_price || project.financials.actual_sale_price <= 0) {
        setInlineError({ id, message: 'Sale price is required to mark complete' });
        setTimeout(() => setInlineError(null), 3000);
        return;
      }
      await updateDocument('projects', id, {
        status,
        date_completed: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDocument('projects', id, {
        status,
        updatedAt: new Date().toISOString()
      });
    }
    setInlineError(null);
  };

  const updateFinancials = async (id: string, financials: Project['financials']) => {
    await updateDocument('projects', id, { financials });
    if (selectedProject?.id === id) {
      setSelectedProject({ ...selectedProject, financials });
    }
  };

  const updateClient = async (id: string, client_id: string) => {
    const project = projects.find(p => p.id === id);
    if (project?.client_id && project.client_id !== client_id) {
      await updateArrayField('customers', project.client_id, 'purchase_history', id, 'remove');
    }
    await updateDocument('projects', id, { client_id });
    if (client_id) {
      await updateArrayField('customers', client_id, 'purchase_history', id, 'add');
    }
    if (selectedProject?.id === id) {
      setSelectedProject({ ...selectedProject, client_id });
    }
  };

  const addProjectImage = async (id: string, url: string) => {
    try {
      await updateArrayField('projects', id, 'images', url, 'add');
      if (selectedProject?.id === id) {
        setSelectedProject({ ...selectedProject, images: [...(selectedProject.images || []), url] });
      }
    } catch (e) {
      showToast('Failed to add image.');
    }
  };

  const removeProjectImage = async (id: string, url: string) => {
    try {
      await updateArrayField('projects', id, 'images', url, 'remove');
      if (selectedProject?.id === id) {
        setSelectedProject({ ...selectedProject, images: selectedProject.images?.filter(img => img !== url) || [] });
      }
    } catch (e) {
      showToast('Failed to remove image.');
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Intake': return 'bg-stone-100 text-stone-600';
      case 'Assessment': return 'bg-blue-100 text-blue-600';
      case 'Structural Repair': return 'bg-amber-100 text-amber-600';
      case 'Finishing': return 'bg-purple-100 text-purple-600';
      case 'Complete': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg z-[60] ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold text-text-primary">Active Work Orders</h3>
          <select
            className="bg-app-bg border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-sm font-medium text-text-secondary"
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value as Brand | 'All')}
          >
            <option value="All">All Brands</option>
            <option value="Twisted Twig">Twisted Twig</option>
            <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsHistoricalModalOpen(true)}
            className="flex items-center gap-2 bg-app-bg text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-border transition-all"
          >
            Log Historical Sale
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus size={18} /> New Project
          </button>
        </div>
      </div>

      {/* Project Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
        {['Intake', 'Assessment', 'Structural Repair', 'Finishing', 'Complete'].map((status) => {
          const columnProjects = projects.filter(p => p.status === status && (filterBrand === 'All' || p.brand === filterBrand));
          return (
            <div key={status} className="flex-none w-80 snap-start flex flex-col h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-text-primary">{status}</h4>
                <span className="bg-border text-text-secondary text-xs font-medium px-2 py-1 rounded-full">
                  {columnProjects.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence>
                  {columnProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        setSelectedProject(project);
                        setShowCalculator(false);
                      }}
                      className="card-refined p-4 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-2 h-8 rounded-full ${
                          project.brand === 'Twisted Twig' ? 'bg-orange-400' : 'bg-blue-400'
                        }`} />
                        <div className="text-right">
                          <p className="text-sm font-bold text-stone-900">${(project.financials.actual_sale_price || project.financials.target_sale_price).toLocaleString()}</p>
                          <p className="text-[10px] text-stone-400 uppercase font-bold">
                            {project.financials.actual_sale_price ? 'Actual' : 'Target'}
                          </p>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-stone-900 mb-1">Project #{project.id?.slice(-4)}</h3>
                      {project.images && project.images.length > 0 && (
                        <div className="mb-3 h-24 rounded-xl overflow-hidden">
                          <img src={project.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <p className="text-xs text-stone-500 mb-4 flex items-center gap-1">
                        <Clock size={12} /> {new Date(project.createdAt).toLocaleDateString()}
                      </p>

                      {inlineError?.id === project.id && (
                        <div className="mb-2 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                          {inlineError.message}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-600">
                            {project.assigned_to.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-stone-600">{project.assigned_to}</span>
                        </div>
                        
                        {/* Quick Advance Button */}
                        {status !== 'Complete' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const statuses = ['Intake', 'Assessment', 'Structural Repair', 'Finishing', 'Complete'];
                              const nextStatus = statuses[statuses.indexOf(status) + 1] as Project['status'];
                              updateStatus(project.id!, nextStatus);
                            }}
                            className="text-stone-400 hover:text-stone-900 p-1 rounded-lg hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100"
                            title="Move to next stage"
                          >
                            <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {columnProjects.length === 0 && (
                  <div className="border-2 border-dashed border-stone-200 rounded-2xl h-32 flex items-center justify-center text-stone-400 text-sm font-medium">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <div>
                  <h3 className="text-xl font-serif italic font-bold text-stone-900">Project Details</h3>
                  <p className="text-xs text-stone-500">ID: {selectedProject.id}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleGenerateInvoice(selectedProject)}
                    className="text-xs font-bold bg-white border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50"
                  >
                    Generate Invoice
                  </button>
                  <button onClick={() => setSelectedProject(null)} className="text-stone-400 hover:text-stone-900">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8">
                {inlineError?.id === selectedProject.id && (
                  <div className="mb-4 text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    {inlineError.message}
                  </div>
                )}
                {/* Status Stepper */}
                <div className="flex justify-between relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 -z-10" />
                  {['Intake', 'Assessment', 'Structural Repair', 'Finishing', 'Complete'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedProject.id!, s as any)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        selectedProject.status === s 
                          ? 'bg-olive-accent text-white scale-125 shadow-lg' 
                          : 'bg-white border-2 border-stone-200 text-stone-300'
                      }`}
                    >
                      {selectedProject.status === s ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 bg-current rounded-full" />}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Financials & Pricing */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Financials</h5>
                      <button 
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="text-xs font-bold text-stone-900 flex items-center gap-1 hover:underline"
                      >
                        <Calculator size={12} /> {showCalculator ? 'Hide Calculator' : 'Pricing Calculator'}
                      </button>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-500">Item / Base Cost</span>
                        <span className="text-sm font-bold text-stone-900">${selectedProject.financials.item_cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-500">Supplies Cost</span>
                        <span className="text-sm font-bold text-stone-900">${selectedProject.financials.supplies_cost}</span>
                      </div>
                      <div className="pt-2 border-t border-stone-200 flex justify-between">
                        <span className="text-sm font-bold text-stone-900">Total Hard Costs</span>
                        <span className="text-sm font-bold text-stone-900">
                          ${selectedProject.financials.item_cost + selectedProject.financials.supplies_cost}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-stone-200 flex justify-between">
                        <span className="text-sm font-bold text-stone-900">Target Sale Price</span>
                        <span className="text-sm font-bold text-emerald-600">
                          ${selectedProject.financials.target_sale_price}
                        </span>
                      </div>
                    </div>

                    {showCalculator && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-white border border-stone-200 p-4 rounded-2xl space-y-4 shadow-sm"
                      >
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500 uppercase">Pricing Strategy</label>
                          <select 
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            value={selectedProject.financials.pricing_strategy || 'None'}
                            onChange={(e) => updateFinancials(selectedProject.id!, {
                              ...selectedProject.financials,
                              pricing_strategy: e.target.value as PricingStrategy
                            })}
                          >
                            {PRICING_STRATEGIES.map(s => (
                              <option key={s.id} value={s.id}>{s.id}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-stone-400 mt-1">
                            {PRICING_STRATEGIES.find(s => s.id === (selectedProject.financials.pricing_strategy || 'None'))?.desc}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Labor Hours (Opt)</label>
                            <input
                              type="number"
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                              value={selectedProject.financials.labor_hours || 0}
                              onChange={(e) => updateFinancials(selectedProject.id!, {
                                ...selectedProject.financials,
                                labor_hours: parseFloat(e.target.value) || 0
                              })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Hourly Rate ($)</label>
                            <input
                              type="number"
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                              value={selectedProject.financials.hourly_rate || 45}
                              onChange={(e) => updateFinancials(selectedProject.id!, {
                                ...selectedProject.financials,
                                hourly_rate: parseFloat(e.target.value) || 0
                              })}
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-stone-900">Calculated Cost</span>
                            <span className="text-sm font-bold text-stone-900">
                              ${selectedProject.financials.item_cost + selectedProject.financials.supplies_cost + ((selectedProject.financials.labor_hours || 0) * (selectedProject.financials.hourly_rate || 0))}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Set Target Sale Price ($)</label>
                            <input
                              type="number"
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                              value={selectedProject.financials.target_sale_price}
                              onChange={(e) => updateFinancials(selectedProject.id!, {
                                ...selectedProject.financials,
                                target_sale_price: parseFloat(e.target.value) || 0
                              })}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Work Log */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Work Log</h5>
                    <div className="space-y-3">
                      {selectedProject.work_log.map((log, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-1 bg-stone-200 rounded-full" />
                          <div>
                            <p className="text-xs font-bold text-stone-900">{log.action}</p>
                            <p className="text-[10px] text-stone-400">{new Date(log.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                      {selectedProject.work_log.length === 0 && (
                        <p className="text-sm text-stone-400 italic">No work logged yet.</p>
                      )}
                      <button className="text-xs font-bold text-stone-900 flex items-center gap-1 hover:underline">
                        <Plus size={12} /> Add Entry
                      </button>
                    </div>

                    {/* Project Gallery */}
                    <div className="pt-6 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Project Gallery</h5>
                        <ImageUpload 
                          onUpload={(url) => addProjectImage(selectedProject.id!, url)} 
                          label="Add Photo"
                          className="!space-y-0"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedProject.images?.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button 
                              onClick={() => removeProjectImage(selectedProject.id!, img)}
                              className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                        {(!selectedProject.images || selectedProject.images.length === 0) && (
                          <div className="col-span-3 py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400">
                            <ImageIcon size={24} className="mb-2 opacity-20" />
                            <p className="text-xs">No photos yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-serif italic font-bold text-stone-900">New Work Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-900">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Brand</label>
                  <select 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                    value={newProject.brand}
                    onChange={(e) => setNewProject({...newProject, brand: e.target.value as Brand})}
                  >
                    <option value="Twisted Twig">Twisted Twig</option>
                    <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Assigned To</label>
                  <select 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                    value={newProject.assigned_to}
                    onChange={(e) => setNewProject({...newProject, assigned_to: e.target.value})}
                  >
                    <option value="Andrew">Andrew</option>
                    <option value="Jordan">Jordan</option>
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
                    value={newProject.financials?.item_cost}
                    onChange={(e) => setNewProject({
                      ...newProject, 
                      financials: { ...newProject.financials!, item_cost: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-500 uppercase">Supplies Cost ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                    value={newProject.financials?.supplies_cost}
                    onChange={(e) => setNewProject({
                      ...newProject, 
                      financials: { ...newProject.financials!, supplies_cost: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Target Sale Price ($)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none"
                  value={newProject.financials?.target_sale_price}
                  onChange={(e) => setNewProject({
                    ...newProject, 
                    financials: { ...newProject.financials!, target_sale_price: parseFloat(e.target.value) || 0 }
                  })}
                />
                <p className="text-[10px] text-stone-400">You can use the Pricing Calculator later to refine this.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-olive-accent text-white py-3 rounded-2xl font-bold hover:opacity-90 transition-all mt-4"
              >
                Create Project
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Historical Sale Modal */}
      {isHistoricalModalOpen && (
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
      )}
    </div>
  );
}
