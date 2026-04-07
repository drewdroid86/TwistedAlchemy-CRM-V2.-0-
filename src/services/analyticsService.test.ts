import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getInventoryValueByOwner,
  getProjectCountByStatusAndBrand,
  getRevenueThisMonthVsLastMonth
} from './analyticsService';
import { getAggregateFromServer, getCountFromServer } from 'firebase/firestore';

// Mock the firebase/firestore module
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getAggregateFromServer: vi.fn(),
    getCountFromServer: vi.fn(),
    sum: vi.fn(),
  };
});

// Mock the firebase module
vi.mock('./firebaseService', () => {
  return {
    db: {},
  };
});

describe('analyticsService - Optimized Server-Side Aggregations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInventoryValueByOwner', () => {
    it('should correctly sum inventory value by owner using server-side aggregation', async () => {
      // Mock the snapshot for each brand
      vi.mocked(getAggregateFromServer)
        .mockResolvedValueOnce({ data: () => ({ totalValue: 250 }) } as any) // Twisted Twig
        .mockResolvedValueOnce({ data: () => ({ totalValue: 500 }) } as any); // Wood Grain Alchemist

      const result = await getInventoryValueByOwner();

      expect(result).toContainEqual({ owner: 'Twisted Twig', value: 250 });
      expect(result).toContainEqual({ owner: 'Wood Grain Alchemist', value: 500 });
      expect(getAggregateFromServer).toHaveBeenCalledTimes(2);
    });
  });

  describe('getProjectCountByStatusAndBrand', () => {
    it('should correctly count projects by status and brand using server-side aggregation', async () => {
      // Total 10 calls (5 statuses * 2 brands)
      vi.mocked(getCountFromServer).mockResolvedValue({ data: () => ({ count: 5 }) } as any);

      const result = await getProjectCountByStatusAndBrand();

      expect(result.length).toBe(5); // 5 statuses
      expect(result[0]).toEqual({
        status: 'Intake',
        'Twisted Twig': 5,
        'Wood Grain Alchemist': 5
      });
      expect(getCountFromServer).toHaveBeenCalledTimes(10);
    });
  });

  describe('getRevenueThisMonthVsLastMonth', () => {
    it('should correctly sum revenue for this and last month using server-side aggregation', async () => {
      vi.mocked(getAggregateFromServer)
        .mockResolvedValueOnce({ data: () => ({ totalRevenue: 1000 }) } as any) // This Month
        .mockResolvedValueOnce({ data: () => ({ totalRevenue: 800 }) } as any); // Last Month

      const result = await getRevenueThisMonthVsLastMonth();

      expect(result).toContainEqual({ period: 'This Month', revenue: 1000 });
      expect(result).toContainEqual({ period: 'Last Month', revenue: 800 });
      expect(getAggregateFromServer).toHaveBeenCalledTimes(2);
    });
  });
});
