import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateArrayField } from '../firebaseService';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Mock the firebase/firestore module
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    doc: vi.fn(),
    updateDoc: vi.fn(),
    arrayUnion: vi.fn((val) => `arrayUnion(${val})`),
    arrayRemove: vi.fn((val) => `arrayRemove(${val})`),
    getFirestore: vi.fn(),
  };
});

// Mock the firebase configuration module
vi.mock('../../firebase', () => ({
  db: {}
}));

describe('firebaseService', () => {
  describe('updateArrayField', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call updateDoc with arrayUnion when action is add', async () => {
      const mockDocRef = { id: 'test-id' };
      (doc as any).mockReturnValue(mockDocRef);

      await updateArrayField('testPath', 'test-id', 'testField', 'testValue', 'add');

      // Verify doc() was called correctly
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'testPath', 'test-id');

      // Verify arrayUnion was called correctly
      expect(arrayUnion).toHaveBeenCalledWith('testValue');

      // Verify updateDoc was called with the correct object
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
        testField: 'arrayUnion(testValue)',
        updatedAt: expect.any(String) // Verify updatedAt is a valid ISO string
      });
    });

    it('should call updateDoc with arrayRemove when action is remove', async () => {
      const mockDocRef = { id: 'test-id' };
      (doc as any).mockReturnValue(mockDocRef);

      await updateArrayField('testPath', 'test-id', 'testField', 'testValue', 'remove');

      // Verify doc() was called correctly
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'testPath', 'test-id');

      // Verify arrayRemove was called correctly
      expect(arrayRemove).toHaveBeenCalledWith('testValue');

      // Verify updateDoc was called with the correct object
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
        testField: 'arrayRemove(testValue)',
        updatedAt: expect.any(String) // Verify updatedAt is a valid ISO string
      });
    });

    it('should log and throw error when updateDoc fails', async () => {
      const mockDocRef = { id: 'test-id' };
      (doc as any).mockReturnValue(mockDocRef);

      const mockError = new Error('Test Error');
      (updateDoc as any).mockRejectedValue(mockError);

      // Mock console.error to prevent it from cluttering test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(updateArrayField('testPath', 'test-id', 'testField', 'testValue', 'add'))
        .rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
