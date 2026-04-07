import { collection, getDocs, query, where, getAggregateFromServer, sum, getCountFromServer } from 'firebase/firestore';
import { db } from './firebaseService';
import { InventoryItem, Project, Customer, Brand } from '../types';

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
  
  // To avoid hardcoding, we first fetch all docs just once to get unique owners
  // BUT the goal is optimization. If we fetch all docs, we lose the benefit.
  // Standard brands in this app are 'Twisted Twig' and 'Wood Grain Alchemist'.
  const brands: Brand[] = ['Twisted Twig', 'Wood Grain Alchemist'];
  
  const results = await Promise.all(brands.map(async (brand) => {
    const q = query(inventoryRef, where('owner', '==', brand));
    const snapshot = await getAggregateFromServer(q, {
      totalValue: sum('total_value')
    });
    return {
      owner: brand,
      value: snapshot.data().totalValue || 0
    };
  }));

  return results;
};

/**
 * Fetches project counts grouped by status and brand.
 * Returns data formatted for Recharts (e.g., Stacked BarChart).
 */
export const getProjectCountByStatusAndBrand = async (): Promise<ProjectCountByStatusAndBrand[]> => {
  const projectsRef = collection(db, 'projects');
  
  // These are defined in src/types.ts and src/views/Projects.tsx (KANBAN_STATUSES)
  const statuses = ['Intake', 'Assessment', 'Structural Repair', 'Finishing', 'Complete'];
  const brands: Brand[] = ['Twisted Twig', 'Wood Grain Alchemist'];
  
  const results = await Promise.all(statuses.map(async (status) => {
    const counts = await Promise.all(brands.map(async (brand) => {
      const q = query(projectsRef, where('status', '==', status), where('brand', '==', brand));
      const snapshot = await getCountFromServer(q);
      return { brand, count: snapshot.data().count };
    }));

    return {
      status,
      'Twisted Twig': counts.find(c => c.brand === 'Twisted Twig')?.count || 0,
      'Wood Grain Alchemist': counts.find(c => c.brand === 'Wood Grain Alchemist')?.count || 0
    };
  }));

  return results;
};

/**
 * Fetches revenue from completed projects for this month vs last month.
 * Returns data formatted for Recharts (e.g., BarChart).
 */
export const getRevenueThisMonthVsLastMonth = async (): Promise<RevenueComparison[]> => {
  const projectsRef = collection(db, 'projects');
  
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  
  // Fetch This Month's Revenue
  const thisMonthQuery = query(
    projectsRef,
    where('status', '==', 'Complete'),
    where('completedAt', '>=', firstDayThisMonth)
  );
  const thisMonthSnapshot = await getAggregateFromServer(thisMonthQuery, {
    totalRevenue: sum('financials.actual_sale_price')
  });

  // Fetch Last Month's Revenue
  const lastMonthQuery = query(
    projectsRef,
    where('status', '==', 'Complete'),
    where('completedAt', '>=', firstDayLastMonth),
    where('completedAt', '<', firstDayThisMonth)
  );
  const lastMonthSnapshot = await getAggregateFromServer(lastMonthQuery, {
    totalRevenue: sum('financials.actual_sale_price')
  });
  
  return [
    { period: 'Last Month', revenue: lastMonthSnapshot.data().totalRevenue || 0 },
    { period: 'This Month', revenue: thisMonthSnapshot.data().totalRevenue || 0 }
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
