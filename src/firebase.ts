import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "twisted-alchemy-crmv2",
  appId: "1:274602059008:web:f7541c3cdc8034fe987fe5",
  apiKey: "AIzaSyD0_OghgrZB1RAf9sO8LB0ffHgFsz0zdrg",
  authDomain: "twisted-alchemy-crmv2.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-f53215b3-e27d-4386-8f78-5dc1f2dd30d6",
  storageBucket: "twisted-alchemy-crmv2.firebasestorage.app",
  messagingSenderId: "274602059008",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
