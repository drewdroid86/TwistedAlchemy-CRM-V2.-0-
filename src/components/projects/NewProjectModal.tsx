import React from 'react';
import { Project, Brand } from '../../types';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface NewProjectModalProps {
  setIsModalOpen: (isOpen: boolean) => void;
  newProject: Partial<Project>;
  setNewProject: (project: Partial<Project>) => void;
  handleCreate: (e: React.FormEvent) => void;
}

export default function NewProjectModal({
  setIsModalOpen,
  newProject,
  setNewProject,
  handleCreate
}: NewProjectModalProps) {
  return (
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
  );
}
