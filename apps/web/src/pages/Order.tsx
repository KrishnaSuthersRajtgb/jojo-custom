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
  ShieldCheck,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useAddresses, type AddressType } from '../context/AddressContext';
import { useAuth } from '../context/AuthContext';
import { getCoutureSketchForGarment } from '../utils/coutureSketches';

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
  tailoringPrice?: number;
}

// Reference photo forwarded from ProductStyle.tsx -> ProductAccessories.tsx
// -> ProductSummary.tsx. Carried through here and on to Payment.tsx so it
// ends up on the saved order for AdminOrders.tsx/OrderTracking.tsx to
// display.
interface CustomReferenceImage {
  dataUrl: string;
  fileName: string;
}

interface CustomOutfitOrderState {
  productId?: string;
  productName?: string;
  baseTailoringPrice?: number;
  totalTailoring?: number;
  selections?: CustomSelection[] | null;
  measurementValues?: Record<string, string> | null;
  accessories?: CustomAccessory[];
  accessoriesTotal?: number;
  fabric?: CustomFabric | null;
  referenceImage?: CustomReferenceImage | null;
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
  baseTailoringPrice?: number | undefined;
  totalTailoring?: number | undefined;
  productName?: string | undefined;
  selections?: CustomSelection[] | null | undefined;
  accessories: CustomAccessory[];
  accessoriesTotal: number;
  total: number;
  measurementValues?: Record<string, string> | null | undefined;
  bodyType?: string | null | undefined;
  referenceImage?: CustomReferenceImage | null | undefined;
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
  const baseTailoringPrice = custom.baseTailoringPrice ?? 450;
  const styleTailoring = (custom.selections ?? []).reduce(
    (sum, s) => sum + (s.tailoringPrice ?? 0),
    0,
  );
  const totalTailoring = custom.totalTailoring ?? baseTailoringPrice + styleTailoring;

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
    baseTailoringPrice,
    totalTailoring,
    productName: custom.productName,
    selections: custom.selections,
    accessories,
    accessoriesTotal,
    total: custom.grandTotal ?? fabricTotal + accessoriesTotal + totalTailoring,
    // custom.measurementValues comes from ProductSummary.tsx's router
    // state; bodyType isn't part of that flow's state, so it's read
    // from the same localStorage key MeasurementSidebar.tsx/
    // BodyTypeSelector.tsx use, below.
    measurementValues: custom.measurementValues,
    bodyType,
    referenceImage: custom.referenceImage,
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

  const illustration = getCoutureSketchForGarment(
    orderDetails.garment,
    orderDetails.selections?.[0]?.subOptionLabel ??
      orderDetails.selections?.[0]?.optionLabel ??
      undefined,
  );

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] py-8">
      {/* Header Banner */}
      <section className="w-full px-4 sm:px-6 pt-6 pb-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => {
              void navigate(-1);
            }}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#4A413B] hover:text-[#5C1A32] transition-colors mb-3 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customization
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C1A32]/12 pb-5">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#B8935A] block mb-1">
                Client Couture Concierge
              </span>
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-7 w-7 text-[#5C1A32]" />
                <h1 className="text-3xl sm:text-4xl text-[#1B1512] font-normal" style={serif}>
                  Review Your Bespoke Ensemble
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#736357] mt-1">
                Confirm your tailored specifications, fabric selection, and delivery address before
                checkout.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#5C1A32] bg-white border border-[#5C1A32]/15 px-3.5 py-2 rounded-lg shadow-xs shrink-0">
              <ShieldCheck className="h-4 w-4 text-[#B8935A]" />
              <span>100% Handcrafted Atelier Fit Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="w-full px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Detailed Specifications ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Garment & Fabric Specification Card */}
            <div className="bg-white rounded-xl border border-[#5C1A32]/15 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#5C1A32]/10 bg-[#FAF7F2]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-[#B8935A]" />
                  <h2 className="text-xs font-bold tracking-[0.2em] text-[#1B1512] uppercase">
                    Garment &amp; Atelier Specifications
                  </h2>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#5C1A32]/10 text-[#5C1A32]">
                  {orderDetails.isCustom ? 'Bespoke Custom' : 'Direct Order'}
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Visual Header with Couture Sketch Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-[#FAF7F2] border border-[#5C1A32]/10">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-[#5C1A32]/20 shadow-xs bg-white flex items-center justify-center">
                    <img
                      src={illustration.imageUrl}
                      alt={illustration.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <span className="text-[9px] font-mono tracking-widest text-[#B8935A] uppercase font-bold">
                      {illustration.badge}
                    </span>
                    <h3 className="text-base font-bold text-[#1B1512] capitalize" style={serif}>
                      {orderDetails.garmentLabel ?? orderDetails.garment}
                    </h3>
                    <p className="text-xs text-[#736357]">{illustration.subtitle}</p>
                    <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C1A32] bg-white px-2 py-0.5 rounded border border-[#5C1A32]/20">
                        Fabric: {orderDetails.fabricName}
                      </span>
                      {orderDetails.tone && (
                        <span className="text-[11px] font-medium text-[#736357] bg-white px-2 py-0.5 rounded border border-neutral-200 capitalize">
                          Tone: {orderDetails.tone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Spec Table */}
                <div className="divide-y divide-[#5C1A32]/10 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#736357]">Fabric Length Required</span>
                    <span className="font-semibold text-[#1B1512]">
                      {orderDetails.meters} Metres
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#736357]">Price Per Metre</span>
                    <span className="font-semibold text-[#1B1512]">
                      ₹{orderDetails.pricePerMeter} / m
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#736357]">Fabric Subtotal</span>
                    <span className="font-semibold text-[#1B1512]">
                      {formatRupees(orderDetails.fabricTotal)}
                    </span>
                  </div>

                  {/* Selected Style breakdown */}
                  {orderDetails.isCustom &&
                    orderDetails.selections &&
                    orderDetails.selections.length > 0 && (
                      <div className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B1512]">
                            Bespoke Style Options &amp; Tailoring:
                          </span>
                          {orderDetails.totalTailoring ? (
                            <span className="text-xs font-mono font-bold text-[#5C1A32]">
                              Total: {formatRupees(orderDetails.totalTailoring)}
                            </span>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {orderDetails.selections.map((sel, idx) => (
                            <div
                              key={`${sel.sectionLabel}-${String(idx)}`}
                              className="p-2.5 rounded bg-[#FAF7F2] border border-[#5C1A32]/10 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="text-[10px] text-[#8A7968] block uppercase">
                                  {sel.sectionLabel}
                                </span>
                                <span className="font-semibold text-[#1B1512] block">
                                  {sel.subOptionLabel ?? sel.optionLabel ?? 'Standard'}
                                </span>
                              </div>
                              <div className="text-right ml-2 shrink-0">
                                {sel.tailoringPrice ? (
                                  <span className="font-mono text-[11px] font-bold text-[#5C1A32]">
                                    +{formatRupees(sel.tailoringPrice)}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-[#8A7968]">Included</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Accessories & Embellishments */}
                  {orderDetails.isCustom && orderDetails.accessories.length > 0 && (
                    <div className="py-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1B1512] mb-2">
                        <Sparkles className="h-3.5 w-3.5 text-[#B8935A]" />
                        <span>Handcrafted Atelier Embellishments:</span>
                      </div>
                      <div className="space-y-1.5">
                        {orderDetails.accessories.map((a) => (
                          <div
                            key={a.id}
                            className="p-2 rounded bg-[#FAF7F2] border border-[#5C1A32]/10 flex items-center justify-between text-xs"
                          >
                            <span className="text-[#1B1512] font-medium">{a.label}</span>
                            <span className="font-bold text-[#5C1A32]">
                              +{formatRupees(a.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Measurements profile note */}
                  {orderDetails.measurementValues && (
                    <div className="py-3 bg-amber-50/50 -mx-5 px-5 border-t border-b border-amber-200/60 flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-[#B8935A] shrink-0" />
                      <p className="text-[11px] text-[#735A2A] font-medium leading-relaxed">
                        Bespoke Measurement Profile will be applied to this garment pattern. Our
                        master tailor will cross-verify each dimension before drafting.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Delivery Destination Card */}
            <div className="bg-white rounded-xl border border-[#5C1A32]/15 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#5C1A32]/10 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#5C1A32]" />
                  <h2 className="text-xs font-bold tracking-[0.2em] text-[#1B1512] uppercase">
                    Delivery Destination
                  </h2>
                </div>
                {defaultAddress && (
                  <button
                    onClick={() => {
                      void navigate('/addresses');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#5C1A32] hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Change Address
                  </button>
                )}
              </div>

              {defaultAddress ? (
                (() => {
                  const TypeIcon = TYPE_META[defaultAddress.type].icon;
                  return (
                    <div className="p-4 rounded-lg bg-[#FAF7F2] border border-[#5C1A32]/10 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#5C1A32] uppercase mb-1">
                        <TypeIcon className="h-3.5 w-3.5 text-[#B8935A]" />
                        <span>{TYPE_META[defaultAddress.type].label} DESTINATION</span>
                      </div>
                      <p className="font-bold text-sm text-[#1B1512]">{defaultAddress.fullName}</p>
                      <p className="text-xs text-[#544B45] leading-relaxed">
                        {defaultAddress.line1}
                        {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}
                        {defaultAddress.landmark ? `, Near ${defaultAddress.landmark}` : ''}
                        <br />
                        {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
                      </p>
                      <p className="text-xs text-[#544B45] font-semibold pt-1">
                        Contact: {defaultAddress.phone}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed border-[#5C1A32]/30 p-4 bg-[#FAF7F2]/50">
                  <p className="text-xs text-[#544B45]">
                    No delivery address selected for this order.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      void navigate('/addresses');
                    }}
                    className="bg-[#5C1A32] text-white hover:bg-[#431224] text-xs font-semibold"
                  >
                    Add Delivery Address
                  </Button>
                </div>
              )}
            </div>

            {/* 3. Atelier Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-[#5C1A32]/12 p-3 text-center space-y-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 mx-auto" />
                <h4 className="text-xs font-bold text-[#1B1512]">Master Craftsmen</h4>
                <p className="text-[10px] text-[#736357]">
                  Hand-cut and assembled by senior atelier tailors.
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#5C1A32]/12 p-3 text-center space-y-1">
                <Truck className="h-4 w-4 text-[#5C1A32] mx-auto" />
                <h4 className="text-xs font-bold text-[#1B1512]">BlueDart Express</h4>
                <p className="text-[10px] text-[#736357]">
                  Tracked, insured doorstep delivery with signature.
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#5C1A32]/12 p-3 text-center space-y-1">
                <ShieldCheck className="h-4 w-4 text-[#B8935A] mx-auto" />
                <h4 className="text-xs font-bold text-[#1B1512]">Complimentary Fit</h4>
                <p className="text-[10px] text-[#736357]">
                  Free alteration within 7 days if fitting requires adjustment.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Sticky Pricing Summary & Place Order CTA ── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 bg-white rounded-xl border border-[#5C1A32]/20 shadow-md p-6 space-y-5">
              <div className="border-b border-[#5C1A32]/12 pb-3">
                <span className="text-[10px] tracking-widest uppercase font-bold text-[#B8935A] block">
                  ORDER RECAP
                </span>
                <h2 className="text-xl font-normal text-[#1B1512]" style={serif}>
                  Investment Summary
                </h2>
              </div>

              {/* Line Items */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-[#544B45]">
                  <span>Fabric Total ({orderDetails.meters}m)</span>
                  <span className="font-semibold text-[#1B1512]">
                    {formatRupees(orderDetails.fabricTotal)}
                  </span>
                </div>

                {/* Base Stitching (Custom Outfits) */}
                {orderDetails.isCustom && orderDetails.baseTailoringPrice ? (
                  <div className="flex items-center justify-between text-[#544B45]">
                    <span>Base Stitching ({orderDetails.productName || orderDetails.garment})</span>
                    <span className="font-semibold text-[#1B1512]">
                      {formatRupees(orderDetails.baseTailoringPrice)}
                    </span>
                  </div>
                ) : null}

                {/* Itemized Sub-Division Tailoring Charges */}
                {orderDetails.isCustom &&
                  orderDetails.selections
                    ?.filter((s) => (s.tailoringPrice ?? 0) > 0)
                    .map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-[#736357] pl-2 border-l-2 border-[#5C1A32]/25"
                      >
                        <span className="truncate max-w-[200px]">
                          + {s.subOptionLabel ?? s.optionLabel} ({s.sectionLabel})
                        </span>
                        <span className="font-mono text-[#5C1A32] font-semibold">
                          +{formatRupees(s.tailoringPrice ?? 0)}
                        </span>
                      </div>
                    ))}

                {orderDetails.isCustom && orderDetails.accessoriesTotal > 0 && (
                  <div className="flex items-center justify-between text-[#544B45]">
                    <span>Atelier Embellishments</span>
                    <span className="font-semibold text-[#1B1512]">
                      +{formatRupees(orderDetails.accessoriesTotal)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[#544B45]">
                  <span>Insured Express Courier</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-4 border-t-2 border-[#5C1A32]/20 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1B1512] block">
                    {orderDetails.isCustom ? 'Grand Total' : 'Total Payable'}
                  </span>
                  <span className="text-[10px] text-[#8A7968]">All inclusive price</span>
                </div>
                <span className="text-3xl font-normal text-[#5C1A32]" style={serif}>
                  {formatRupees(orderDetails.total)}
                </span>
              </div>

              {/* Place Order CTA Button */}
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-6 rounded-lg bg-[#5C1A32] hover:bg-[#431224] text-white text-sm font-bold uppercase tracking-wider shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 group"
              >
                <span>{defaultAddress ? 'Proceed to Payment' : 'Add Address to Continue'}</span>
                <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="pt-2 text-center text-[10px] text-[#8A7968] space-y-1">
                <p className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Encrypted 256-bit checkout powered by Razorpay</span>
                </p>
                <p>Tax invoice / bill will be available for instant download after payment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
