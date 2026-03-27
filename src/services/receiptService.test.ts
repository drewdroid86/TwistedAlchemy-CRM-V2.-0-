import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processReceiptImage } from './receiptService';

// Mock the GoogleGenAI library
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: (...args: any[]) => mockGenerateContent(...args),
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

  describe('processReceiptImage', () => {
    it('should successfully parse a receipt image and return the data', async () => {
      // Arrange
      const mockResponseData = {
        vendor: 'Wood Depot',
        date: '2023-10-27',
        total_amount: 150.5,
        items: [
          {
            description: 'Plywood',
            quantity: 2,
            unit_price: 50.0,
          },
          {
            description: 'Screws',
            quantity: 1,
            unit_price: 50.5,
          },
        ],
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockResponseData),
      });

      const base64Image = 'mock-base64-image-data';

      // Act
      const result = await processReceiptImage(base64Image);

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                text: expect.any(String),
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        config: expect.any(Object),
      });

      expect(result).toEqual(mockResponseData);
    });

    it('should throw an error if the API call fails', async () => {
      // Arrange
      const mockError = new Error('API Rate Limit Exceeded');
      mockGenerateContent.mockRejectedValueOnce(mockError);

      const base64Image = 'mock-base64-image-data';

      // Act & Assert
      await expect(processReceiptImage(base64Image)).rejects.toThrow('API Rate Limit Exceeded');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the returned text is not valid JSON', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValueOnce({
        text: 'This is not valid JSON',
      });

      const base64Image = 'mock-base64-image-data';

      // Act & Assert
      await expect(processReceiptImage(base64Image)).rejects.toThrow(SyntaxError);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
  });
});
