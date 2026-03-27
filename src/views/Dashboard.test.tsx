import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Dashboard from './Dashboard';
import * as firebaseService from '../services/firebaseService';

// Mock lucide-react to avoid SVGs cluttering snapshots/DOM
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="icon-trending-up" />,
  Clock: () => <div data-testid="icon-clock" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  DollarSign: () => <div data-testid="icon-dollar" />,
  Hammer: () => <div data-testid="icon-hammer" />,
  Package: () => <div data-testid="icon-package" />,
  ChevronRight: () => <div data-testid="icon-chevron" />,
  MessageSquare: () => <div data-testid="icon-message" />,
  Send: () => <div data-testid="icon-send" />,
  Trash2: () => <div data-testid="icon-trash" />
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      // Keep only specific DOM props, discard animation props
      const { initial, animate, exit, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    }
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock Firebase service
vi.mock('../services/firebaseService', () => ({
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

// Mock Auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      displayName: 'Test User',
      email: 'test@example.com'
    }
  }
}));

describe('Dashboard Component', () => {
  const mockProjects = [
    {
      id: 'proj1',
      status: 'Intake',
      brand: 'Twisted Twig',
      assigned_to: 'John Doe',
      financials: { target_sale_price: 1000, actual_sale_price: 0 }
    },
    {
      id: 'proj2',
      status: 'Complete',
      brand: 'Twisted Alchemy',
      assigned_to: 'Jane Doe',
      financials: { target_sale_price: 2000, actual_sale_price: 2500 }
    }
  ];

  const mockInventory = [
    { id: 'inv1', name: 'Oak Wood', quantity: 2, type: 'Raw Material', owner: 'Shop', location: 'Rack A' },
    { id: 'inv2', name: 'Screws', quantity: 100, type: 'Hardware', owner: 'Shop', location: 'Bin 1' }
  ];

  const mockNotes = [
    { id: 'note1', text: 'Clean the shop', author: 'Manager', createdAt: new Date().toISOString() }
  ];

  let subscribeProjectsCallback: any;
  let subscribeInventoryCallback: any;
  let subscribeNotesCallback: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock subscribeToCollection to capture callbacks and simulate data updates
    (firebaseService.subscribeToCollection as any).mockImplementation((collectionName: string, callback: any) => {
      if (collectionName === 'projects') {
        subscribeProjectsCallback = callback;
        // initial call
        callback(mockProjects);
      } else if (collectionName === 'inventory') {
        subscribeInventoryCallback = callback;
        // initial call
        callback(mockInventory);
      } else if (collectionName === 'shop_notes') {
        subscribeNotesCallback = callback;
        // initial call
        callback(mockNotes);
      }
      return vi.fn(); // unsubscribe function
    });
  });

  it('renders dashboard with correct stats based on mocked data', async () => {
    render(<Dashboard />);

    // Check Active Projects count (total 2 - 1 complete = 1)
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);

    // Check WIP Value (proj1 target_sale_price = 1000)
    expect(screen.getByText('WIP Value')).toBeInTheDocument();
    expect(screen.getAllByText('$1,000').length).toBeGreaterThan(0);

    // Check Total Revenue (proj2 actual_sale_price = 2500)
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$2,500')).toBeInTheDocument();

    // Check Low Stock Items (inv1 quantity = 2, inv2 quantity = 100 -> 1 low stock item)
    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();

    expect(screen.getByText('Active Work Orders')).toBeInTheDocument();
    expect(screen.getByText('Project #roj1')).toBeInTheDocument();

    // Low stock item name
    expect(screen.getByText('Inventory Alerts')).toBeInTheDocument();
    expect(screen.getByText('Oak Wood')).toBeInTheDocument();
  });

  it('handles posting a new shop note', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const input = screen.getByPlaceholderText('Jot down a quick note...');

    await user.type(input, 'New test note');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(firebaseService.createDocument).toHaveBeenCalledWith('shop_notes', expect.objectContaining({
        text: 'New test note',
        author: 'Test User'
      }));
    });
  });

  it('handles deleting a shop note', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // We have note1 in the document
    expect(screen.getByText('Clean the shop')).toBeInTheDocument();

    // Find the delete button
    // The button has absolute positioning and trash icon
    // It's the only button other than "Send" and "View Board"
    // But since note deletion buttons might be multiple, we find by some attribute
    // Actually, userEvent.click(button)
    // We can just find the button by querySelector inside the note or use a test id if we added one.
    // Since we didn't add test id, we can find it via aria-label or just by getting the first trash button.
    const trashIcon = screen.getByTestId('icon-trash');
    const deleteBtn = trashIcon.closest('button');

    if (deleteBtn) {
      await user.click(deleteBtn);
    }

    await waitFor(() => {
      expect(firebaseService.deleteDocument).toHaveBeenCalledWith('shop_notes', 'note1');
    });
  });
});
