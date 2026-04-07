import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Help from './Help';

import { GoogleGenAI } from '@google/genai';

vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
    // Expose the mock so we can access it in our tests
    __mockGenerateContent: mockGenerateContent,
  };
});

// @ts-ignore
const mockGenerateContent = (await import('@google/genai')).__mockGenerateContent;

describe('Help Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a question and displays the AI response successfully', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'This is a mocked AI response.',
    });

    render(<Help />);

    const input = screen.getByPlaceholderText('e.g. How do I track board-foot costs?');
    const askButton = screen.getByRole('button', { name: /ask/i });

    await userEvent.type(input, 'How do I add a new project?');
    fireEvent.click(askButton);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3-flash-preview',
        contents: expect.stringContaining('How do I add a new project?'),
      })
    );

    await waitFor(() => {
      expect(screen.getByText('This is a mocked AI response.')).toBeInTheDocument();
    });
  });

  it('displays a fallback message when the AI response has no text', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: '', // Empty response
    });

    render(<Help />);

    const input = screen.getByPlaceholderText('e.g. How do I track board-foot costs?');
    const askButton = screen.getByRole('button', { name: /ask/i });

    await userEvent.type(input, 'Some empty query');
    fireEvent.click(askButton);

    await waitFor(() => {
      expect(screen.getByText("I'm sorry, I couldn't find an answer to that.")).toBeInTheDocument();
    });
  });

  it('handles an error from the AI model gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGenerateContent.mockRejectedValueOnce(new Error('API failure'));

    render(<Help />);

    const input = screen.getByPlaceholderText('e.g. How do I track board-foot costs?');
    const askButton = screen.getByRole('button', { name: /ask/i });

    await userEvent.type(input, 'This will fail');
    fireEvent.click(askButton);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error asking Gemini:', expect.any(Error));

    // Check that button is re-enabled and "Ask" is visible instead of the spinner.
    // The disabled attribute should be removed when setIsAsking(false) is called in finally block.
    expect(askButton).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });
});
