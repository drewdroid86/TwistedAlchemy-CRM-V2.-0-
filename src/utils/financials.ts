import { ProjectFinancials } from '../types';

/**
 * Calculates the total cost of a project.
 * @param financials The project financials object.
 * @returns The total cost (items + supplies + labor).
 */
export const calculateTotalCost = (financials: ProjectFinancials): number => {
  const laborCost = (financials.labor_hours || 0) * (financials.hourly_rate || 0);
  return (financials.item_cost || 0) + (financials.supplies_cost || 0) + laborCost;
};

/**
 * Calculates the gross profit of a project.
 * @param financials The project financials object.
 * @returns The gross profit (actual sale price - total cost).
 */
export const calculateGrossProfit = (financials: ProjectFinancials): number => {
  if (!financials.actual_sale_price) return 0;
  return financials.actual_sale_price - calculateTotalCost(financials);
};

/**
 * Calculates the profit margin percentage.
 * @param financials The project financials object.
 * @returns The margin percentage (gross profit / actual sale price * 100).
 */
export const calculateMarginPercent = (financials: ProjectFinancials): number => {
  if (!financials.actual_sale_price) return 0;
  const profit = calculateGrossProfit(financials);
  return (profit / financials.actual_sale_price) * 100;
};

/**
 * Calculates the Return on Investment (ROI) percentage.
 * @param financials The project financials object.
 * @returns The ROI percentage (gross profit / total cost * 100).
 */
export const calculateROIPercent = (financials: ProjectFinancials): number => {
  const cost = calculateTotalCost(financials);
  if (cost === 0) return 0;
  const profit = calculateGrossProfit(financials);
  return (profit / cost) * 100;
};

/**
 * Returns a recommended sale price based on the pricing strategy.
 * @param financials The project financials object.
 * @param strategy The pricing strategy ('2x cost', '3x cost', 'hourly + materials').
 * @returns The suggested sale price.
 */
export const getPricingSuggestion = (financials: ProjectFinancials, strategy: '2x cost' | '3x cost' | 'hourly + materials' | string): number => {
  const materialsCost = (financials.item_cost || 0) + (financials.supplies_cost || 0);
  const laborCost = (financials.labor_hours || 0) * (financials.hourly_rate || 0);
  const totalCost = materialsCost + laborCost;

  switch (strategy) {
    case '2x cost':
      return totalCost * 2;
    case '3x cost':
      return totalCost * 3;
    case 'hourly + materials':
      return totalCost; // Assuming 'hourly + materials' means charging exactly cost
    default:
      return totalCost;
  }
};
