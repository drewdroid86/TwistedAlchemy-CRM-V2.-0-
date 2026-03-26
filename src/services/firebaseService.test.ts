import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteDocument, OperationType } from './firebaseService';
import { deleteDoc, doc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  return {
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
  };
});

vi.mock('../firebase', () => ({
  db: {}
}));

describe('firebaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // suppress console.error for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('deleteDocument', () => {
    it('should successfully delete a document', async () => {
      vi.mocked(deleteDoc).mockResolvedValueOnce(undefined);
      vi.mocked(doc).mockReturnValue({} as any);

      const path = 'users';
      const id = 'user123';

      await expect(deleteDocument(path, id)).resolves.toBeUndefined();

      expect(doc).toHaveBeenCalledWith(expect.anything(), path, id);
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should handle errors when deleting a document', async () => {
      const mockError = new Error('Permission denied');
      vi.mocked(deleteDoc).mockRejectedValueOnce(mockError);
      vi.mocked(doc).mockReturnValue({} as any);

      const path = 'users';
      const id = 'user123';

      await expect(deleteDocument(path, id)).rejects.toThrowError(
        JSON.stringify({
          error: 'Permission denied',
          authInfo: {},
          operationType: OperationType.DELETE,
          path: `${path}/${id}`
        })
      );

      expect(doc).toHaveBeenCalledWith(expect.anything(), path, id);
      expect(deleteDoc).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Firestore Error: ',
        JSON.stringify({
          error: 'Permission denied',
          authInfo: {},
          operationType: OperationType.DELETE,
          path: `${path}/${id}`
        })
      );
    });
  });
});
