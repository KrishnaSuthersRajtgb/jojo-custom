import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { addressApi } from '../services';

export type AddressType = 'home' | 'work' | 'other';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  type: AddressType;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'isDefault'>;

interface AddressContextValue {
  addresses: Address[];
  defaultAddress: Address | null;
  addAddress: (input: AddressInput) => void;
  updateAddress: (id: string, input: AddressInput) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

function storageKeyFor(userKey: string) {
  return `jojo_addresses_${userKey}`;
}

export function AddressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userKey = user?.username ?? 'guest';

  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    // 1. Immediately read from localStorage cache so UI doesn't flicker
    const raw = localStorage.getItem(storageKeyFor(userKey));
    if (raw) {
      try {
        setAddresses(JSON.parse(raw) as Address[]);
      } catch {
        // ignore
      }
    }

    // 2. Fetch latest addresses from backend if user is logged in
    if (user) {
      addressApi
        .getAll()
        .then((res) => {
          setAddresses(res.data);
          localStorage.setItem(storageKeyFor(userKey), JSON.stringify(res.data));
        })
        .catch(() => {
          // If offline, keep local cache
        });
    }
  }, [userKey, user]);

  const persist = (next: Address[]) => {
    setAddresses(next);
    localStorage.setItem(storageKeyFor(userKey), JSON.stringify(next));
  };

  const addAddress = (input: AddressInput) => {
    const tempId = `addr_${Date.now().toString()}`;
    const newAddress: Address = {
      id: tempId,
      ...input,
      isDefault: addresses.length === 0,
    };
    persist([...addresses, newAddress]);

    // Sync to backend if logged in
    if (user) {
      addressApi
        .create(input)
        .then((res) => {
          if (res.data.id) {
            // Replace temporary id with backend id
            setAddresses((prev) =>
              prev.map((a) => (a.id === tempId ? { ...a, id: res.data.id } : a)),
            );
          }
        })
        .catch(() => {
          // Keep local version on failure
        });
    }
  };

  const updateAddress = (id: string, input: AddressInput) => {
    persist(addresses.map((a) => (a.id === id ? { ...a, ...input } : a)));

    if (user && !id.startsWith('addr_')) {
      addressApi.update(id, input).catch(() => {
        // Keep local version on failure
      });
    }
  };

  const deleteAddress = (id: string) => {
    persist(addresses.filter((a) => a.id !== id));

    if (user && !id.startsWith('addr_')) {
      addressApi.delete(id).catch(() => {
        // Keep local version on failure
      });
    }
  };

  const setDefaultAddress = (id: string) => {
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));

    if (user && !id.startsWith('addr_')) {
      addressApi.setDefault(id).catch(() => {
        // Keep local version on failure
      });
    }
  };

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return (
    <AddressContext.Provider
      value={{
        addresses,
        defaultAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddresses must be used within an AddressProvider');
  return ctx;
}
