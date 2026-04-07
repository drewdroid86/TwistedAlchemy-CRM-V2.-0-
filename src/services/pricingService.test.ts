import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Project } from '../types';

// Mock the @google/genai module using the 'vi.hoisted' or just avoiding variables in the mock factory
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  return {
    mockGenerateContent, // Export it so we can access it
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
    Type: {
      OBJECT: 'OBJECT',
      NUMBER: 'NUMBER',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
    },
  };
});

// Import the service AFTER the mock is defined
import { suggestProjectPrice } from './pricingService';
import * as genai from '@google/genai';

describe('pricingService - suggestProjectPrice', () => {
  const mockProject: Project = {
    id: 'test-id',
    brand: 'Twisted Twig',
    title: 'Vintage Dresser',
    description: 'A classic vintage dresser for refurbishment.',
    status: 'Intake',
    assigned_to: 'John Doe',
    financials: {
      item_cost: 100,
      supplies_cost: 50,
      labor_hours: 10,
      hourly_rate: 45,
      target_sale_price: 500,
    },
    work_log: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockGenerateContent = (genai as any).mockGenerateContent;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  it('should successfully suggest a project price', async () => {
    const mockResponse = {
      suggested_price: 550,
      price_range: '$500 - $600',
      strategy: 'Value Added',
      reasoning: 'High demand for vintage dressers.',
      margin_at_suggested: 40,
    };

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockResponse),
    });

    const result = await suggestProjectPrice(mockProject);

    expect(result).toEqual(mockResponse);
    expect(mockGenerateContent).toHaveBeenCalled();
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.model).toBe('gemini-3-flash-preview');
    expect(callArgs.contents).toContain('Twisted Twig');
    expect(callArgs.contents).toContain('Vintage Dresser');
  });

  it('should handle AI response with markdown code blocks', async () => {
    const mockResponse = {
      suggested_price: 550,
      price_range: '$500 - $600',
      strategy: 'Value Added',
      reasoning: 'High demand for vintage dressers.',
      margin_at_suggested: 40,
    };

    mockGenerateContent.mockResolvedValue({
      text: `\`\`\`json\n${JSON.stringify(mockResponse)}\n\`\`\``,
    });

    const result = await suggestProjectPrice(mockProject);

    expect(result).toEqual(mockResponse);
  });

  it('should throw an error when the AI service fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('AI Error'));

    await expect(suggestProjectPrice(mockProject)).rejects.toThrow('Failed to suggest price.');
  });
});
