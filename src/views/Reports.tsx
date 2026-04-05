import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../services/firebaseService';
import { Project, InventoryItem, Customer, Brand } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Package, 
  Users, 
  Hammer,
  ChevronDown,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#141414', '#5A5A40', '#F27D26', '#E4E3E0', '#8E9299'];

export default function Reports() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeReport, setActiveReport] = useState<'sales' | 'inventory' | 'projects' | 'customers' | 'loanOfficer'>('loanOfficer');

  useEffect(() => {
    const unsubProjects = subscribeToCollection<Project>('projects', setProjects);
    const unsubInventory = subscribeToCollection<InventoryItem>('inventory', setInventory);
    const unsubCustomers = subscribeToCollection<Customer>('customers', setCustomers);
    return () => {
      unsubProjects();
      unsubInventory();
      unsubCustomers();
    };
  }, []);

  // --- Data Processing for Reports ---

  // 1. Sales Report Data
  const completedProjects = projects.filter(p => p.status === 'Complete');
  const salesByMonth = completedProjects.reduce((acc: any, p) => {
    const month = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
    if (!acc[month]) acc[month] = { month, revenue: 0, profit: 0 };
    const rev = p.financials.actual_sale_price || 0;
    const cost = (p.financials.item_cost || 0) + (p.financials.supplies_cost || 0);
    acc[month].revenue += rev;
    acc[month].profit += (rev - cost);
    return acc;
  }, {});
  const salesData = Object.values(salesByMonth);

  // Loan Officer Summary Data
  const totalRevenue = completedProjects.reduce((acc, p) => acc + (p.financials.actual_sale_price || 0), 0);
  const totalCost = completedProjects.reduce((acc, p) => acc + (p.financials.item_cost || 0) + (p.financials.supplies_cost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const inventoryValue = inventory.reduce((acc, item) => acc + (item.acquisition_cost * item.quantity), 0);
  const activeProjectCount = projects.filter(p => p.status !== 'Complete').length;

  // 2. Inventory Report Data
  const inventoryByBrand = inventory.reduce((acc: any, item) => {
    if (!acc[item.owner]) acc[item.owner] = { name: item.owner, value: 0, count: 0 };
    acc[item.owner].value += (item.acquisition_cost * item.quantity);
    acc[item.owner].count += item.quantity;
    return acc;
  }, {});
  const inventoryData = Object.values(inventoryByBrand);

  // 3. Project Status Data
  const statusCounts = projects.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const projectStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // 4. Customer Spend Data
  const customerSpend = projects.reduce((acc: any, p) => {
    if (!p.client_id) return acc;
    const customer = customers.find(c => c.id === p.client_id);
    const name = customer?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + (p.financials.actual_sale_price || 0);
    return acc;
  }, {});
  const customerData = Object.entries(customerSpend)
    .map(([name, spend]) => ({ name, spend: spend as number }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const downloadCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-3xl font-serif italic font-bold text-stone-900">Business Intelligence</h2>
          <p className="text-stone-500 mt-1">Detailed reports for WGA & Twisted Twig.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => downloadCSV(salesData, 'sales_report.csv')}
            className="flex items-center gap-2 bg-white border border-stone-200 text-stone-900 px-6 py-3 rounded-2xl font-bold hover:bg-stone-50 transition-all shadow-sm"
          >
            <Download size={20} /> Digital Export
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-olive-accent text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Printer size={20} /> Print Report
          </button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="flex gap-4 border-b border-stone-200 print:hidden">
        {[
          { id: 'loanOfficer', label: 'Loan Officer Summary', icon: FileText },
          { id: 'sales', label: 'Sales & Profit', icon: TrendingUp },
          { id: 'inventory', label: 'Inventory Health', icon: Package },
          { id: 'projects', label: 'Project Flow', icon: Hammer },
          { id: 'customers', label: 'Customer Value', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all relative ${
              activeReport === tab.id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {activeReport === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-1 bg-olive-accent rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 gap-8">
        {activeReport === 'loanOfficer' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-refined p-6">
                <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl font-bold text-stone-900 mt-2">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="card-refined p-6">
                <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Net Profit</p>
                <p className="text-3xl font-bold text-stone-900 mt-2">${totalProfit.toLocaleString()}</p>
              </div>
              <div className="card-refined p-6">
                <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Inventory Value</p>
                <p className="text-3xl font-bold text-stone-900 mt-2">${inventoryValue.toLocaleString()}</p>
              </div>
              <div className="card-refined p-6">
                <p className="text-stone-500 text-sm font-bold uppercase tracking-wider">Active Projects</p>
                <p className="text-3xl font-bold text-stone-900 mt-2">{activeProjectCount}</p>
              </div>
            </div>
            <div className="card-refined p-8">
              <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Financial Overview</h3>
              <p className="text-stone-500">This summary provides a high-level overview of the business performance, suitable for loan applications or financial reviews.</p>
            </div>
          </motion.div>
        )}
        {activeReport === 'sales' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Revenue vs Profit (Monthly)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#8E9299', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#8E9299', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="revenue" fill="#141414" radius={[4, 4, 0, 0]} name="Total Revenue" />
                      <Bar dataKey="profit" fill="#5A5A40" radius={[4, 4, 0, 0]} name="Net Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Itemized Project Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="pb-4 font-bold text-stone-400 uppercase tracking-wider text-[10px]">Project</th>
                        <th className="pb-4 font-bold text-stone-400 uppercase tracking-wider text-[10px]">Brand</th>
                        <th className="pb-4 font-bold text-stone-400 uppercase tracking-wider text-[10px]">Revenue</th>
                        <th className="pb-4 font-bold text-stone-400 uppercase tracking-wider text-[10px]">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {completedProjects.slice(0, 8).map(p => {
                        const rev = p.financials.actual_sale_price || 0;
                        const cost = (p.financials.item_cost || 0) + (p.financials.supplies_cost || 0);
                        const margin = rev > 0 ? ((rev - cost) / rev * 100).toFixed(1) : '0';
                        return (
                          <tr key={p.id}>
                            <td className="py-4 font-medium text-stone-900">#{p.id?.slice(-4)}</td>
                            <td className="py-4 text-stone-500">{p.brand}</td>
                            <td className="py-4 font-bold text-stone-900">${rev.toLocaleString()}</td>
                            <td className={`py-4 font-bold ${parseFloat(margin) > 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {margin}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeReport === 'inventory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Inventory Value by Brand</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {inventoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Stock Level Summary</h3>
                <div className="space-y-6">
                  {inventoryData.map((brand: any, i) => (
                    <div key={brand.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-stone-900">{brand.name}</span>
                        <span className="text-stone-500">{brand.count} Items</span>
                      </div>
                      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (brand.value / 10000) * 100)}%` }}
                          className={`h-full ${i === 0 ? 'bg-stone-900' : 'bg-olive-accent'}`}
                        />
                      </div>
                      <p className="text-right text-[10px] font-bold text-stone-400 uppercase">
                        Value: ${brand.value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeReport === 'projects' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Workflow Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectStatusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#8E9299', fontSize: 12}} width={120} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#5A5A40" radius={[0, 4, 4, 0]} name="Projects" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Labor Efficiency</h3>
                <p className="text-stone-500 text-sm mb-6">Average hours spent per project stage.</p>
                <div className="space-y-4">
                   {/* Placeholder for labor tracking if implemented in work logs */}
                   <div className="p-12 text-center text-stone-400 border-2 border-dashed border-stone-100 rounded-2xl italic">
                     Detailed labor tracking will appear here as work logs are populated.
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeReport === 'customers' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Top Customers by Revenue</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8E9299', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#8E9299', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="spend" fill="#5A5A40" radius={[4, 4, 0, 0]} name="Total Spend ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card-refined p-8">
                <h3 className="text-lg font-serif italic font-bold text-stone-900 mb-6">Customer Acquisition</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-stone-200">
                        <Users size={18} className="text-stone-600" />
                      </div>
                      <span className="font-bold text-stone-900">Total Database</span>
                    </div>
                    <span className="text-xl font-bold">{customers.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-stone-200">
                        <TrendingUp size={18} className="text-stone-600" />
                      </div>
                      <span className="font-bold text-stone-900">Repeat Customers</span>
                    </div>
                    <span className="text-xl font-bold">
                      {customers.filter(c => (c.purchase_history?.length || 0) > 1).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
