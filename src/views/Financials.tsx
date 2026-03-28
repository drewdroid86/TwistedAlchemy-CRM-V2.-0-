import React, { useState, useEffect } from 'react';
import { subscribeToCollection, createDocument } from '../services/firebaseService';
import { Project, InventoryItem, Customer, PurchaseOrder, Brand } from '../types';
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
  Scale,
  History,
  PlusCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Financials() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [activeReport, setActiveReport] = useState<'pnl' | 'balanceSheet' | 'digitize'>('pnl');

  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // Historical Data Entry State
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleBrand, setSaleBrand] = useState<Brand>('Wood Grain Alchemist');
  const [saleRevenue, setSaleRevenue] = useState('');
  const [saleCOGS, setSaleCOGS] = useState('');
  const [saleName, setSaleName] = useState('');

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseBrand, setExpenseBrand] = useState<Brand>('Wood Grain Alchemist');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const handleAddHistoricalSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDocument('projects', {
        brand: saleBrand,
        title: saleName,
        description: 'Historical Record',
        status: 'Complete',
        assigned_to: 'Historical',
        financials: {
          target_sale_price: Number(saleRevenue),
          actual_sale_price: Number(saleRevenue),
          item_cost: Number(saleCOGS),
          supplies_cost: 0,
        },
        work_log: [{
          timestamp: new Date(saleDate).toISOString(),
          action: 'Historical Entry',
          notes: saleName || 'Historical Sale'
        }],
        createdAt: new Date(saleDate).toISOString(),
        updatedAt: new Date(saleDate).toISOString(),
        completedAt: new Date(saleDate).toISOString()
      });
      setSaleRevenue('');
      setSaleCOGS('');
      setSaleName('');
      alert('Historical sale added successfully!');
    } catch (error) {
      console.error('Error adding historical sale:', error);
      alert('Failed to add historical sale.');
    }
  };

  const handleAddHistoricalExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDocument('purchase_orders', {
        brand: expenseBrand,
        vendor: expenseVendor || 'Historical Vendor',
        date: expenseDate,
        total_amount: Number(expenseAmount),
        status: 'Received',
        items: [{
          description: expenseDescription || 'Historical Expense',
          quantity: 1,
          unit_price: Number(expenseAmount)
        }],
        notes: expenseDescription,
        createdAt: new Date(expenseDate).toISOString()
      });
      setExpenseVendor('');
      setExpenseAmount('');
      setExpenseDescription('');
      alert('Historical expense added successfully!');
    } catch (error) {
      console.error('Error adding historical expense:', error);
      alert('Failed to add historical expense.');
    }
  };

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

  const completedProjects = projects.filter(p => {
    if (p.status !== 'Complete') return false;
    const date = new Date(p.createdAt);
    return date.getMonth() === filterMonth && date.getFullYear() === filterYear;
  });
  
  // Revenue
  const revenueWGA = completedProjects.filter(p => p.brand === 'Wood Grain Alchemist').reduce((acc, p) => acc + (p.financials.actual_sale_price || 0), 0);
  const revenueTT = completedProjects.filter(p => p.brand === 'Twisted Twig').reduce((acc, p) => acc + (p.financials.actual_sale_price || 0), 0);
  const totalRevenue = revenueWGA + revenueTT;

  // COGS (Cost of Goods Sold)
  const cogsWGA = completedProjects.filter(p => p.brand === 'Wood Grain Alchemist').reduce((acc, p) => acc + (p.financials.item_cost || 0) + (p.financials.supplies_cost || 0), 0);
  const cogsTT = completedProjects.filter(p => p.brand === 'Twisted Twig').reduce((acc, p) => acc + (p.financials.item_cost || 0) + (p.financials.supplies_cost || 0), 0);
  const totalCOGS = cogsWGA + cogsTT;

  const grossProfit = totalRevenue - totalCOGS;

  // Operating Expenses (Purchase Orders)
  const expensesWGA = purchaseOrders.filter(po => po.brand === 'Wood Grain Alchemist').reduce((acc, po) => acc + po.total_amount, 0);
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
          { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp },
          { id: 'balanceSheet', label: 'Balance Sheet', icon: Scale },
          { id: 'digitize', label: 'Digitize Records', icon: History },
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
        
        {/* DIGITIZE RECORDS */}
        {activeReport === 'digitize' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Historical Sale Form */}
              <div className="card-refined p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-xl font-serif italic font-bold text-slate-900">Log Historical Sale</h3>
                </div>
                
                <form onSubmit={handleAddHistoricalSale} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Brand</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={saleBrand}
                        onChange={(e) => setSaleBrand(e.target.value as Brand)}
                      >
                        <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
                        <option value="Twisted Twig">Twisted Twig</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Project / Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Custom Dining Table"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      value={saleName}
                      onChange={(e) => setSaleName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Revenue ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={saleRevenue}
                        onChange={(e) => setSaleRevenue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">COGS ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={saleCOGS}
                        onChange={(e) => setSaleCOGS(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <PlusCircle size={18} /> Add Sale Record
                  </button>
                </form>
              </div>

              {/* Historical Expense Form */}
              <div className="card-refined p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-xl font-serif italic font-bold text-slate-900">Log Historical Expense</h3>
                </div>
                
                <form onSubmit={handleAddHistoricalExpense} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Brand</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={expenseBrand}
                        onChange={(e) => setExpenseBrand(e.target.value as Brand)}
                      >
                        <option value="Wood Grain Alchemist">Wood Grain Alchemist</option>
                        <option value="Twisted Twig">Twisted Twig</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Vendor</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Home Depot"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={expenseVendor}
                        onChange={(e) => setExpenseVendor(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Amount ($)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Lumber and screws"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm"
                  >
                    <PlusCircle size={18} /> Add Expense Record
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}

        {/* PROFIT & LOSS */}
        {activeReport === 'pnl' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Filter UI */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-slate-500 uppercase">Month:</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-slate-500 uppercase">Year:</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

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
