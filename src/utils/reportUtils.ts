import { Project, InventoryItem, Customer } from '../types';

export function getSalesData(projects: Project[]) {
  const completedProjects = projects.filter(p => p.status === 'Complete');
  const salesByMonth = completedProjects.reduce((acc: any, p) => {
    const month = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
    if (!acc[month]) acc[month] = { month, revenue: 0, profit: 0 };
    const rev = p.financials?.actual_sale_price || 0;
    const cost = (p.financials?.item_cost || 0) + (p.financials?.supplies_cost || 0);
    acc[month].revenue += rev;
    acc[month].profit += (rev - cost);
    return acc;
  }, {});
  return Object.values(salesByMonth);
}

export function getFinancialSummary(projects: Project[], inventory: InventoryItem[]) {
  const completedProjects = projects.filter(p => p.status === 'Complete');
  const totalRevenue = completedProjects.reduce((acc, p) => acc + (p.financials?.actual_sale_price || 0), 0);
  const totalCost = completedProjects.reduce((acc, p) => acc + (p.financials?.item_cost || 0) + (p.financials?.supplies_cost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const inventoryValue = inventory.reduce((acc, item) => acc + ((item.acquisition_cost || 0) * (item.quantity || 0)), 0);
  const activeProjectCount = projects.filter(p => p.status !== 'Complete').length;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    inventoryValue,
    activeProjectCount,
    completedProjects
  };
}

export function getInventoryData(inventory: InventoryItem[]) {
  const inventoryByBrand = inventory.reduce((acc: any, item) => {
    if (!acc[item.owner]) acc[item.owner] = { name: item.owner, value: 0, count: 0 };
    acc[item.owner].value += ((item.acquisition_cost || 0) * (item.quantity || 0));
    acc[item.owner].count += (item.quantity || 0);
    return acc;
  }, {});
  return Object.values(inventoryByBrand);
}

export function getProjectStatusData(projects: Project[]) {
  const statusCounts = projects.reduce((acc: any, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
}

export function getCustomerData(projects: Project[], customers: Customer[]) {
  const customerSpend = projects.reduce((acc: any, p) => {
    if (!p.client_id) return acc;
    const customer = customers.find(c => c.id === p.client_id);
    const name = customer?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + (p.financials?.actual_sale_price || 0);
    return acc;
  }, {});
  return Object.entries(customerSpend)
    .map(([name, spend]) => ({ name, spend: spend as number }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);
}
