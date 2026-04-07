import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../views/Dashboard';
import * as firebaseService from '../services/firebaseService';

// Mock the firebaseService
vi.mock('../services/firebaseService');

const getCollectionMock = firebaseService.getCollection as vi.Mock;

describe('Dashboard View', () => {
  it('should render loading state initially', () => {
    // Mock a pending promise
    getCollectionMock.mockReturnValue(new Promise(() => {}));
    render(<Dashboard />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('should render dashboard data after successful fetching', async () => {
    const mockProjects = [{ id: 'p1', title: 'Custom Dresser', status: 'Finishing' }];
    const mockInventory = [{ id: 'i1', name: 'Oak Wood', quantity: 100 }];
    const mockCustomers = [{ id: 'c1', name: 'John Doe' }];

    // Set up different mock resolutions for each call
    getCollectionMock.mockResolvedValueOnce(mockProjects); // First call for projects
    getCollectionMock.mockResolvedValueOnce(mockInventory); // Second call for inventory
    getCollectionMock.mockResolvedValueOnce(mockCustomers); // Third call for customers

    render(<Dashboard />);

    // Wait for the data to be loaded and displayed
    await waitFor(() => {
      // Check for project data
      expect(screen.getByText('Custom Dresser')).toBeInTheDocument();
      // Check for inventory data
      expect(screen.getByText('Oak Wood')).toBeInTheDocument();
      // Check for customer data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify that getCollection was called for each data type
    expect(getCollectionMock).toHaveBeenCalledWith('projects');
    expect(getCollectionMock).toHaveBeenCalledWith('inventory');
    expect(getCollectionMock).toHaveBeenCalledWith('customers');
  });

  it('should render an error message if data fetching fails', async () => {
    // Mock a rejected promise
    getCollectionMock.mockRejectedValue(new Error('Failed to fetch data'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    });
  });
});
