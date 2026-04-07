import { describe, it, expect } from 'vitest';
import {
  calculateTotalCost,
  calculateGrossProfit,
  calculateMarginPercent,
  calculateROIPercent,
  getPricingSuggestion,
} from './financials';
import { ProjectFinancials } from '../types';

describe('financials utility', () => {
  const sampleFinancials: ProjectFinancials = {
    item_cost: 100,
    supplies_cost: 50,
    labor_hours: 10,
    hourly_rate: 20,
    target_sale_price: 500,
    actual_sale_price: 600,
  };

  describe('calculateTotalCost', () => {
    it('should calculate total cost correctly', () => {
      // 100 + 50 + (10 * 20) = 350
      expect(calculateTotalCost(sampleFinancials)).toBe(350);
    });

    it('should handle missing optional fields', () => {
      const minimalFinancials: ProjectFinancials = {
        item_cost: 100,
        supplies_cost: 50,
        target_sale_price: 200,
      };
      // 100 + 50 + (0 * 0) = 150
      expect(calculateTotalCost(minimalFinancials)).toBe(150);
    });
  });

  describe('calculateGrossProfit', () => {
    it('should calculate gross profit correctly', () => {
      // 600 - 350 = 250
      expect(calculateGrossProfit(sampleFinancials)).toBe(250);
    });

    it('should return 0 if actual sale price is missing', () => {
      const noSalePrice: ProjectFinancials = { ...sampleFinancials, actual_sale_price: undefined };
      expect(calculateGrossProfit(noSalePrice)).toBe(0);
    });
  });

  describe('calculateMarginPercent', () => {
    it('should calculate margin percentage correctly', () => {
      // (250 / 600) * 100 = 41.666...
      expect(calculateMarginPercent(sampleFinancials)).toBeCloseTo(41.67, 2);
    });

    it('should return 0 if actual sale price is missing', () => {
      const noSalePrice: ProjectFinancials = { ...sampleFinancials, actual_sale_price: undefined };
      expect(calculateMarginPercent(noSalePrice)).toBe(0);
    });
  });

  describe('calculateROIPercent', () => {
    it('should calculate ROI percentage correctly', () => {
      // (250 / 350) * 100 = 71.428...
      expect(calculateROIPercent(sampleFinancials)).toBeCloseTo(71.43, 2);
    });

    it('should return 0 if total cost is 0', () => {
      const zeroCost: ProjectFinancials = {
        item_cost: 0,
        supplies_cost: 0,
        labor_hours: 0,
        hourly_rate: 0,
        target_sale_price: 0,
      };
      expect(calculateROIPercent(zeroCost)).toBe(0);
    });
  });

  describe('getPricingSuggestion', () => {
    it('should suggest 2x cost', () => {
      // 350 * 2 = 700
      expect(getPricingSuggestion(sampleFinancials, '2x cost')).toBe(700);
    });

    it('should suggest 3x cost', () => {
      // 350 * 3 = 1050
      expect(getPricingSuggestion(sampleFinancials, '3x cost')).toBe(1050);
    });

    it('should suggest hourly + materials (at cost)', () => {
      // 350
      expect(getPricingSuggestion(sampleFinancials, 'hourly + materials')).toBe(350);
    });

    it('should return total cost for unknown strategy', () => {
      expect(getPricingSuggestion(sampleFinancials, 'unknown')).toBe(350);
    });
  });
});
