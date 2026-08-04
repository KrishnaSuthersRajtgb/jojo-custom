import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  ArrowLeft,
  Ruler,
  Scissors,
  MapPin,
  Home,
  Briefcase,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { useAddresses, type AddressType } from '../context/AddressContext';
import { useAuth } from '../context/AuthContext';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink-600)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for the page title only.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

const TYPE_META: Record<AddressType, { label: string; icon: typeof Home }> = {
  home: { label: 'Home', icon: Home },
  work: { label: 'Work', icon: Briefcase },
  other: { label: 'Other', icon: MapPin },
};

// ---- Shape #1: sent by FabricDetail.tsx's "Buy Now" button ----
interface DirectOrderState {
  fabricId: string;
  fabricName: string;
  tone: string;
  garment: string;
  meters: number;
  pricePerMeter: number;
  total: number;
}

// ---- Shape #2: sent by ProductSummary.tsx's "Proceed to Order" button
// (the "Customize to JOJO" flow: fabric + style + accessories) ----
interface CustomFabric {
  fabricId: string;
  fabricName: string;
  fabricTone: string;
  fabricHex: string;
  pricePerMeter: number;
  garment: string;
  garmentLabel: string;
  meters: number;
  fabricTotal: number;
}

interface CustomAccessory {
  id: string;
  label: string;
  price: number;
}

interface CustomSelection {
  sectionLabel: string;
  optionLabel: string | null;
  subOptionLabel: string | null;
}

interface CustomOutfitOrderState {
  productId?: string;
  productName?: string;
  selections?: CustomSelection[] | null;
  measurementValues?: Record<string, string> | null;
  accessories?: CustomAccessory[];
  accessoriesTotal?: number;
  fabric?: CustomFabric | null;
  grandTotal?: number;
}

type IncomingOrderState = DirectOrderState | CustomOutfitOrderState;

function isDirectOrder(state: IncomingOrderState): state is DirectOrderState {
  return (
    'fabricId' in state && 'total' in state && !('grandTotal' in state) && !('accessories' in state)
  );
}

// Normalized view model both flows render from, and what's forwarded to
// /payment, so the Payment page keeps working off the same field names
// (fabricName, garment, meters, pricePerMeter, total) it already expects
// for the Buy Now flow.
interface NormalizedOrder {
  isCustom: boolean;
  fabricId: string;
  fabricName: string;
  tone: string;
  garment: string;
  garmentLabel?: string | undefined;
  meters: number;
  pricePerMeter: number;
  fabricTotal: number;
  productName?: string | undefined;
  selections?: CustomSelection[] | null | undefined;
  accessories: CustomAccessory[];
  accessoriesTotal: number;
  total: number;
  measurementValues?: Record<string, string> | null | undefined;
  bodyType?: string | null | undefined;
}

function normalizeOrder(
  state: IncomingOrderState,
  bodyType: string | null,
): NormalizedOrder | null {
  if (isDirectOrder(state)) {
    return {
      isCustom: false,
      fabricId: state.fabricId,
      fabricName: state.fabricName,
      tone: state.tone,
      garment: state.garment,
      meters: state.meters,
      pricePerMeter: state.pricePerMeter,
      fabricTotal: state.total,
      accessories: [],
      accessoriesTotal: 0,
      total: state.total,
    };
  }

  const custom = state;
  if (!custom.fabric && !custom.productId) return null;

  const fabric = custom.fabric;
  const accessories = custom.accessories ?? [];
  const accessoriesTotal = custom.accessoriesTotal ?? 0;
  const fabricTotal = fabric?.fabricTotal ?? 0;

  return {
    isCustom: true,
    fabricId: fabric?.fabricId ?? '',
    fabricName: fabric?.fabricName ?? '—',
    tone: fabric?.fabricTone ?? '',
    garment: fabric?.garment ?? custom.productId ?? '',
    garmentLabel: fabric?.garmentLabel ?? custom.productName,
    meters: fabric?.meters ?? 0,
    pricePerMeter: fabric?.pricePerMeter ?? 0,
    fabricTotal,
    productName: custom.productName,
    selections: custom.selections,
    accessories,
    accessoriesTotal,
    total: custom.grandTotal ?? fabricTotal + accessoriesTotal,
    // custom.measurementValues comes from ProductSummary.tsx's router
    // state; bodyType isn't part of that flow's state, so it's read
    // from the same localStorage key MeasurementSidebar.tsx/
    // BodyTypeSelector.tsx use, below.
    measurementValues: custom.measurementValues,
    bodyType,
  };
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function Order() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const incoming = location.state as IncomingOrderState | null;

  // Same storage key BodyTypeSelector.tsx / MeasurementSidebar.tsx write
  // to. Read directly (no listener needed — this page just needs the
  // value at order-review time, not live updates).
  const bodyTypeKey = `jojo_bodytype_${user?.username ?? 'guest'}`;
  const storedBodyType = localStorage.getItem(bodyTypeKey);

  const orderDetails = incoming ? normalizeOrder(incoming, storedBodyType) : null;
  const { defaultAddress } = useAddresses();

  // Guard: someone landed on /order directly without going through Buy Now
  // or Customize to JOJO
  if (!orderDetails) {
    return <Navigate to="/fabrics" replace />;
  }

  const handlePlaceOrder = () => {
    if (!defaultAddress) {
      void navigate('/addresses');
      return;
    }
    void navigate('/payment', { state: { orderDetails, address: defaultAddress } });
  };

  return (
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] pt-16">
      <section className="w-full px-6 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => {
              void navigate(-1);
            }}
            className="inline-flex items-center gap-1.5 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-6 w-6 text-[#5C1A32]" />
            <h1 className="text-4xl text-[#1B1512]" style={serif}>
              Review Your Order
            </h1>
          </div>
          <p className="text-[#4A413B]">Confirm the details before placing your order</p>
        </div>
      </section>

      <section className="w-full px-6 pb-16">
        {/* Two columns on large screens: details on the left (scan-only),
            summary + action pinned on the right so the total and Place
            Order button never get buried under long custom-order details. */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── Left: details ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Delivery address */}
            <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                  Delivery Address
                </h2>
                {defaultAddress && (
                  <button
                    onClick={() => {
                      void navigate('/addresses');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#5C1A32] hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change
                  </button>
                )}
              </div>

              {defaultAddress ? (
                (() => {
                  const TypeIcon = TYPE_META[defaultAddress.type].icon;
                  return (
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                        <TypeIcon className="h-3.5 w-3.5 text-[#B8935A]" />
                        {TYPE_META[defaultAddress.type].label}
                      </div>
                      <p className="font-semibold text-[#1B1512]">{defaultAddress.fullName}</p>
                      <p className="text-sm text-[#4A413B] mt-1 leading-relaxed">
                        {defaultAddress.line1}
                        {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}
                        {defaultAddress.landmark ? `, Near ${defaultAddress.landmark}` : ''}
                        <br />
                        {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
                      </p>
                      <p className="text-sm text-[#4A413B] mt-1">{defaultAddress.phone}</p>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-between rounded-sm border border-dashed border-[#5C1A32]/25 px-4 py-4">
                  <p className="text-sm text-[#4A413B]">No delivery address saved yet.</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      void navigate('/addresses');
                    }}
                    className="bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32] rounded-sm"
                  >
                    Add Address
                  </Button>
                </div>
              )}
            </div>

            {/* Order details */}
            <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
              <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                Order Details
              </h2>

              <div className="flex items-center justify-between py-3 border-b border-[#5C1A32]/10">
                <div className="flex items-center gap-2 text-sm text-[#4A413B]">
                  <Scissors className="h-4 w-4 text-[#B8935A]" />
                  Fabric
                </div>
                <span className="text-sm font-semibold text-[#1B1512]">
                  {orderDetails.fabricName}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#5C1A32]/10">
                <span className="text-sm text-[#4A413B]">Garment</span>
                <span className="text-sm font-semibold text-[#1B1512] capitalize">
                  {orderDetails.garmentLabel ?? orderDetails.garment}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#5C1A32]/10">
                <div className="flex items-center gap-2 text-sm text-[#4A413B]">
                  <Ruler className="h-4 w-4 text-[#B8935A]" />
                  Meters
                </div>
                <span className="text-sm font-semibold text-[#1B1512]">{orderDetails.meters}m</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#5C1A32]/10">
                <span className="text-sm text-[#4A413B]">Price per meter</span>
                <span className="text-sm font-semibold text-[#1B1512]">
                  ₹{orderDetails.pricePerMeter}
                </span>
              </div>

              {orderDetails.isCustom && (
                <div className="flex items-center justify-between py-3 border-b border-[#5C1A32]/10">
                  <span className="text-sm text-[#4A413B]">Fabric total</span>
                  <span className="text-sm font-semibold text-[#1B1512]">
                    {formatRupees(orderDetails.fabricTotal)}
                  </span>
                </div>
              )}

              {orderDetails.isCustom &&
                orderDetails.selections &&
                orderDetails.selections.length > 0 && (
                  <div className="py-3 border-b border-[#5C1A32]/10">
                    <span className="text-sm text-[#4A413B] block mb-2">Style selected</span>
                    <div className="space-y-1.5">
                      {orderDetails.selections.map((sel, idx) => (
                        <div
                          key={`${sel.sectionLabel}-${String(idx)}`}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-[#4A413B]">{sel.sectionLabel}</span>
                          <span className="font-medium text-[#1B1512]">
                            {sel.subOptionLabel ?? sel.optionLabel ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {orderDetails.isCustom && orderDetails.accessories.length > 0 && (
                <div className="py-3">
                  <div className="flex items-center gap-2 text-sm text-[#4A413B] mb-2">
                    <Sparkles className="h-4 w-4 text-[#B8935A]" />
                    Accessories &amp; Embellishments
                  </div>
                  <div className="space-y-1.5">
                    {orderDetails.accessories.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-[#2A211D]">{a.label}</span>
                        <span className="font-medium text-[#5C1A32]">+{formatRupees(a.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: sticky summary + place order ──────────────────── */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
              <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
                Summary
              </h2>

              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-[#4A413B]">Fabric total</span>
                <span className="font-medium text-[#1B1512]">
                  {formatRupees(orderDetails.fabricTotal)}
                </span>
              </div>

              {orderDetails.isCustom && orderDetails.accessoriesTotal > 0 && (
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-[#4A413B]">Accessories</span>
                  <span className="font-medium text-[#1B1512]">
                    {formatRupees(orderDetails.accessoriesTotal)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#5C1A32]/15">
                <span className="text-sm font-bold text-[#1B1512]">
                  {orderDetails.isCustom ? 'Grand Total' : 'Total'}
                </span>
                <span className="text-xl font-bold text-[#5C1A32]" style={serif}>
                  {formatRupees(orderDetails.total)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-semibold py-3 hover:bg-[#5C1A32] transition-colors"
              >
                {defaultAddress ? 'Place Order' : 'Add an address to continue'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
