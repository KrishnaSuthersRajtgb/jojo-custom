import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Home,
  Briefcase,
  Check,
  X,
} from "lucide-react";
import { useAddresses, type Address, type AddressType } from "../context/AddressContext";

interface AddressFormState {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  type: AddressType;
}

const EMPTY_FORM: AddressFormState = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  type: "home",
};

const TYPE_META: Record<AddressType, { label: string; icon: typeof Home }> = {
  home: { label: "Home", icon: Home },
  work: { label: "Work", icon: Briefcase },
  other: { label: "Other", icon: MapPin },
};

export default function Address() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (address: Address) => {
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      landmark: address.landmark ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      type: address.type,
    });
    setEditingId(address.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (
    field: keyof AddressFormState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (editingId) {
    updateAddress(editingId, form);
  } else {
    addAddress(form);
  }

  closeForm();
};

  const handleSetDefault = (id: string) => {
    setDefaultAddress(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteAddress(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="w-full">
      <section className="w-full px-6 py-10 bg-rose-50/40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-1">
              My Addresses
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your saved delivery addresses
            </p>
          </div>
          {addresses.length > 0 && (
            <Button onClick={openAddForm} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          )}
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Empty state */}
          {addresses.length === 0 && !isFormOpen && (
            <div className="flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-white">
              <MapPin className="h-10 w-10 text-gray-300 mb-4" />
              <p className="text-gray-700 font-medium mb-1">
                No addresses saved yet
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Add an address to speed up checkout
              </p>
              <Button onClick={openAddForm} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Address
              </Button>
            </div>
          )}

          {/* Address list */}
          {addresses.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {addresses.map((address) => {
                const TypeIcon = TYPE_META[address.type].icon;
                return (
                  <div
                    key={address.id}
                    className={`relative rounded-2xl border bg-white shadow-sm p-5 transition-colors ${
                      address.isDefault
                        ? "border-fuchsia-800"
                        : "border-gray-100"
                    }`}
                  >
                    {address.isDefault && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-800 bg-fuchsia-50 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        Default
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-gray-800 mb-2">
                      <TypeIcon className="h-3.5 w-3.5" />
                      {TYPE_META[address.type].label.toUpperCase()}
                    </div>

                    <p className="font-semibold text-gray-900">
                      {address.fullName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      {address.landmark ? `, Near ${address.landmark}` : ""}
                      <br />
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {address.phone}
                    </p>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => { openEditForm(address); }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-fuchsia-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(address); }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => { handleSetDefault(address.id); }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-fuchsia-800 ml-auto"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add/Edit form */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif font-bold text-lg text-gray-900">
                  {editingId ? "Edit Address" : "Add New Address"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-gray-400 hover:text-gray-700"
                  aria-label="Close form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    FULL NAME
                  </label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => { handleChange("fullName", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    PHONE NUMBER
                  </label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => { handleChange("phone", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    PINCODE
                  </label>
                  <input
                    required
                    value={form.pincode}
                    onChange={(e) => { handleChange("pincode", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    ADDRESS LINE 1
                  </label>
                  <input
                    required
                    value={form.line1}
                    onChange={(e) => { handleChange("line1", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    ADDRESS LINE 2 (OPTIONAL)
                  </label>
                  <input
                    value={form.line2}
                    onChange={(e) => { handleChange("line2", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    LANDMARK (OPTIONAL)
                  </label>
                  <input
                    value={form.landmark}
                    onChange={(e) => { handleChange("landmark", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    CITY
                  </label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => { handleChange("city", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    STATE
                  </label>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => { handleChange("state", e.target.value); }}
                    className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wide text-gray-800 mb-1.5 block">
                    ADDRESS TYPE
                  </label>
                  <div className="flex gap-2">
                    {(Object.keys(TYPE_META) as AddressType[]).map((t) => {
                      const Icon = TYPE_META[t].icon;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { handleChange("type", t); }}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                            form.type === t
                              ? "bg-fuchsia-800 border-fuchsia-800 text-white"
                              : "border-gray-200 text-gray-600 hover:border-fuchsia-800"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {TYPE_META[t].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  {editingId ? "Save Changes" : "Save Address"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => { setDeleteTarget(null); }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <h3 className="font-serif font-bold text-lg text-gray-900 mb-1">
              Delete this address?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {deleteTarget.line1}, {deleteTarget.city} — this can't be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setDeleteTarget(null); }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}