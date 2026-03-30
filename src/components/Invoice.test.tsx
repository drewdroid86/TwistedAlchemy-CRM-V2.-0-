import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Invoice from './Invoice';
import { Project, Customer, InventoryItem } from '../types';

describe('Invoice Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-27T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockProject: Project = {
    id: 'proj-123456',
    brand: 'Wood Grain Alchemist',
    status: 'Complete',
    assigned_to: 'Alice',
    financials: {
      item_cost: 100,
      supplies_cost: 50,
      target_sale_price: 500,
      actual_sale_price: 450,
    },
    work_log: [],
    createdAt: '2023-10-27T10:00:00Z',
    updatedAt: '2023-10-28T10:00:00Z',
  };

  const mockCustomer: Customer = {
    id: 'cust-1',
    name: 'John Doe',
    contact: 'john@example.com',
    purchase_history: [],
  };

  const mockInventoryItem: InventoryItem = {
    id: 'inv-1',
    owner: 'Wood Grain Alchemist',
    type: 'Furniture Piece',
    name: 'Vintage Oak Table',
    quantity: 1,
    acquisition_cost: 100,
    location: 'Warehouse A',
    createdAt: '2023-10-20T10:00:00Z',
    updatedAt: '2023-10-21T10:00:00Z',
  };

  it('renders basic project data correctly', () => {
    render(<Invoice project={mockProject} />);

    // Brand and Invoice ID
    expect(screen.getByText('Wood Grain Alchemist')).toBeInTheDocument();
    expect(screen.getByText('Invoice #123456')).toBeInTheDocument();

    // Date
    const formattedDate = new Date(mockProject.createdAt).toLocaleDateString();
    expect(screen.getByText(`Date: ${formattedDate}`)).toBeInTheDocument();

    // Amount (using actual_sale_price)
    const amountCells = screen.getAllByText('$450');
    expect(amountCells.length).toBeGreaterThan(0);

    // Default Description when no inventoryItem is provided
    expect(screen.getByText('Custom Project')).toBeInTheDocument();

    // Default Bill To when no customer is provided
    const defaultBillToTexts = screen.getAllByText('N/A');
    expect(defaultBillToTexts.length).toBe(2);
  });

  it('renders customer data when provided', () => {
    render(<Invoice project={mockProject} customer={mockCustomer} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('renders inventory item name when provided', () => {
    render(<Invoice project={mockProject} inventoryItem={mockInventoryItem} />);

    expect(screen.getByText('Vintage Oak Table')).toBeInTheDocument();
  });

  it('falls back to target_sale_price if actual_sale_price is missing', () => {
    const projectWithoutActualPrice = {
      ...mockProject,
      financials: {
        ...mockProject.financials,
        actual_sale_price: undefined,
      },
    };
    render(<Invoice project={projectWithoutActualPrice} />);

    // Expected Amount (using target_sale_price: 500)
    const amountCells = screen.getAllByText('$500');
    expect(amountCells.length).toBeGreaterThan(0);
  });
});
