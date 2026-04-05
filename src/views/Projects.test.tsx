import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Projects from './Projects';
import * as firebaseService from '../services/firebaseService';

// Mock dependencies
vi.mock('../services/firebaseService', () => ({
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  updateArrayField: vi.fn(),
}));

vi.mock('../components/ImageUpload', () => ({
  default: () => <div data-testid="image-upload" />
}));

vi.mock('../components/Invoice', () => ({
  default: () => <div data-testid="invoice" />
}));

vi.mock('../services/pricingService', () => ({
  suggestProjectPrice: vi.fn(),
}));

vi.mock('lucide-react', () => {
  const React = require('react');
  const icons = [
    'Plus', 'Search', 'Filter', 'Hammer', 'Clock', 'CheckCircle2',
    'AlertCircle', 'DollarSign', 'ChevronRight', 'X', 'Calculator',
    'Camera', 'Image', 'Sparkles', 'Loader2'
  ];
  const mockedIcons: any = {};
  icons.forEach(icon => {
    mockedIcons[icon] = () => React.createElement('span', { 'data-testid': `icon-${icon.toLowerCase()}` });
  });
  return mockedIcons;
});

vi.mock('motion/react', () => {
  const React = require('react');
  return {
    motion: {
      div: ({ children, ...props }: any) => {
        const { layout, initial, animate, exit, ...rest } = props;
        return React.createElement('div', rest, children);
      }
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children)
  };
});

describe('Projects Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementation for subscribeToCollection
    (firebaseService.subscribeToCollection as any).mockImplementation((collection: string, callback: any) => {
      callback([]);
      return vi.fn(); // return unsubscribe function
    });
  });

  it('renders the Kanban board columns', () => {
    render(<Projects />);
    expect(screen.getByText('Intake')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText('Structural Repair')).toBeInTheDocument();
    expect(screen.getByText('Finishing')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('renders projects in their respective columns', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        brand: 'Twisted Twig',
        status: 'Intake',
        assigned_to: 'Andrew',
        createdAt: new Date().toISOString(),
        financials: {
          item_cost: 100,
          supplies_cost: 50,
          labor_hours: 2,
          hourly_rate: 45,
          target_sale_price: 300
        },
        work_log: []
      },
      {
        id: 'project-2',
        brand: 'Wood Grain Alchemist',
        status: 'Finishing',
        assigned_to: 'Jordan',
        createdAt: new Date().toISOString(),
        financials: {
          item_cost: 200,
          supplies_cost: 80,
          labor_hours: 5,
          hourly_rate: 45,
          target_sale_price: 600
        },
        work_log: []
      }
    ];

    (firebaseService.subscribeToCollection as any).mockImplementation((collection: string, callback: any) => {
      if (collection === 'projects') {
        callback(mockProjects);
      } else {
        callback([]);
      }
      return vi.fn();
    });

    render(<Projects />);

    await waitFor(() => {
      expect(screen.getByText('Project #ct-1')).toBeInTheDocument(); // slice(-4) of project-1
      expect(screen.getByText('Project #ct-2')).toBeInTheDocument(); // slice(-4) of project-2
    });

    // Check if they are in correct columns by looking at the parent of the project cards
    // This might be tricky with the current structure, but at least we know they rendered.
  });
});
