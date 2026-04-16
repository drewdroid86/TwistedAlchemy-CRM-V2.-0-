import { describe, it, expect } from 'vitest';
import {
  calculateTotalCost,
  calculateGrossProfit,
  calculateMarginPercent,
  calculateROIPercent,
  getPricingSuggestion
} from './financials';
import { ProjectFinancials } from '../types';

describe('financials utils', () => {
  describe('calculateTotalCost', () => {
    it('should calculate total cost with all components', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        labor_hours: 10,
        hourly_rate: 25,
        target_sale_price: 500
      };
      // 100 + 50 + (10 * 25) = 100 + 50 + 250 = 400
      expect(calculateTotalCost(financials)).toBe(400);
    });

    it('should calculate total cost with only item and supplies', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        target_sale_price: 500
      };
      expect(calculateTotalCost(financials)).toBe(150);
    });

    it('should handle missing or zero values', () => {
      const financials: ProjectFinancials = {
        item_cost: 0,
        supplies_cost: 0,
        target_sale_price: 0
      };
      expect(calculateTotalCost(financials)).toBe(0);
    });

    it('should handle partial labor info', () => {
      const financialsWithHours: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        labor_hours: 10,
        target_sale_price: 500
      };
      expect(calculateTotalCost(financialsWithHours)).toBe(150);

      const financialsWithRate: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        hourly_rate: 25,
        target_sale_price: 500
      };
      expect(calculateTotalCost(financialsWithRate)).toBe(150);
    });
  });

  describe('calculateGrossProfit', () => {
    it('should calculate positive gross profit', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        actual_sale_price: 500,
        target_sale_price: 400
      };
      // 500 - (100 + 50) = 350
      expect(calculateGrossProfit(financials)).toBe(350);
    });

    it('should calculate negative gross profit (loss)', () => {
      const financials: ProjectFinancials = {
        item_cost: 300,
        supplies_cost: 100,
        actual_sale_price: 200,
        target_sale_price: 400
      };
      // 200 - (300 + 100) = -200
      expect(calculateGrossProfit(financials)).toBe(-200);
    });

    it('should return 0 if actual_sale_price is missing', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        target_sale_price: 400
      };
      expect(calculateGrossProfit(financials)).toBe(0);
    });

    it('should return 0 if actual_sale_price is zero', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        actual_sale_price: 0,
        target_sale_price: 400
      };
      expect(calculateGrossProfit(financials)).toBe(0);
    });
  });

  describe('calculateMarginPercent', () => {
    it('should calculate margin percent correctly', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        actual_sale_price: 300,
        target_sale_price: 300
      };
      // profit = 300 - 150 = 150
      // margin = (150 / 300) * 100 = 50%
      expect(calculateMarginPercent(financials)).toBe(50);
    });

    it('should return 0 if actual_sale_price is missing', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        target_sale_price: 300
      };
      expect(calculateMarginPercent(financials)).toBe(0);
    });
  });

  describe('calculateROIPercent', () => {
    it('should calculate ROI percent correctly', () => {
      const financials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        actual_sale_price: 300,
        target_sale_price: 300
      };
      // cost = 150, profit = 150
      // ROI = (150 / 150) * 100 = 100%
      expect(calculateROIPercent(financials)).toBe(100);
    });

    it('should return 0 if total cost is zero', () => {
      const financials: ProjectFinancials = {
        item_cost: 0,
        supplies_cost: 0,
        actual_sale_price: 300,
        target_sale_price: 300
      };
      expect(calculateROIPercent(financials)).toBe(0);
    });
  });

  describe('getPricingSuggestion', () => {
    const financials: ProjectFinancials = {
      item_cost: 100,
      supplies_cost: 50,
      labor_hours: 10,
      hourly_rate: 20,
      target_sale_price: 0
    };
    // total cost = 100 + 50 + 200 = 350

    it('should return 2x cost', () => {
      expect(getPricingSuggestion(financials, '2x cost')).toBe(700);
    });

    it('should return 3x cost', () => {
      expect(getPricingSuggestion(financials, '3x cost')).toBe(1050);
    });

    it('should return 1x cost for hourly + materials', () => {
      expect(getPricingSuggestion(financials, 'hourly + materials')).toBe(350);
    });

    it('should return 1x cost for unknown strategy', () => {
      expect(getPricingSuggestion(financials, 'unknown')).toBe(350);
    });
  });
});
