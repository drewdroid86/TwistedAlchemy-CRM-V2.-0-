import { describe, it, expect } from 'vitest';
import { getSalesData, getFinancialSummary, getInventoryData, getProjectStatusData, getCustomerData } from './reportUtils';
import { Project, InventoryItem, Customer } from '../types';

describe('reportUtils', () => {
  const mockProjects: Project[] = [
    {
      id: 'p1',
      brand: 'Twisted Twig',
      status: 'Complete',
      assigned_to: 'Alice',
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2023-01-20T10:00:00Z',
      financials: {
        item_cost: 50,
        supplies_cost: 20,
        target_sale_price: 200,
        actual_sale_price: 250
      },
      work_log: [],
      client_id: 'c1'
    },
    {
      id: 'p2',
      brand: 'Wood Grain Alchemist',
      status: 'Complete',
      assigned_to: 'Bob',
      createdAt: '2023-01-25T10:00:00Z',
      updatedAt: '2023-01-30T10:00:00Z',
      financials: {
        item_cost: 100,
        supplies_cost: 50,
        target_sale_price: 400,
        actual_sale_price: 400
      },
      work_log: [],
      client_id: 'c2'
    },
    {
      id: 'p3',
      brand: 'Twisted Twig',
      status: 'Intake',
      assigned_to: 'Alice',
      createdAt: '2023-02-10T10:00:00Z',
      updatedAt: '2023-02-10T10:00:00Z',
      financials: {
        item_cost: 30,
        supplies_cost: 10,
        target_sale_price: 150
      },
      work_log: []
    }
  ];

  const mockInventory: InventoryItem[] = [
    {
      id: 'i1',
      owner: 'Twisted Twig',
      type: 'Raw Material',
      name: 'Oak Wood',
      quantity: 10,
      acquisition_cost: 5,
      location: 'Shop',
      createdAt: '2023-01-01T10:00:00Z',
      updatedAt: '2023-01-01T10:00:00Z'
    },
    {
      id: 'i2',
      owner: 'Wood Grain Alchemist',
      type: 'Supply',
      name: 'Screws',
      quantity: 100,
      acquisition_cost: 0.1,
      location: 'Shop',
      createdAt: '2023-01-01T10:00:00Z',
      updatedAt: '2023-01-01T10:00:00Z'
    }
  ];

  const mockCustomers: Customer[] = [
    { id: 'c1', name: 'John Doe', contact: 'john@example.com', purchase_history: ['p1'] },
    { id: 'c2', name: 'Jane Smith', contact: 'jane@example.com', purchase_history: ['p2'] }
  ];

  describe('getSalesData', () => {
    it('should aggregate sales data by month for completed projects', () => {
      const result = getSalesData(mockProjects);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        month: 'Jan',
        revenue: 650,
        profit: 430
      });
    });

    it('should return empty array when no completed projects exist', () => {
      const result = getSalesData([{ ...mockProjects[2] }]);
      expect(result).toEqual([]);
    });

    it('should handle projects with missing financials gracefully', () => {
      const emptyProject: Project = {
        ...mockProjects[0],
        financials: { target_sale_price: 100, item_cost: 0, supplies_cost: 0 } // no actual_sale_price
      };
      const result = getSalesData([emptyProject]);
      expect(result[0]).toEqual({
        month: 'Jan',
        revenue: 0,
        profit: 0
      });
    });
  });

  describe('getFinancialSummary', () => {
    it('should calculate total revenue, cost, profit, inventory value and active projects', () => {
      const result = getFinancialSummary(mockProjects, mockInventory);
      expect(result.totalRevenue).toBe(650);
      expect(result.totalCost).toBe(220);
      expect(result.totalProfit).toBe(430);
      expect(result.inventoryValue).toBe(60);
      expect(result.activeProjectCount).toBe(1);
      expect(result.completedProjects).toHaveLength(2);
    });
  });

  describe('getInventoryData', () => {
    it('should aggregate inventory value and count by brand', () => {
      const result = getInventoryData(mockInventory);
      expect(result).toHaveLength(2);

      const twistedTwig = result.find((r: any) => r.name === 'Twisted Twig');
      expect(twistedTwig).toBeDefined();
      expect(twistedTwig?.value).toBe(50);
      expect(twistedTwig?.count).toBe(10);

      const wga = result.find((r: any) => r.name === 'Wood Grain Alchemist');
      expect(wga).toBeDefined();
      expect(wga?.value).toBe(10);
      expect(wga?.count).toBe(100);
    });

    it('should handle empty inventory array', () => {
      expect(getInventoryData([])).toEqual([]);
    });
  });

  describe('getProjectStatusData', () => {
    it('should count projects by status', () => {
      const result = getProjectStatusData(mockProjects);
      expect(result).toHaveLength(2);
      expect(result.find((r: any) => r.name === 'Complete')?.value).toBe(2);
      expect(result.find((r: any) => r.name === 'Intake')?.value).toBe(1);
    });

    it('should return empty array for no projects', () => {
      expect(getProjectStatusData([])).toEqual([]);
    });
  });

  describe('getCustomerData', () => {
    it('should aggregate customer spend and return top 5 sorted', () => {
      const result = getCustomerData(mockProjects, mockCustomers);
      expect(result).toHaveLength(2);

      expect(result[0].name).toBe('Jane Smith');
      expect(result[0].spend).toBe(400);

      expect(result[1].name).toBe('John Doe');
      expect(result[1].spend).toBe(250);
    });

    it('should use Unknown if customer is not found', () => {
      const unknownProject: Project = {
        ...mockProjects[0],
        client_id: 'unknown-id',
        financials: { ...mockProjects[0].financials, actual_sale_price: 100 }
      };
      const result = getCustomerData([unknownProject], mockCustomers);
      expect(result[0].name).toBe('Unknown');
      expect(result[0].spend).toBe(100);
    });

    it('should ignore projects without client_id', () => {
      const result = getCustomerData([mockProjects[2]], mockCustomers);
      expect(result).toEqual([]);
    });
  });
});
