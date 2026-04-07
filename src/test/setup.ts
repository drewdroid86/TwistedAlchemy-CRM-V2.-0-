import { vi } from 'vitest';

// Mock Firebase services
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    onAuthStateChanged: vi.fn((callback) => callback({ uid: 'test-user' })), // Simulate a logged-in user
  })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}));

// Mock firebase.ts to control the instances used in tests
vi.mock('../firebase', () => ({
  db: vi.fn(),
  auth: {
    currentUser: {
      uid: 'test-user-id',
    },
  },
  storage: vi.fn(),
}));
