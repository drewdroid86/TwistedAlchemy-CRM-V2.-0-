import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processReceiptImage } from './receiptService';

// Define the mock function hoisted so it can be used inside vi.mock
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY',
    },
  };
});

describe('receiptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully process a receipt image', async () => {
    const mockData = {
      vendor: 'Test Vendor',
      date: '2023-01-01',
      total: 100,
      line_items: [{ description: 'Item 1', amount: 100 }]
    };
    const mockResponse = {
      text: JSON.stringify(mockData)
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await processReceiptImage('base64data');

    expect(result).toEqual(mockData);
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should handle markdown blocks in the response', async () => {
    const mockData = {
      vendor: 'Markdown Store',
      date: '2023-01-02',
      total: 50,
      line_items: []
    };
    const mockResponse = {
      text: `\`\`\`json\n${JSON.stringify(mockData)}\n\`\`\``
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await processReceiptImage('base64data');

    expect(result).toEqual(mockData);
  });

  it('should handle missing text in response by returning empty object', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' });

    const result = await processReceiptImage('base64data');

    expect(result).toEqual({});
  });

  it('should throw an error and log it when AI processing fails', async () => {
    // Spy on console.error to verify it's called
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('AI processing failed');
    mockGenerateContent.mockRejectedValue(error);

    await expect(processReceiptImage('base64data')).rejects.toThrow('Failed to process receipt image.');

    expect(consoleSpy).toHaveBeenCalledWith('Error processing receipt image:', error);

    consoleSpy.mockRestore();
  });
});
