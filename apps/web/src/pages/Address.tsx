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

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx / OrderTracking.tsx / CustomOutfit.tsx / ProductStyle.tsx / ProductAccessories.tsx / ProductSummary.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for page/card titles.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

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

// Shared input classes so every field in the form lines up with the same
// height, border, and focus treatment — no field looks taller/shorter or
// styled differently than its neighbor.
const INPUT_CLASSES =
  "w-full rounded-sm border border-[#5C1A32]/20 bg-white text-[#1B1512] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5C1A32]/40 focus:border-[#5C1A32]";
const LABEL_CLASSES =
  "text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-1.5 block";

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
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] pt-16">
      <section className="w-full px-6 pt-8 pb-6">
        {/* flex-col on mobile so the button doesn't get squeezed next to
            the title on narrow screens; row layout once there's room. */}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl text-[#1B1512] mb-1" style={serif}>
              My Addresses
            </h1>
            <p className="text-[#4A413B] text-sm">
              Manage your saved delivery addresses
            </p>
          </div>
          {addresses.length > 0 && (
            <Button
              onClick={openAddForm}
              className="gap-1.5 bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32] rounded-sm shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          )}
        </div>
      </section>

      <section className="w-full px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Empty state */}
          {addresses.length === 0 && !isFormOpen && (
            <div className="flex flex-col items-center justify-center text-center py-20 rounded-sm border border-dashed border-[#5C1A32]/25 bg-white">
              <MapPin className="h-10 w-10 text-[#5C1A32]/30 mb-4" />
              <p className="text-[#1B1512] font-medium mb-1">
                No addresses saved yet
              </p>
              <p className="text-sm text-[#4A413B]/60 mb-6">
                Add an address to speed up checkout
              </p>
              <Button
                onClick={openAddForm}
                className="gap-1.5 bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32] rounded-sm"
              >
                <Plus className="h-4 w-4" />
                Add Address
              </Button>
            </div>
          )}

          {/* Address list */}
          {addresses.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8 items-stretch">
              {addresses.map((address) => {
                const TypeIcon = TYPE_META[address.type].icon;
                return (
                  <div
                    key={address.id}
                    className={`relative flex flex-col rounded-sm border bg-white shadow-sm p-5 transition-colors ${
                      address.isDefault
                        ? "border-[#5C1A32]"
                        : "border-[#5C1A32]/12"
                    }`}
                  >
                    {address.isDefault && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C1A32] bg-[#5C1A32]/8 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        Default
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.15em] text-[#1B1512] uppercase mb-2">
                      <TypeIcon className="h-3.5 w-3.5 text-[#B8935A]" />
                      {TYPE_META[address.type].label}
                    </div>

                    <p className="font-semibold text-[#1B1512]">
                      {address.fullName}
                    </p>
                    <p className="text-sm text-[#4A413B] mt-1 leading-relaxed">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      {address.landmark ? `, Near ${address.landmark}` : ""}
                      <br />
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-sm text-[#4A413B] mt-1">
                      {address.phone}
                    </p>

                    {/* mt-auto pins this action row to the bottom of every
                        card regardless of how many address lines it has
                        above, so the row of actions lines up across the
                        grid instead of floating at different heights. */}
                    <div className="flex items-center gap-4 mt-auto pt-4 mt-4 border-t border-[#5C1A32]/10">
                      <button
                        onClick={() => { openEditForm(address); }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#4A413B] hover:text-[#5C1A32]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(address); }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#4A413B] hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                      {/* Always reserve this slot on the right, even for
                          the default card, so the Edit/Delete buttons sit
                          at the same x-position on every card instead of
                          shifting depending on whether "Set as default"
                          is present. */}
                      <span className="ml-auto">
                        {!address.isDefault && (
                          <button
                            onClick={() => { handleSetDefault(address.id); }}
                            className="text-xs font-medium text-[#4A413B] hover:text-[#5C1A32]"
                          >
                            Set as default
                          </button>
                        )}
                      </span>
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
              className="rounded-sm border border-[#5C1A32]/12 bg-white shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg text-[#1B1512]" style={serif}>
                  {editingId ? "Edit Address" : "Add New Address"}
                </h2>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-[#4A413B]/60 hover:text-[#1B1512]"
                  aria-label="Close form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Fields are grouped so each row pairs inputs of the same
                  kind (name alone; phone+pincode; address lines full
                  width; city+state; landmark+type) — no row mixes a
                  single-line input against a taller button group, which
                  is what threw the alignment off before. */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASSES}>Full Name</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => { handleChange("fullName", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASSES}>Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => { handleChange("phone", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASSES}>Pincode</label>
                  <input
                    required
                    value={form.pincode}
                    onChange={(e) => { handleChange("pincode", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASSES}>Address Line 1</label>
                  <input
                    required
                    value={form.line1}
                    onChange={(e) => { handleChange("line1", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASSES}>Address Line 2 (Optional)</label>
                  <input
                    value={form.line2}
                    onChange={(e) => { handleChange("line2", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASSES}>City</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => { handleChange("city", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASSES}>State</label>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => { handleChange("state", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASSES}>Landmark (Optional)</label>
                  <input
                    value={form.landmark}
                    onChange={(e) => { handleChange("landmark", e.target.value); }}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASSES}>Address Type</label>
                  <div className="flex gap-2">
                    {(Object.keys(TYPE_META) as AddressType[]).map((t) => {
                      const Icon = TYPE_META[t].icon;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { handleChange("type", t); }}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2.5 text-xs font-medium transition-colors ${
                            form.type === t
                              ? "bg-[#5C1A32] border-[#5C1A32] text-[#F6F1E7]"
                              : "border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]"
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
                <Button
                  type="submit"
                  className="flex-1 bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32] rounded-sm"
                >
                  {editingId ? "Save Changes" : "Save Address"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeForm}
                  className="flex-1 text-[#1B1512] hover:bg-[#5C1A32]/5 hover:text-[#5C1A32]"
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
            className="w-full max-w-sm bg-white rounded-sm shadow-sm p-6"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <h3 className="text-lg text-[#1B1512] mb-1" style={serif}>
              Delete this address?
            </h3>
            <p className="text-sm text-[#4A413B] mb-5">
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
                className="flex-1 text-[#1B1512] hover:bg-[#5C1A32]/5 hover:text-[#5C1A32]"
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