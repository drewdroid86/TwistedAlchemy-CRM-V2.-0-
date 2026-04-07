import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
} from 'firebase/firestore';
import {
  getCollection,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../services/firebaseService';
import { db } from '../firebase'; // This will be the mock from setup

// Typecasting the mocked functions to satisfy TypeScript
const getDocsMock = getDocs as vi.Mock;
const addDocMock = addDoc as vi.Mock;
const updateDocMock = updateDoc as vi.Mock;
const deleteDocMock = deleteDoc as vi.Mock;
const collectionMock = collection as vi.Mock;
const docMock = doc as vi.Mock;

describe('Firebase Service', () => {
  beforeEach(() => {
    // Clear mock history before each test
    vi.clearAllMocks();
    collectionMock.mockReturnValue({ id: 'mock-collection' });
    docMock.mockReturnValue({ id: 'mock-doc' });
  });

  // Test for fetching a collection (Read)
  describe('getCollection', () => {
    it('should fetch and return documents from a collection', async () => {
      const mockData = [{ id: '1', name: 'Test Item' }];
      getDocsMock.mockResolvedValue({
        docs: mockData.map((item) => ({ id: item.id, data: () => ({ name: item.name }) })),
      });

      const result = await getCollection('inventory');

      expect(collection).toHaveBeenCalledWith(db, 'inventory');
      expect(getDocs).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  // Test for creating a document (Create)
  describe('createDocument', () => {
    it('should add a new document to a collection', async () => {
      const newData = { name: 'New Item' };
      addDocMock.mockResolvedValue({ id: '2' });

      const result = await createDocument('inventory', newData);

      expect(collection).toHaveBeenCalledWith(db, 'inventory');
      expect(addDoc).toHaveBeenCalledWith({ id: 'mock-collection' }, newData);
      expect(result).toEqual({ id: '2' });
    });
  });

  // Test for updating a document (Update)
  describe('updateDocument', () => {
    it('should update an existing document in a collection', async () => {
      const updates = { name: 'Updated Item' };
      updateDocMock.mockResolvedValue(undefined); // updateDoc returns void on success

      await updateDocument('customers', '123', updates);

      expect(doc).toHaveBeenCalledWith(db, 'customers', '123');
      expect(updateDoc).toHaveBeenCalledWith({ id: 'mock-doc' }, updates);
    });
  });

  // Test for deleting a document (Delete)
  describe('deleteDocument', () => {
    it('should delete a document from a collection', async () => {
      deleteDocMock.mockResolvedValue(undefined); // deleteDoc returns void on success

      await deleteDocument('shop_notes', 'abc');

      expect(doc).toHaveBeenCalledWith(db, 'shop_notes', 'abc');
      expect(deleteDoc).toHaveBeenCalledWith({ id: 'mock-doc' });
    });
  });
});
