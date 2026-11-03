import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Fabric } from '../data/fabrics';

interface CompareContextValue {
  compareList: Fabric[];
  addToCompare: (fabric: Fabric) => boolean;
  removeFromCompare: (fabricId: string) => void;
  isInCompare: (fabricId: string) => boolean;
  clearCompare: () => void;
  maxCompareReached: boolean;
  compareError: string | null;
  clearCompareError: () => void;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

const COMPARE_STORAGE_KEY = 'jojo_fabric_compare';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Fabric[]>(() => {
    try {
      const stored = sessionStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        return (JSON.parse(stored) as Fabric[]).slice(0, 3);
      }
    } catch {
      // ignore JSON parse errors
    }
    return [];
  });

  const [compareError, setCompareError] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareList));
    } catch {
      // ignore storage error
    }
  }, [compareList]);

  const isInCompare = (fabricId: string): boolean => {
    return compareList.some((f) => f.id === fabricId);
  };

  const addToCompare = (fabric: Fabric): boolean => {
    if (isInCompare(fabric.id)) {
      removeFromCompare(fabric.id);
      return false;
    }

    if (compareList.length >= 3) {
      setCompareError('You can compare a maximum of 3 fabrics side by side.');
      setTimeout(() => setCompareError(null), 3500);
      return false;
    }

    setCompareError(null);
    setCompareList((prev) => [...prev, fabric]);
    return true;
  };

  const removeFromCompare = (fabricId: string) => {
    setCompareList((prev) => prev.filter((f) => f.id !== fabricId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const clearCompareError = () => {
    setCompareError(null);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        maxCompareReached: compareList.length >= 3,
        compareError,
        clearCompareError,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
