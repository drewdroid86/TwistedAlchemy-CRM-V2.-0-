import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageUpload from './ImageUpload';
import * as firebaseStorage from 'firebase/storage';

// Mock the lucide-react icons so we don't worry about rendering them
vi.mock('lucide-react', () => ({
  Camera: () => <div data-testid="camera-icon">Camera Icon</div>,
  Upload: () => <div data-testid="upload-icon">Upload Icon</div>,
  Loader2: () => <div data-testid="loader-icon">Loader Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
}));

// Mock firebase
vi.mock('../firebase', () => ({
  storage: {},
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveTextContent('Upload Photo');
    expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
  });

  it('renders correctly with custom label', () => {
    render(<ImageUpload onUpload={vi.fn()} label="Custom Label" />);
    expect(screen.getByRole('button')).toHaveTextContent('Custom Label');
  });

  it('opens file dialog when button is clicked', () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    const button = screen.getByRole('button');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    fireEvent.click(button);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('uploads file successfully', async () => {
    const mockOnUpload = vi.fn();
    const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const mockUrl = 'https://example.com/test.png';

    // Setup mocks
    (firebaseStorage.ref as any).mockReturnValue({});
    (firebaseStorage.uploadBytes as any).mockResolvedValue({ ref: {} });
    (firebaseStorage.getDownloadURL as any).mockResolvedValue(mockUrl);

    render(<ImageUpload onUpload={mockOnUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [mockFile] } });

    // State changes to uploading
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Uploading...');
    expect(screen.getByRole('button')).toBeDisabled();

    // Wait for upload to complete
    await waitFor(() => {
      expect(firebaseStorage.ref).toHaveBeenCalled();
      expect(firebaseStorage.uploadBytes).toHaveBeenCalledWith({}, mockFile);
      expect(firebaseStorage.getDownloadURL).toHaveBeenCalled();
      expect(mockOnUpload).toHaveBeenCalledWith(mockUrl);
    });

    // State changes back
    expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Upload Photo');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('handles upload failure', async () => {
    const mockOnUpload = vi.fn();
    const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mocks to throw error
    (firebaseStorage.ref as any).mockReturnValue({});
    (firebaseStorage.uploadBytes as any).mockRejectedValue(new Error('Upload failed'));

    render(<ImageUpload onUpload={mockOnUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [mockFile] } });

    // Wait for upload to fail
    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Failed to upload image. Please try again.');
      expect(mockOnUpload).not.toHaveBeenCalled();
    });

    // State changes back
    expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Upload Photo');
    expect(screen.getByRole('button')).not.toBeDisabled();

    alertMock.mockRestore();
    consoleErrorMock.mockRestore();
  });
});
