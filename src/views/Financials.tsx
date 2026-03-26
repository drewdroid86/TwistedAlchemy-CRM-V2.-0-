import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../services/firebaseService';
import { Project, InventoryItem, Customer, PurchaseOrder } from '../types';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Package, 
  Users, 
  Hammer,
  ChevronDown,
  Printer,
  DollarSign,
  Scale
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Financials() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [activeReport, setActiveReport] = useState<'loanOfficer' | 'pnl' | 'balanceSheet'>('loanOfficer');

  useEffect(() => {
    const unsubProjects = subscribeToCollection<Project>('projects', setProjects);
    const unsubInventory = subscribeToCollection<InventoryItem>('inventory', setInventory);
    const unsubCustomers = subscribeToCollection<Customer>('customers', setCustomers);
    const unsubPOs = subscribeToCollection<PurchaseOrder>('purchase_orders', setPurchaseOrders);
    return () => {
      unsubProjects();
      unsubInventory();
      unsubCustomers();
      unsubPOs();
    };
  }, []);

  // --- Data Processing for Financials ---

  const completedProjects = projects.filter(p => p.status === 'Complete');
  
  // Revenue
  const revenueWGA = completedProjects.filter(p => p.brand === 'WGA').reduce((acc, p) => acc + (p.financials.actual_sale_price || 0), 0);
  const revenueTT = completedProjects.filter(p => p.brand === 'Twisted Twig').reduce((acc, p) => acc + (p.financials.actual_sale_price || 0), 0);
  const totalRevenue = revenueWGA + revenueTT;

  // COGS (Cost of Goods Sold)
  const cogsWGA = completedProjects.filter(p => p.brand === 'WGA').reduce((acc, p) => acc + (p.financials.item_cost || 0) + (p.financials.supplies_cost || 0), 0);
  const cogsTT = completedProjects.filter(p => p.brand === 'Twisted Twig').reduce((acc, p) => acc + (p.financials.item_cost || 0) + (p.financials.supplies_cost || 0), 0);
  const totalCOGS = cogsWGA + cogsTT;

  const grossProfit = totalRevenue - totalCOGS;

  // Operating Expenses (Purchase Orders)
  const expensesWGA = purchaseOrders.filter(po => po.brand === 'WGA').reduce((acc, po) => acc + po.total_amount, 0);
  const expensesTT = purchaseOrders.filter(po => po.brand === 'Twisted Twig').reduce((acc, po) => acc + po.total_amount, 0);
  const totalExpenses = expensesWGA + expensesTT;

  const netIncome = grossProfit - totalExpenses;

  // Balance Sheet
  const inventoryValue = inventory.reduce((acc, item) => acc + (item.acquisition_cost * item.quantity), 0);
  const totalAssets = inventoryValue;
  const totalLiabilities = 0;
  const totalEquity = totalAssets - totalLiabilities;

  const handlePrint = () => {
    window.print();
  };

  const downloadCSV = () => {
    // Simple CSV export of P&L
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Category,Amount\n"
      + `Total Revenue,${totalRevenue}\n`
      + `Cost of Goods Sold,${totalCOGS}\n`
      + `Gross Profit,${grossProfit}\n`
      + `Operating Expenses,${totalExpenses}\n`
      + `Net Income,${netIncome}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "financial_summary.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-serif italic font-bold text-slate-900">Financials</h2>
          <p className="text-slate-600 mt-1">Enterprise-grade financial reporting and summaries.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={20} /> Export CSV
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Printer size={20} /> Print Report
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="flex gap-4 border-b border-slate-200 print:hidden">
        {[
          { id: 'loanOfficer', label: 'Loan Officer Summary', icon: FileText },
          { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp },
          { id: 'balanceSheet', label: 'Balance Sheet', icon: Scale },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all relative ${
              activeReport === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeReport === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* LOAN OFFICER SUMMARY */}
        {activeReport === 'loanOfficer' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-refined p-6">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
              <div className="card-refined p-6">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Gross Profit</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">${grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
              <div className="card-refined p-6">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Net Income</p>
                <p className={`text-3xl font-bold mt-2 ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${netIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
              <div className="card-refined p-6">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Assets</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">${totalAssets.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
            </div>
            
            <div className="card-refined p-8">
              <h3 className="text-lg font-serif italic font-bold text-slate-900 mb-6">Executive Summary</h3>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  Twisted Alchemy operates two distinct brands: <strong>Wood Grain Alchemist (WGA)</strong> and <strong>Twisted Twig</strong>. 
                  To date, the combined operations have generated <strong>${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> in total revenue. 
                  After accounting for direct project costs (Cost of Goods Sold) of <strong>${totalCOGS.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>, 
                  the business maintains a gross profit of <strong>${grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>.
                </p>
                <p className="text-slate-600 leading-relaxed mt-4">
                  Operating expenses, tracked via purchase orders for tools, supplies, and general inventory, total <strong>${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>. 
                  This results in a net income of <strong>${netIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>. 
                  The business currently holds <strong>${totalAssets.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> in physical inventory assets, 
                  ensuring readiness for upcoming projects and custom builds.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROFIT & LOSS */}
        {activeReport === 'pnl' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="card-refined p-8 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-serif italic font-bold text-slate-900">Profit and Loss Statement</h3>
                <p className="text-slate-500">Twisted Alchemy (WGA & Twisted Twig)</p>
              </div>

              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Income</h4>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Revenue - Wood Grain Alchemist</span>
                    <span>${revenueWGA.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Revenue - Twisted Twig</span>
                    <span>${revenueTT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-slate-900 border-t border-slate-100 mt-2">
                    <span>Total Income</span>
                    <span>${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* COGS Section */}
                <div>
                  <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Cost of Goods Sold (COGS)</h4>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Project Costs - Wood Grain Alchemist</span>
                    <span>${cogsWGA.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Project Costs - Twisted Twig</span>
                    <span>${cogsTT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-slate-900 border-t border-slate-100 mt-2">
                    <span>Total COGS</span>
                    <span>${totalCOGS.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Gross Profit */}
                <div className="flex justify-between py-4 font-bold text-lg text-slate-900 border-y-2 border-slate-200 bg-slate-50 px-4 rounded-lg">
                  <span>Gross Profit</span>
                  <span>${grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>

                {/* Expenses Section */}
                <div>
                  <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Operating Expenses</h4>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Purchases & Supplies - Wood Grain Alchemist</span>
                    <span>${expensesWGA.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Purchases & Supplies - Twisted Twig</span>
                    <span>${expensesTT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-slate-900 border-t border-slate-100 mt-2">
                    <span>Total Expenses</span>
                    <span>${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className="flex justify-between py-4 font-bold text-xl border-y-2 border-slate-900 bg-slate-100 px-4 rounded-lg">
                  <span className="text-slate-900">Net Income</span>
                  <span className={netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    ${netIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* BALANCE SHEET */}
        {activeReport === 'balanceSheet' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="card-refined p-8 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-serif italic font-bold text-slate-900">Balance Sheet</h3>
                <p className="text-slate-500">As of {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-8">
                {/* Assets */}
                <div>
                  <h4 className="font-bold text-xl text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Assets</h4>
                  
                  <h5 className="font-bold text-slate-700 mb-2">Current Assets</h5>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Inventory Asset</span>
                    <span>${inventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 font-bold text-slate-900 border-t border-slate-100 mt-2">
                    <span>Total Assets</span>
                    <span>${totalAssets.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Liabilities */}
                <div>
                  <h4 className="font-bold text-xl text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Liabilities</h4>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>No Current Liabilities Tracked</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-slate-900 border-t border-slate-100 mt-2">
                    <span>Total Liabilities</span>
                    <span>${totalLiabilities.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <h4 className="font-bold text-xl text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">Equity</h4>
                  <div className="flex justify-between py-2 text-slate-600 pl-4">
                    <span>Owner's Equity / Retained Earnings</span>
                    <span>${totalEquity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-3 font-bold text-slate-900 border-t border-slate-100 mt-2">
                    <span>Total Equity</span>
                    <span>${totalEquity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Check */}
                <div className="flex justify-between py-4 font-bold text-sm text-slate-500 border-t-2 border-slate-200 mt-8">
                  <span>Liabilities + Equity</span>
                  <span>${(totalLiabilities + totalEquity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
