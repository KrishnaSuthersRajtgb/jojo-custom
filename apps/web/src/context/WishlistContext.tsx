import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { wishlistService, type WishlistItem } from '../services/wishlistService';

export type { WishlistItem };

export interface WishlistContextValue {
  wishlist: WishlistItem[];
  addToWishlist: (fabric: {
    fabricId: string;
    fabricName: string;
    tone?: string;
    hex?: string;
    pricePerMeter?: number;
  }) => Promise<void>;
  removeFromWishlist: (fabricId: string) => Promise<void>;
  toggleWishlist: (fabric: {
    fabricId: string;
    fabricName: string;
    tone?: string;
    hex?: string;
    pricePerMeter?: number;
  }) => Promise<void>;
  isWishlisted: (fabricId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

function storageKeyFor(userKey: string) {
  return `jojo_wishlist_${userKey}`;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userKey = user?.username ?? 'guest';

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Immediately read from localStorage cache so UI doesn't flicker
    const raw = localStorage.getItem(storageKeyFor(userKey));
    if (raw) {
      try {
        setWishlist(JSON.parse(raw) as WishlistItem[]);
      } catch {
        // ignore parse error
      }
    } else {
      setWishlist([]);
    }

    // 2. Fetch latest wishlist from backend if user is logged in
    if (user) {
      setLoading(true);
      wishlistService
        .getWishlist()
        .then((items) => {
          setWishlist(items);
          localStorage.setItem(storageKeyFor(userKey), JSON.stringify(items));
        })
        .catch(() => {
          // If offline or network error, keep local cache
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userKey, user]);

  const persist = (next: WishlistItem[]) => {
    setWishlist(next);
    localStorage.setItem(storageKeyFor(userKey), JSON.stringify(next));
  };

  const addToWishlist = async (fabric: {
    fabricId: string;
    fabricName: string;
    tone?: string;
    hex?: string;
    pricePerMeter?: number;
  }) => {
    const existing = wishlist.some((item) => item.fabricId === fabric.fabricId);
    if (!existing) {
      const newItem: WishlistItem = {
        fabricId: fabric.fabricId,
        fabricName: fabric.fabricName,
        tone: fabric.tone ?? 'warm',
        hex: fabric.hex ?? '#5C1A32',
        pricePerMeter: fabric.pricePerMeter ?? 0,
        addedAt: new Date().toISOString(),
      };
      const updated = [...wishlist, newItem];
      persist(updated);
    }

    if (user) {
      try {
        const items = await wishlistService.addItem(fabric);
        persist(items);
      } catch (err) {
        console.error('Failed to sync added wishlist item:', err);
      }
    }
  };

  const removeFromWishlist = async (fabricId: string) => {
    const updated = wishlist.filter((item) => item.fabricId !== fabricId);
    persist(updated);

    if (user) {
      try {
        const items = await wishlistService.removeItem(fabricId);
        persist(items);
      } catch (err) {
        console.error('Failed to sync removed wishlist item:', err);
      }
    }
  };

  const isWishlisted = (fabricId: string): boolean => {
    return wishlist.some((item) => item.fabricId === fabricId);
  };

  const toggleWishlist = async (fabric: {
    fabricId: string;
    fabricName: string;
    tone?: string;
    hex?: string;
    pricePerMeter?: number;
  }) => {
    if (isWishlisted(fabric.fabricId)) {
      await removeFromWishlist(fabric.fabricId);
    } else {
      await addToWishlist(fabric);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isWishlisted,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
