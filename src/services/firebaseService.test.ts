import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteDocument, OperationType } from './firebaseService';
import { deleteDoc, doc } from 'firebase/firestore';

// Mock the firebase/firestore module
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
  };
});

// Mock the firebase module
vi.mock('../firebase', () => {
  return {
    db: {},
  };
});

describe('firebaseService - deleteDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully delete a document', async () => {
    // Setup
    const path = 'testCollection';
    const id = 'testId';
    const mockDocRef = { id: 'testId' };

    // Use `as unknown as any` to bypass typescript error with mock
    vi.mocked(doc).mockReturnValue(mockDocRef as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);

    // Execute
    await deleteDocument(path, id);

    // Assert
    expect(doc).toHaveBeenCalledWith(expect.anything(), path, id);
    expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
  });

  it('should handle and rethrow errors from deleteDoc', async () => {
    // Setup
    const path = 'testCollection';
    const id = 'testId';
    const errorMessage = 'Permission denied';
    const expectedErrorPayload = {
      error: errorMessage,
      authInfo: {}, // Mock auth info
      operationType: OperationType.DELETE,
      path: `${path}/${id}`,
    };

    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(deleteDoc).mockRejectedValue(new Error(errorMessage));

    // Execute & Assert
    try {
      await deleteDocument(path, id);
      expect.fail('Should have thrown an error');
    } catch (e: any) {
      expect(e.message).toBe('Firestore delete error');
      expect(e.info).toEqual(expectedErrorPayload);
    }
  });
});
