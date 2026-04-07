import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseService';
import { InventoryItem, Project, Customer } from '../types';

export interface InventoryValueByOwner {
  owner: string;
  value: number;
}

export interface ProjectCountByStatusAndBrand {
  status: string;
  'Twisted Twig': number;
  'Wood Grain Alchemist': number;
}

export interface RevenueComparison {
  period: string;
  revenue: number;
}

export interface TopCustomer {
  name: string;
  purchases: number;
}

/**
 * Fetches total inventory value grouped by owner.
 * Returns data formatted for Recharts (e.g., PieChart or BarChart).
 */
export const getInventoryValueByOwner = async (): Promise<InventoryValueByOwner[]> => {
  const inventoryRef = collection(db, 'inventory');
  const snapshot = await getDocs(inventoryRef);
  
  const valueMap: Record<string, number> = {};
  
  snapshot.forEach(doc => {
    const item = doc.data() as InventoryItem;
    const owner = item.owner || 'Unknown';
    const value = (item.acquisition_cost || 0) * (item.quantity || 1);
    
    if (!valueMap[owner]) {
      valueMap[owner] = 0;
    }
    valueMap[owner] += value;
  });
  
  return Object.keys(valueMap).map(owner => ({
    owner,
    value: valueMap[owner]
  }));
};

/**
 * Fetches project counts grouped by status and brand.
 * Returns data formatted for Recharts (e.g., Stacked BarChart).
 */
export const getProjectCountByStatusAndBrand = async (): Promise<ProjectCountByStatusAndBrand[]> => {
  const projectsRef = collection(db, 'projects');
  const snapshot = await getDocs(projectsRef);
  
  const statusMap: Record<string, { 'Twisted Twig': number; 'Wood Grain Alchemist': number }> = {};
  
  snapshot.forEach(doc => {
    const project = doc.data() as Project;
    const status = project.status || 'Unknown';
    const brand = project.brand as 'Twisted Twig' | 'Wood Grain Alchemist';
    
    if (!statusMap[status]) {
      statusMap[status] = { 'Twisted Twig': 0, 'Wood Grain Alchemist': 0 };
    }
    
    if (brand === 'Twisted Twig' || brand === 'Wood Grain Alchemist') {
      statusMap[status][brand] += 1;
    }
  });
  
  return Object.keys(statusMap).map(status => ({
    status,
    'Twisted Twig': statusMap[status]['Twisted Twig'],
    'Wood Grain Alchemist': statusMap[status]['Wood Grain Alchemist']
  }));
};

/**
 * Fetches revenue from completed projects for this month vs last month.
 * Returns data formatted for Recharts (e.g., BarChart).
 */
export const getRevenueThisMonthVsLastMonth = async (): Promise<RevenueComparison[]> => {
  const projectsRef = collection(db, 'projects');
  
  // We only care about completed projects
  const q = query(projectsRef, where('status', '==', 'Complete'));
  const snapshot = await getDocs(q);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear -= 1;
  }
  
  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;
  
  snapshot.forEach(doc => {
    const project = doc.data() as Project;
    const dateToUse = project.completedAt || project.updatedAt;
    if (!dateToUse) return;
    
    const completedDate = new Date(dateToUse);
    const revenue = project.financials?.actual_sale_price || 0;
    
    if (completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear) {
      thisMonthRevenue += revenue;
    } else if (completedDate.getMonth() === lastMonth && completedDate.getFullYear() === lastMonthYear) {
      lastMonthRevenue += revenue;
    }
  });
  
  return [
    { period: 'Last Month', revenue: lastMonthRevenue },
    { period: 'This Month', revenue: thisMonthRevenue }
  ];
};

/**
 * Fetches the top 5 customers by purchase count.
 * Returns data formatted for Recharts (e.g., BarChart).
 */
export const getTop5Customers = async (): Promise<TopCustomer[]> => {
  const customersRef = collection(db, 'customers');
  const snapshot = await getDocs(customersRef);
  
  const customers: TopCustomer[] = [];
  
  snapshot.forEach(doc => {
    const customer = doc.data() as Customer;
    customers.push({
      name: customer.name || 'Unknown',
      purchases: customer.purchase_history ? customer.purchase_history.length : 0
    });
  });
  
  // Sort by purchases descending and take top 5
  return customers
    .sort((a, b) => b.purchases - a.purchases)
    .slice(0, 5);
};
