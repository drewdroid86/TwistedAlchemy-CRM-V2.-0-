/**
 * Firebase Firestore Service
 * Handles all CRUD operations and real-time subscriptions for the application.
 * Includes error handling and standardized data transformation.
 */
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  Timestamp,
  DocumentData,
  QueryConstraint,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
export { db };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: Record<string, unknown>;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      // We'll fill this in the component layer where auth is available
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const subscribeToCollection = <T extends DocumentData>(
  path: string, 
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = []
) => {
  const q = query(collection(db, path), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const createDocument = async <T extends DocumentData>(path: string, data: T) => {
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: data.createdAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt ?? new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateDocument = async <T extends DocumentData>(path: string, id: string, data: Partial<T>) => {
  try {
    const docRef = doc(db, path, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
  }
};

export const deleteDocument = async (path: string, id: string) => {
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
};

export const updateArrayField = async (
  path: string,
  id: string,
  field: string,
  value: unknown,
  action: 'add' | 'remove'
) => {
  try {
    const docRef = doc(db, path, id);
    await updateDoc(docRef, {
      [field]: action === 'add' ? arrayUnion(value) : arrayRemove(value),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
  }
};
