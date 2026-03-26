import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Inventory from './Inventory';
import * as firebaseService from '../services/firebaseService';

// Mock dependencies
vi.mock('../services/firebaseService', () => ({
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

vi.mock('../components/ImageUpload', () => ({
  default: function MockImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
    return (
      <button data-testid="image-upload" onClick={() => onUpload('http://example.com/image.jpg')}>
        Upload Image
      </button>
    );
  }
}));

vi.mock('lucide-react', () => {
  const React = require('react');
  return {
    Search: () => React.createElement('span', { 'data-testid': 'icon-search' }),
    Plus: () => React.createElement('span', { 'data-testid': 'icon-plus' }),
    Filter: () => React.createElement('span', { 'data-testid': 'icon-filter' }),
    MoreVertical: () => React.createElement('span', { 'data-testid': 'icon-more' }),
    Trash2: () => React.createElement('span', { 'data-testid': 'icon-trash' }),
    Edit2: () => React.createElement('span', { 'data-testid': 'icon-edit' }),
    Package: () => React.createElement('span', { 'data-testid': 'icon-package' }),
    Ruler: () => React.createElement('span', { 'data-testid': 'icon-ruler' }),
    X: () => React.createElement('span', { 'data-testid': 'icon-x' }),
    Camera: () => React.createElement('span', { 'data-testid': 'icon-camera' }),
  };
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

describe('Inventory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementation for subscribeToCollection
    (firebaseService.subscribeToCollection as any).mockImplementation((collection: string, callback: any) => {
      callback([]);
      return vi.fn(); // return unsubscribe function
    });
  });

  it('renders correctly with empty state', () => {
    render(<Inventory />);
    expect(screen.getByPlaceholderText('Search inventory...')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('fetches and renders inventory items', async () => {
    const mockItems = [
      {
        id: '1',
        owner: 'Twisted Twig',
        type: 'Furniture Piece',
        name: 'Oak Table',
        quantity: 1,
        acquisition_cost: 150,
        location: 'Shop Floor',
        current_condition: 5,
        imageUrl: 'http://example.com/oak.jpg'
      },
      {
        id: '2',
        owner: 'Wood Grain Alchemist',
        type: 'Raw Material',
        name: 'Walnut Slab',
        quantity: 10,
        acquisition_cost: 300,
        location: 'Bay 1',
      }
    ];

    (firebaseService.subscribeToCollection as any).mockImplementation((collection: string, callback: any) => {
      callback(mockItems);
      return vi.fn();
    });

    render(<Inventory />);

    await waitFor(() => {
      expect(screen.getByText('Oak Table')).toBeInTheDocument();
      expect(screen.getByText('Walnut Slab')).toBeInTheDocument();
    });

    expect(screen.getByText('Furniture Piece')).toBeInTheDocument();
    expect(screen.getByText('Raw Material')).toBeInTheDocument();

    // Check formatted cost
    expect(screen.getByText('$150')).toBeInTheDocument();
    expect(screen.getByText('$300')).toBeInTheDocument();

    // Check quantities
    expect(screen.getByText('1 Units')).toBeInTheDocument();
    expect(screen.getByText('10 BF')).toBeInTheDocument();
  });

  it('filters items by search term', async () => {
    const mockItems = [
      {
        id: '1',
        owner: 'Twisted Twig',
        type: 'Furniture Piece',
        name: 'Oak Table',
        quantity: 1,
        acquisition_cost: 150,
        location: 'Shop Floor'
      },
      {
        id: '2',
        owner: 'Wood Grain Alchemist',
        type: 'Raw Material',
        name: 'Walnut Slab',
        quantity: 10,
        acquisition_cost: 300,
        location: 'Bay 1',
      }
    ];

    (firebaseService.subscribeToCollection as any).mockImplementation((collection: string, callback: any) => {
      callback(mockItems);
      return vi.fn();
    });

    render(<Inventory />);
    await waitFor(() => {
      expect(screen.getByText('Oak Table')).toBeInTheDocument();
      expect(screen.getByText('Walnut Slab')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search inventory...');
    fireEvent.change(searchInput, { target: { value: 'Oak' } });

    expect(screen.getByText('Oak Table')).toBeInTheDocument();
    expect(screen.queryByText('Walnut Slab')).not.toBeInTheDocument();
  });

  it('filters items by brand', async () => {
    const mockItems = [
      {
        id: '1',
        owner: 'Twisted Twig',
        type: 'Furniture Piece',
        name: 'Oak Table',
        quantity: 1,
        acquisition_cost: 150,
        location: 'Shop Floor'
      },
      {
        id: '2',
        owner: 'Wood Grain Alchemist',
        type: 'Raw Material',
        name: 'Walnut Slab',
        quantity: 10,
        acquisition_cost: 300,
        location: 'Bay 1',
      }
    ];

    (firebaseService.subscribeToCollection as any).mockImplementation((collection: string, callback: any) => {
      callback(mockItems);
      return vi.fn();
    });

    render(<Inventory />);
    await waitFor(() => {
      expect(screen.getByText('Oak Table')).toBeInTheDocument();
      expect(screen.getByText('Walnut Slab')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const filterSelect = selects[0]; // Filter is the first select

    fireEvent.change(filterSelect, { target: { value: 'Twisted Twig' } });

    expect(screen.getByText('Oak Table')).toBeInTheDocument();
    expect(screen.queryByText('Walnut Slab')).not.toBeInTheDocument();

    fireEvent.change(filterSelect, { target: { value: 'Wood Grain Alchemist' } });

    expect(screen.queryByText('Oak Table')).not.toBeInTheDocument();
    expect(screen.getByText('Walnut Slab')).toBeInTheDocument();
  });

  it('creates a new item', async () => {
    render(<Inventory />);

    // Open modal
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    // Modal should be open
    expect(screen.getByText('Add Inventory Item')).toBeInTheDocument();

    // Fill the form
    const nameInput = screen.getByPlaceholderText('e.g., Victorian Oak Dresser');
    fireEvent.change(nameInput, { target: { value: 'New Test Item' } });

    // Since we mock ImageUpload, we can click its button to simulate upload
    const uploadButton = screen.getByTestId('image-upload');
    fireEvent.click(uploadButton);

    // Submit the form
    const saveButton = screen.getByText('Save Item');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(firebaseService.createDocument).toHaveBeenCalledWith('inventory', expect.objectContaining({
        owner: 'Twisted Twig',
        type: 'Furniture Piece',
        quantity: 1,
        acquisition_cost: 0,
        location: 'Shop floor',
        name: 'New Test Item',
        imageUrl: 'http://example.com/image.jpg'
      }));
    });

    // Modal should be closed
    expect(screen.queryByText('Add Inventory Item')).not.toBeInTheDocument();
  });

  it('deletes an item', async () => {
    const mockItems = [
      {
        id: '1',
        owner: 'Twisted Twig',
        type: 'Furniture Piece',
        name: 'Oak Table',
        quantity: 1,
        acquisition_cost: 150,
        location: 'Shop Floor'
      }
    ];

    (firebaseService.subscribeToCollection as any).mockImplementation((collection: string, callback: any) => {
      callback(mockItems);
      return vi.fn();
    });

    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<Inventory />);
    await waitFor(() => {
      expect(screen.getByText('Oak Table')).toBeInTheDocument();
    });

    // The trash icon is wrapped in a button
    const trashIcon = screen.getByTestId('icon-trash');
    const deleteButton = trashIcon.closest('button');
    expect(deleteButton).not.toBeNull();

    fireEvent.click(deleteButton!);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this item?');
    expect(firebaseService.deleteDocument).toHaveBeenCalledWith('inventory', '1');

    confirmSpy.mockRestore();
  });
});
