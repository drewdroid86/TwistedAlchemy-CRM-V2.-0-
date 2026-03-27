import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock matchMedia which is often needed by UI libraries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock firebase
vi.mock('./firebase', () => ({
  auth: {
    currentUser: null
  }
}));

// Mock firebase auth module
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';

vi.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: class {},
  };
});

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div>BarChart</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  PieChart: () => <div>PieChart</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
}));

import App from './App';

describe('App', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup onAuthStateChanged to immediately call callback with null (no user logged in)
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(null as any);
      return vi.fn(); // Return unsubscribe function
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('handles login error when signInWithPopup fails', async () => {
    const user = userEvent.setup();

    // Setup signInWithPopup to reject with an error
    const testError = new Error('Test login error');
    vi.mocked(signInWithPopup).mockRejectedValueOnce(testError);

    render(<App />);

    // Wait for the loading state to finish and login screen to appear
    await waitFor(() => {
      expect(screen.getByText('Twisted Alchemy CRM')).toBeInTheDocument();
    });

    // Find and click the login button
    const loginButton = screen.getByRole('button', { name: /Sign in with Google/i });
    await user.click(loginButton);

    // Verify signInWithPopup was called
    expect(signInWithPopup).toHaveBeenCalledTimes(1);

    // Verify error was logged correctly
    expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed', testError);
  });
});
