import React, { useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, updateArrayField } from '../services/firebaseService';
import { Project, Brand, Customer, PricingStrategy, InventoryItem } from '../types';
import { Plus, Search, Filter, Hammer, Clock, CheckCircle2, AlertCircle, DollarSign, ChevronRight, X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Invoice from '../components/Invoice';
import ImageUpload from '../components/ImageUpload';

import ProjectDetailsModal from '../components/projects/ProjectDetailsModal';
import NewProjectModal from '../components/projects/NewProjectModal';
import HistoricalSaleModal from '../components/projects/HistoricalSaleModal';
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
    await createDocument('projects', {
      ...historicalSale,
      createdAt: new Date(historicalSale.createdAt!).toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsHistoricalModalOpen(false);
  };

  const updateStatus = async (id: string, status: Project['status']) => {
    await updateDocument('projects', id, { status });
  };

  const updateFinancials = async (id: string, financials: Project['financials']) => {
    await updateDocument('projects', id, { financials });
    if (selectedProject?.id === id) {
      setSelectedProject({ ...selectedProject, financials });
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
        <h3 className="text-xl font-semibold text-text-primary">Active Work Orders</h3>
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
          const columnProjects = projects.filter(p => p.status === status);
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
          <ProjectDetailsModal
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            showCalculator={showCalculator}
            setShowCalculator={setShowCalculator}
            updateStatus={updateStatus}
            updateFinancials={updateFinancials}
            handleGenerateInvoice={handleGenerateInvoice}
            addProjectImage={addProjectImage}
            removeProjectImage={removeProjectImage}
            PRICING_STRATEGIES={PRICING_STRATEGIES}
          />
        )}
      </AnimatePresence>

      {/* New Project Modal */}
      {isModalOpen && (
        <NewProjectModal
          setIsModalOpen={setIsModalOpen}
          newProject={newProject}
          setNewProject={setNewProject}
          handleCreate={handleCreate}
        />
      )}

      {/* Historical Sale Modal */}
      {isHistoricalModalOpen && (
        <HistoricalSaleModal
          setIsHistoricalModalOpen={setIsHistoricalModalOpen}
          historicalSale={historicalSale}
          setHistoricalSale={setHistoricalSale}
          handleCreateHistorical={handleCreateHistorical}
          inventory={inventory}
          customers={customers}
        />
      )}
    </div>
  );
}
