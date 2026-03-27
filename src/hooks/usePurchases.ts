import { useState, useEffect } from 'react';
import { Purchase } from '../types';
import {
  subscribeToCollection,
  createDocument,
  updateDocument,
  deleteDocument
} from '../services/firebaseService';

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToCollection<Purchase>('purchases', (data) => {
        setPurchases(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchases');
      setLoading(false);
    }
  }, []);

  const addPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    return await createDocument('purchases', purchase);
  };

  const editPurchase = async (id: string, purchase: Partial<Purchase>) => {
    await updateDocument('purchases', id, purchase);
  };

  const removePurchase = async (id: string) => {
    await deleteDocument('purchases', id);
  };

  return {
    purchases,
    loading,
    error,
    addPurchase,
    editPurchase,
    removePurchase
  };
};
