import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type AddressType = "home" | "work" | "other";

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

export type AddressInput = Omit<Address, "id" | "isDefault">;

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
  const userKey = user?.username ?? "guest";

  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
  const raw = localStorage.getItem(storageKeyFor(userKey));
  setAddresses(raw ? (JSON.parse(raw) as Address[]) : []);
}, [userKey]);

  const persist = (next: Address[]) => {
    setAddresses(next);
    localStorage.setItem(storageKeyFor(userKey), JSON.stringify(next));
  };

 const addAddress = (input: AddressInput) => {
  const newAddress: Address = {
    id: `addr_${Date.now().toString()}`,
    ...input,
    isDefault: addresses.length === 0,
  };
  persist([...addresses, newAddress]);
};

  const updateAddress = (id: string, input: AddressInput) => {
    persist(addresses.map((a) => (a.id === id ? { ...a, ...input } : a)));
  };

  const deleteAddress = (id: string) => {
    persist(addresses.filter((a) => a.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return (
    <AddressContext.Provider
      value={{ addresses, defaultAddress, addAddress, updateAddress, deleteAddress, setDefaultAddress }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddresses must be used within an AddressProvider");
  return ctx;
}