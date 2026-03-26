import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  updateArrayField,
  OperationType,
  FirestoreErrorInfo
} from './firebaseService';
import * as firestore from 'firebase/firestore';

// Mock the whole firebase/firestore module
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
  };
});

// Mock the local firebase app config
vi.mock('../firebase', () => ({
  db: {}
}));

describe('firebaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Silence console.error for expected errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDocument', () => {
    it('should create a document and return its ID', async () => {
      const mockId = 'test-doc-id';
      const mockData = { name: 'Test' };

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.addDoc).mockResolvedValue({ id: mockId } as any);

      const result = await createDocument('test-collection', mockData);

      expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'test-collection');
      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockData,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        })
      );
      expect(result).toBe(mockId);
    });

    it('should throw handled error on failure', async () => {
      const errorMessage = 'Network error';
      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.addDoc).mockRejectedValue(new Error(errorMessage));

      await expect(createDocument('test-collection', { name: 'Test' }))
        .rejects.toThrow();

      expect(console.error).toHaveBeenCalled();
      const consoleErrorCall = vi.mocked(console.error).mock.calls[0][1];
      const parsedError: FirestoreErrorInfo = JSON.parse(consoleErrorCall);
      expect(parsedError.error).toBe(errorMessage);
      expect(parsedError.operationType).toBe(OperationType.CREATE);
      expect(parsedError.path).toBe('test-collection');
    });
  });

  describe('updateDocument', () => {
    it('should update a document successfully', async () => {
      const mockId = 'test-doc-id';
      const mockData = { name: 'Updated Test' };

      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

      await updateDocument('test-collection', mockId, mockData);

      expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'test-collection', mockId);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockData,
          updatedAt: expect.any(String)
        })
      );
    });

    it('should throw handled error on failure', async () => {
      const mockId = 'test-doc-id';
      const errorMessage = 'Permission denied';

      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.updateDoc).mockRejectedValue(new Error(errorMessage));

      await expect(updateDocument('test-collection', mockId, { name: 'Updated Test' }))
        .rejects.toThrow();

      expect(console.error).toHaveBeenCalled();
      const consoleErrorCall = vi.mocked(console.error).mock.calls[0][1];
      const parsedError: FirestoreErrorInfo = JSON.parse(consoleErrorCall);
      expect(parsedError.error).toBe(errorMessage);
      expect(parsedError.operationType).toBe(OperationType.UPDATE);
      expect(parsedError.path).toBe(`test-collection/${mockId}`);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const mockId = 'test-doc-id';

      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined);

      await deleteDocument('test-collection', mockId);

      expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'test-collection', mockId);
      expect(firestore.deleteDoc).toHaveBeenCalledWith(expect.anything());
    });

    it('should throw handled error on failure', async () => {
      const mockId = 'test-doc-id';
      const errorMessage = 'Not found';

      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.deleteDoc).mockRejectedValue(new Error(errorMessage));

      await expect(deleteDocument('test-collection', mockId))
        .rejects.toThrow();

      expect(console.error).toHaveBeenCalled();
      const consoleErrorCall = vi.mocked(console.error).mock.calls[0][1];
      const parsedError: FirestoreErrorInfo = JSON.parse(consoleErrorCall);
      expect(parsedError.error).toBe(errorMessage);
      expect(parsedError.operationType).toBe(OperationType.DELETE);
      expect(parsedError.path).toBe(`test-collection/${mockId}`);
    });
  });

  describe('subscribeToCollection', () => {
    it('should successfully subscribe and return data', () => {
      const mockData = [
        { id: '1', data: () => ({ name: 'Doc 1' }) },
        { id: '2', data: () => ({ name: 'Doc 2' }) }
      ];
      const callback = vi.fn();

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);

      // Mock onSnapshot to immediately call the success callback with our mock data
      vi.mocked(firestore.onSnapshot).mockImplementation((query: any, onNext: any, onError?: any): any => {
        onNext({ docs: mockData });
        return vi.fn(); // Return unsubscribe function
      });

      const unsubscribe = subscribeToCollection('test-collection', callback);

      expect(firestore.collection).toHaveBeenCalledWith(expect.anything(), 'test-collection');
      expect(firestore.query).toHaveBeenCalled();
      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith([
        { id: '1', name: 'Doc 1' },
        { id: '2', name: 'Doc 2' }
      ]);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle subscription errors', () => {
      const callback = vi.fn();
      const errorMessage = 'Failed to subscribe';

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);

      // Mock onSnapshot to immediately call the error callback
      vi.mocked(firestore.onSnapshot).mockImplementation((query: any, onNext: any, onError?: any): any => {
        // Fire the error callback instead
        if (onError) onError(new Error(errorMessage));
        return vi.fn();
      });

      expect(() => {
        subscribeToCollection('test-collection', callback);
      }).toThrow();

      expect(console.error).toHaveBeenCalled();
      const consoleErrorCall = vi.mocked(console.error).mock.calls[0][1];
      const parsedError: FirestoreErrorInfo = JSON.parse(consoleErrorCall);
      expect(parsedError.error).toBe(errorMessage);
      expect(parsedError.operationType).toBe(OperationType.LIST);
      expect(parsedError.path).toBe('test-collection');
    });
  });

  describe('updateArrayField', () => {
    it('should add to an array field successfully', async () => {
      const mockId = 'test-doc-id';
      const mockValue = 'new-item';

      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.arrayUnion).mockReturnValue('array-union-value' as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

      await updateArrayField('test-collection', mockId, 'items', mockValue, 'add');

      expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'test-collection', mockId);
      expect(firestore.arrayUnion).toHaveBeenCalledWith(mockValue);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          items: 'array-union-value',
          updatedAt: expect.any(String)
        })
      );
    });

    it('should remove from an array field successfully', async () => {
      const mockId = 'test-doc-id';
      const mockValue = 'old-item';

      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.arrayRemove).mockReturnValue('array-remove-value' as any);
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

      await updateArrayField('test-collection', mockId, 'items', mockValue, 'remove');

      expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'test-collection', mockId);
      expect(firestore.arrayRemove).toHaveBeenCalledWith(mockValue);
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          items: 'array-remove-value',
          updatedAt: expect.any(String)
        })
      );
    });

    it('should throw handled error on failure', async () => {
      const mockId = 'test-doc-id';
      const errorMessage = 'Array update failed';

      vi.mocked(firestore.doc).mockReturnValue({} as any);
      vi.mocked(firestore.updateDoc).mockRejectedValue(new Error(errorMessage));

      await expect(updateArrayField('test-collection', mockId, 'items', 'val', 'add'))
        .rejects.toThrow();

      expect(console.error).toHaveBeenCalled();
      const consoleErrorCall = vi.mocked(console.error).mock.calls[0][1];
      const parsedError: FirestoreErrorInfo = JSON.parse(consoleErrorCall);
      expect(parsedError.error).toBe(errorMessage);
      expect(parsedError.operationType).toBe(OperationType.UPDATE);
      expect(parsedError.path).toBe(`test-collection/${mockId}`);
    });
  });
});
