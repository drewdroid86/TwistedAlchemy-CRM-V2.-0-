import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getInventoryValueByOwner,
  getProjectCountByStatusAndBrand,
  getRevenueThisMonthVsLastMonth,
  getTop5Customers
} from './analyticsService';
import { getDocs } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('./firebaseService', () => ({
  db: {},
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getInventoryValueByOwner', () => {
    it('should calculate total inventory value grouped by owner', async () => {
      const mockInventory = [
        { data: () => ({ owner: 'Twisted Twig', acquisition_cost: 100, quantity: 2 }) },
        { data: () => ({ owner: 'Twisted Twig', acquisition_cost: 50, quantity: 1 }) },
        { data: () => ({ owner: 'Wood Grain Alchemist', acquisition_cost: 200, quantity: 1 }) },
        { data: () => ({ owner: 'Wood Grain Alchemist', acquisition_cost: 300, quantity: 2 }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockInventory.forEach(callback)
      } as any);

      const result = await getInventoryValueByOwner();

      // The order might not be guaranteed, so we check inclusion
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ owner: 'Twisted Twig', value: 250 });
      expect(result).toContainEqual({ owner: 'Wood Grain Alchemist', value: 800 });
    });

    it('should handle missing fields with default values', async () => {
       const mockInventory = [
        { data: () => ({ }) }, // Missing everything
      ];

      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockInventory.forEach(callback)
      } as any);

      const result = await getInventoryValueByOwner();

      expect(result).toEqual([
        { owner: 'Unknown', value: 0 },
      ]);
    });
  });

  describe('getProjectCountByStatusAndBrand', () => {
    it('should group project counts by status and brand', async () => {
      const mockProjects = [
        { data: () => ({ status: 'Intake', brand: 'Twisted Twig' }) },
        { data: () => ({ status: 'Intake', brand: 'Twisted Twig' }) },
        { data: () => ({ status: 'Intake', brand: 'Wood Grain Alchemist' }) },
        { data: () => ({ status: 'Finishing', brand: 'Wood Grain Alchemist' }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockProjects.forEach(callback)
      } as any);

      const result = await getProjectCountByStatusAndBrand();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        status: 'Intake',
        'Twisted Twig': 2,
        'Wood Grain Alchemist': 1,
      });
      expect(result).toContainEqual({
        status: 'Finishing',
        'Twisted Twig': 0,
        'Wood Grain Alchemist': 1,
      });
    });

    it('should ignore unknown brands', async () => {
      const mockProjects = [
        { data: () => ({ status: 'Intake', brand: 'Unknown Brand' }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockProjects.forEach(callback)
      } as any);

      const result = await getProjectCountByStatusAndBrand();

      expect(result).toEqual([
        { status: 'Intake', 'Twisted Twig': 0, 'Wood Grain Alchemist': 0 }
      ]);
    });
  });

  describe('getRevenueThisMonthVsLastMonth', () => {
    it('should calculate revenue for this month and last month', async () => {
      // Mock system time to 2023-10-15
      const mockNow = new Date('2023-10-15T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      const mockProjects = [
        // This month (Oct 2023)
        { data: () => ({ completedAt: '2023-10-01T00:00:00Z', financials: { actual_sale_price: 1000 } }) },
        // Last month (Sep 2023)
        { data: () => ({ completedAt: '2023-09-15T00:00:00Z', financials: { actual_sale_price: 500 } }) },
        // Fallback to updatedAt
        { data: () => ({ updatedAt: '2023-10-05T00:00:00Z', financials: { actual_sale_price: 200 } }) },
        // Other month
        { data: () => ({ completedAt: '2023-08-15T00:00:00Z', financials: { actual_sale_price: 100 } }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockProjects.forEach(callback)
      } as any);

      const result = await getRevenueThisMonthVsLastMonth();

      expect(result).toEqual([
        { period: 'Last Month', revenue: 500 },
        { period: 'This Month', revenue: 1200 },
      ]);
    });

    it('should handle January to December transition correctly', async () => {
      // Mock system time to 2024-01-15
      const mockNow = new Date('2024-01-15T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);

      const mockProjects = [
        // This month (Jan 2024)
        { data: () => ({ completedAt: '2024-01-01T00:00:00Z', financials: { actual_sale_price: 1000 } }) },
        // Last month (Dec 2023)
        { data: () => ({ completedAt: '2023-12-15T00:00:00Z', financials: { actual_sale_price: 500 } }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockProjects.forEach(callback)
      } as any);

      const result = await getRevenueThisMonthVsLastMonth();

      expect(result).toEqual([
        { period: 'Last Month', revenue: 500 },
        { period: 'This Month', revenue: 1000 },
      ]);
    });
  });

  describe('getTop5Customers', () => {
    it('should return top 5 customers sorted by purchase count', async () => {
      const mockCustomers = [
        { data: () => ({ name: 'Cust A', purchase_history: ['1', '2', '3'] }) },
        { data: () => ({ name: 'Cust B', purchase_history: ['1', '2', '3', '4'] }) },
        { data: () => ({ name: 'Cust C', purchase_history: ['1'] }) },
        { data: () => ({ name: 'Cust D', purchase_history: ['1', '2', '3', '4', '5'] }) },
        { data: () => ({ name: 'Cust E', purchase_history: ['1', '2'] }) },
        { data: () => ({ name: 'Cust F', purchase_history: [] }) },
      ];

      vi.mocked(getDocs).mockResolvedValue({
        forEach: (callback: any) => mockCustomers.forEach(callback)
      } as any);

      const result = await getTop5Customers();

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ name: 'Cust D', purchases: 5 });
      expect(result[1]).toEqual({ name: 'Cust B', purchases: 4 });
      expect(result[2]).toEqual({ name: 'Cust A', purchases: 3 });
      expect(result[3]).toEqual({ name: 'Cust E', purchases: 2 });
      expect(result[4]).toEqual({ name: 'Cust C', purchases: 1 });
    });
  });
});
