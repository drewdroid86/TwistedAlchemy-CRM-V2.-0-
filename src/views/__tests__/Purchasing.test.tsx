import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Purchasing from '../Purchasing';
import { processReceiptImage } from '../../services/receiptService';

// Mock dependencies
vi.mock('../../services/receiptService', () => ({
  processReceiptImage: vi.fn(),
}));

vi.mock('../../services/firebaseService', () => ({
  subscribeToCollection: vi.fn((collection, callback) => {
    callback([]);
    return vi.fn();
  }),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

describe('Purchasing Component', () => {
  let originalFileReader: any;
  let alertMock: any;
  let consoleErrorMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFileReader = window.FileReader;
    alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    window.FileReader = originalFileReader;
    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  it('handles synchronous errors during file reading (outer catch block)', async () => {
    const mockError = new Error('FileReader sync error');

    // Mock FileReader to throw immediately on readAsDataURL
    class MockFileReader {
      readAsDataURL() {
        throw mockError;
      }
    }
    window.FileReader = MockFileReader as any;

    render(<Purchasing />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['dummy content'], 'receipt.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalledWith('Error processing receipt:', mockError);
      expect(alertMock).toHaveBeenCalledWith('Failed to process receipt. Please enter details manually.');

      // Ensure "Processing..." state is removed
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      expect(screen.getByText('Snap Receipt')).toBeInTheDocument();
    });
  });

  // Adding test for the processReceiptImage throwing an error to complete the test coverage for receipt processing error cases.
  // We need to fix the implementation to properly catch the inner async error, so I'll write a test for the expected behavior first.
  it('handles asynchronous errors during processReceiptImage (inner async error)', async () => {
    const mockError = new Error('Failed to process image via API');
    vi.mocked(processReceiptImage).mockRejectedValue(mockError);

    render(<Purchasing />);

    // Mock FileReader to trigger onloadend immediately
    class MockFileReader {
      onloadend: () => void = () => {};
      result = 'data:image/png;base64,dummy-base64-string';
      readAsDataURL() {
        setTimeout(() => this.onloadend(), 0);
      }
    }
    window.FileReader = MockFileReader as any;

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const file = new File(['dummy content'], 'receipt.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalledWith('Error processing receipt:', mockError);
      expect(alertMock).toHaveBeenCalledWith('Failed to process receipt. Please enter details manually.');
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      expect(screen.getByText('Snap Receipt')).toBeInTheDocument();
    });
  });
});
