import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import Customers from '../Customers';
import * as firebaseService from '../../services/firebaseService';
import { Customer } from '../../types';

// Mock the framer-motion library to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon" />,
  Search: () => <span data-testid="search-icon" />,
  Mail: () => <span data-testid="mail-icon" />,
  Phone: () => <span data-testid="phone-icon" />,
  History: () => <span data-testid="history-icon" />,
  User: () => <span data-testid="user-icon" />,
  X: () => <span data-testid="x-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Edit2: () => <span data-testid="edit2-icon" />,
  Trash2: () => <span data-testid="trash2-icon" />,
}));

// Mock the firebase service
vi.mock('../../services/firebaseService', () => ({
  subscribeToCollection: vi.fn(),
  createDocument: vi.fn(),
}));

const mockCustomers: Customer[] = [
  { id: '1', name: 'John Doe', contact: 'john@example.com', purchase_history: [], createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '2', name: 'Jane Smith', contact: 'jane@example.com', purchase_history: ['project1', 'project2'], createdAt: '2023-01-01', updatedAt: '2023-01-01' },
];

describe('Customers Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementation for subscribeToCollection
    vi.mocked(firebaseService.subscribeToCollection).mockImplementation((collection: string, callback: any) => {
      callback(mockCustomers);
      return vi.fn(); // Return an unsubscribe function
    });
  });

  it('renders correctly and loads customers', () => {
    render(<Customers />);

    expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
    expect(screen.getByText('Add Customer')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters customers based on search term (name)', () => {
    render(<Customers />);

    const searchInput = screen.getByPlaceholderText('Search customers...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters customers based on search term (contact)', () => {
    render(<Customers />);

    const searchInput = screen.getByPlaceholderText('Search customers...');
    fireEvent.change(searchInput, { target: { value: 'john@example.com' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('opens modal when Add Customer button is clicked', () => {
    render(<Customers />);

    const addButton = screen.getByText('Add Customer');
    fireEvent.click(addButton);

    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email or Phone')).toBeInTheDocument();
  });

  it('closes modal when X button is clicked', () => {
    render(<Customers />);

    // Open modal
    const addButton = screen.getByText('Add Customer');
    fireEvent.click(addButton);

    // Verify modal is open
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();

    // Find the close button (the button containing the X icon)
    const xIcon = screen.getByTestId('x-icon');
    const closeButton = xIcon.closest('button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    // Verify modal is closed
    expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
  });

  it('creates a new customer and closes modal', async () => {
    render(<Customers />);

    // Open modal
    const addButton = screen.getByText('Add Customer');
    fireEvent.click(addButton);

    // Fill out form
    const nameInput = screen.getByPlaceholderText('John Doe');
    const contactInput = screen.getByPlaceholderText('Email or Phone');

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(contactInput, { target: { value: 'new@example.com' } });

    // Submit form
    const saveButton = screen.getByText('Save Customer');
    fireEvent.click(saveButton);

    // Verify createDocument was called correctly
    await waitFor(() => {
      expect(firebaseService.createDocument).toHaveBeenCalledWith('customers', {
        name: 'New User',
        contact: 'new@example.com',
        purchase_history: [],
      });
    });

    // Verify modal is closed
    expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
  });
});
