import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Projects from './Projects';
import * as firebaseService from '../services/firebaseService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the entire firebase service module
vi.mock('../services/firebaseService', () => ({
  subscribeToCollection: vi.fn(),
  updateArrayField: vi.fn(),
  updateDocument: vi.fn(),
  createDocument: vi.fn(),
  deleteDocument: vi.fn()
}));

// Mock ImageUpload so we don't need real Firebase storage logic
vi.mock('../components/ImageUpload', () => ({
  default: ({ onUpload, label }: any) => (
    <button onClick={() => onUpload('http://fake-url.com/image.png')}>
      {label} - Mocked
    </button>
  )
}));

describe('Projects Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error toast when addProjectImage fails', async () => {
    // Setup fake initial project data
    const mockProjects = [
      {
        id: 'proj-1',
        title: 'Project Title',
        status: 'Intake',
        brand: 'Twisted Twig',
        images: [],
        assigned_to: 'User',
        work_log: [],
        financials: {
            actual_sale_price: 100,
            target_sale_price: 120
        }
      }
    ];

    // Mock subscribeToCollection to immediately call the callback with our mock projects
    (firebaseService.subscribeToCollection as any).mockImplementation((path: string, callback: any) => {
      if (path === 'projects') {
        callback(mockProjects);
      }
      return vi.fn(); // Return an unsubscribe function
    });

    // Make updateArrayField throw an error to test the catch block
    (firebaseService.updateArrayField as any).mockRejectedValue(new Error('Firebase error'));

    render(<Projects />);

    const projectElement = await screen.findByText(/Project #/i);
    await userEvent.click(projectElement);

    // Look for the mock upload button that triggers onUpload -> addProjectImage
    const uploadBtn = await screen.findByText('Add Photo - Mocked');

    // Click it. This calls updateArrayField, which throws, triggering the catch block.
    await userEvent.click(uploadBtn);

    // Verify the error toast appears
    await waitFor(() => {
      expect(screen.getByText('Failed to add image.')).toBeInTheDocument();
    });
  });
});
