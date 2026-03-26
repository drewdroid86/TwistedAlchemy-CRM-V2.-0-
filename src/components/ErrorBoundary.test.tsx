import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ message, shouldThrow = true }: { message: string, shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Safe Content</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error in tests since we expect errors to be thrown and caught
  let originalConsoleError: typeof console.error;
  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-content">Child Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('renders fallback UI when an error is thrown', () => {
    const errorMsg = 'Test error message';

    // We expect ErrorBoundary to show 'An unexpected error occurred.' by default if parsing JSON fails and error is not standard?
    // Let's check ErrorBoundary logic:
    // try {
    //   const parsed = JSON.parse(this.state.error?.message || '');
    //   if (parsed.error) errorMessage = parsed.error;
    // } catch (e) {
    //   errorMessage = this.state.error?.message || errorMessage;
    // }

    // So 'Test error message' should be displayed.

    render(
      <ErrorBoundary>
        <ThrowError message={errorMsg} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });

  it('parses JSON error messages correctly', () => {
    const jsonError = JSON.stringify({ error: 'Parsed JSON Error' });
    render(
      <ErrorBoundary>
        <ThrowError message={jsonError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Parsed JSON Error')).toBeInTheDocument();
  });

  it('falls back to default error message if error has no message', () => {
    const ThrowEmptyError = () => {
      // Throw an error object with empty message, or just throw anything
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('renders a reload button that calls window.location.reload', async () => {
    // Mock window.location.reload without redefining location property directly
    // since jsdom makes location non-configurable.
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { ...originalLocation, reload: vi.fn() };

    render(
      <ErrorBoundary>
        <ThrowError message="Error" />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Application');
    expect(reloadButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalled();

    // Restore window.location
    // @ts-ignore
    window.location = originalLocation;
  });
});