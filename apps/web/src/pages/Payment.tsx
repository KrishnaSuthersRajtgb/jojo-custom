import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  QrCode,
  Lock,
  Zap,
  MapPin,
  Sparkles,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderApi, cronApi } from '../services';
import { couponService, type AtelierCoupon } from '../services/couponService';
import type { Address } from '../context/AddressContext';
import { getCoutureSketchForGarment } from '../utils/coutureSketches';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink-600)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for page titles only.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface SelectionEntry {
  sectionId?: string;
  sectionLabel: string;
  optionLabel: string | null;
  subOptionLabel: string | null;
  tailoringPrice?: number;
}

interface AccessoryEntry {
  id: string;
  label: string;
  price: number;
}

// Reference photo forwarded from ProductStyle.tsx all the way through
// ProductAccessories.tsx / ProductSummary.tsx / Order.tsx. Carried
// through here untouched — saveOrder() below persists it as part of
// orderDetails, so AdminOrders.tsx/OrderTracking.tsx can display it.
interface ReferenceImage {
  dataUrl: string;
  fileName: string;
}

interface OrderDetails {
  fabricId: string;
  fabricName: string;
  tone: string;
  garment: string;
  garmentLabel?: string;
  meters: number;
  pricePerMeter: number;
  total: number;
  isCustom?: boolean;
  fabricTotal?: number;
  baseTailoringPrice?: number;
  totalTailoring?: number;
  productId?: string;
  productName?: string;
  selections?: SelectionEntry[] | null;
  accessories?: AccessoryEntry[];
  accessoriesTotal?: number;
  measurementValues?: Record<string, string> | null;
  bodyType?: string | null;
  referenceImage?: ReferenceImage | null;
}

interface PaymentState {
  orderDetails: OrderDetails;
  address: Address;
}

// A completed order, persisted so it can be revisited later from
// Navbar's "My Orders" link even without fresh router state. Read by
// OrderTracking.tsx.
interface SavedOrder {
  id: string;
  orderDetails: OrderDetails;
  address: Address;
  paymentId: string | null;
  placedAt: string;
}

// --- Razorpay SDK types (minimal — only what we use) ---
interface RazorpayPrefill {
  name?: string;
  contact?: string;
}

interface RazorpayNotes {
  [key: string]: string;
}

interface RazorpayTheme {
  color?: string;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: RazorpayPrefill;
  notes?: RazorpayNotes;
  theme?: RazorpayTheme;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    [key: string]: unknown;
  };
}

interface RazorpayInstance {
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
const RAZORPAY_KEY_ID =
  (import.meta.env['VITE_RAZORPAY_KEY_ID'] as string | undefined) ?? 'rzp_test_TShOXEXBo0Y5oK';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as PaymentState | null;

  // Same per-user localStorage convention used elsewhere (measurements,
  // body type). OrderTracking.tsx reads from this same key.
  const ordersKey = `jojo_orders_${user?.username ?? 'guest'}`;

  const [scriptReady, setScriptReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    'razorpay' | 'upi' | 'card' | 'netbanking' | 'demo'
  >('razorpay');

  // ── Coupon State ──────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AtelierCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(
    null,
  );

  useEffect(() => {
    void loadRazorpayScript().then(setScriptReady);
  }, []);

  // Guard: someone landed here directly without going through Order review
  if (!state) {
    return <Navigate to="/fabrics" replace />;
  }

  const { orderDetails, address } = state;
  const effectiveTotal = Math.max(0, orderDetails.total - discountAmount);

  const handleApplyCoupon = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = couponService.validateCoupon(couponInput, orderDetails.total);
    if (!res.valid) {
      setCouponMessage({ text: res.error || 'Invalid promo code', isError: true });
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }
    setAppliedCoupon(res.coupon || null);
    setDiscountAmount(res.discountAmount);
    setCouponMessage({
      text: `Code "${res.coupon?.code}" applied! You saved ₹${res.discountAmount.toLocaleString('en-IN')}`,
      isError: false,
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput('');
    setCouponMessage(null);
  };

  const handleDemoPay = () => {
    setProcessing(true);
    setError('');
    setTimeout(() => {
      const demoId = `pay_verified_${Date.now().toString(36).toUpperCase()}`;
      setPaymentId(demoId);
      setPaid(true);
      setProcessing(false);
      saveOrder(demoId);
    }, 600);
  };

  const saveOrder = (razorpayPaymentId: string | null) => {
    const finalOrderDetails: OrderDetails = {
      ...orderDetails,
      total: effectiveTotal,
    };
    const newOrder: SavedOrder = {
      id: razorpayPaymentId ?? `local_${String(Date.now())}`,
      orderDetails: finalOrderDetails,
      address,
      paymentId: razorpayPaymentId,
      placedAt: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem(ordersKey);
      const existing: SavedOrder[] = raw ? (JSON.parse(raw) as SavedOrder[]) : [];
      localStorage.setItem(ordersKey, JSON.stringify([newOrder, ...existing]));
    } catch {
      // Non-critical — if storage fails, the live tracking view still
      // works via router state; it just won't reappear under My Orders.
    }

    // Also persist order to backend database
    orderApi
      .create({
        id: newOrder.id,
        orderDetails: finalOrderDetails,
        address,
        paymentId: razorpayPaymentId,
      })
      .catch(() => {
        // Local order was already saved
      });
  };

  const handlePay = () => {
    if (!scriptReady) {
      setError('Payment gateway is still loading. Please try again in a moment.');
      return;
    }
    setError('');
    setProcessing(true);

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID,
      amount: effectiveTotal * 100, // amount in paise
      currency: 'INR',
      name: 'JoJo Boutique',
      description: `${orderDetails.fabricName} — ${orderDetails.garment}`,
      prefill: {
        name: address.fullName,
        contact: address.phone,
      },
      notes: {
        fabricId: orderDetails.fabricId,
        garment: orderDetails.garment,
        addressId: address.id,
      },
      theme: {
        color: '#5C1A32', // wine — matches the site's primary accent
      },
      handler: (response) => {
        setPaymentId(response.razorpay_payment_id);
        setPaid(true);
        setProcessing(false);
        saveOrder(response.razorpay_payment_id);
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
        },
      },
    };

    if (!window.Razorpay) {
      setError('Payment gateway failed to load. Please refresh and try again.');
      setProcessing(false);
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: RazorpayFailureResponse) => {
      const failReason = response.error.description || 'Transaction declined or interrupted';
      setError(
        `Payment uncompleted: ${failReason}. Details have been recorded for automated recovery.`,
      );
      setProcessing(false);

      // Record failed payment in backend database for automated cron job recovery
      const failedOrderId = `FAIL_${Date.now().toString()}`;
      void cronApi.recordFailure({
        id: failedOrderId,
        orderDetails,
        address,
        reason: failReason,
        errorCode: response.error.code,
      });

      // Also persist locally as failed so it appears in Admin & user tracking
      try {
        const raw = localStorage.getItem(ordersKey);
        const existing: SavedOrder[] = raw ? (JSON.parse(raw) as SavedOrder[]) : [];
        const failedOrder: SavedOrder = {
          id: failedOrderId,
          orderDetails,
          address,
          paymentId: null,
          placedAt: new Date().toISOString(),
        };
        localStorage.setItem(ordersKey, JSON.stringify([failedOrder, ...existing]));
      } catch {
        // ignore
      }
    });
    rzp.open();
  };

  if (paid) {
    return (
      <div className="w-full min-h-screen bg-[#FAF7F2] py-12">
        <section className="w-full px-6 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="h-14 w-14 rounded-full bg-[#1B1512] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-[#F6F1E7]" />
            </div>
            <h1 className="text-3xl text-[#1B1512] mb-2" style={serif}>
              Payment successful!
            </h1>
            <p className="text-[#4A413B] mb-1">
              Thank you for your order. We'll start preparing it right away.
            </p>
            {paymentId && (
              <p className="text-sm text-[#4A413B]/60 mb-8">
                Payment ID: <span className="font-semibold text-[#2A211D]">{paymentId}</span>
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  void navigate('/order-tracking', {
                    state: { orderDetails, address, paymentId },
                  });
                }}
                className="bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32] rounded-sm"
              >
                Track Order
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  void navigate('/fabrics');
                }}
                className="text-[#1B1512] hover:bg-[#5C1A32]/5 hover:text-[#5C1A32]"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
            Back to Order Review
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C1A32]/12 pb-5">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#B8935A] block mb-1">
                Atelier Payment Concierge
              </span>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-7 w-7 text-[#5C1A32]" />
                <h1 className="text-3xl sm:text-4xl text-[#1B1512] font-normal" style={serif}>
                  Secure Atelier Checkout
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#736357] mt-1">
                Select your preferred payment channel. All transactions are 256-bit SSL encrypted.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                PCI-DSS Certified
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] border border-[#5C1A32]/20">
                Razorpay Verified Gateway
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="w-full px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Payment Method Selection & Security ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Payment Method Selector */}
            <div className="bg-white rounded-xl border border-[#5C1A32]/15 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="border-b border-[#5C1A32]/10 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold tracking-[0.2em] text-[#1B1512] uppercase">
                    Select Payment Method
                  </h2>
                  <p className="text-xs text-[#736357] mt-0.5">
                    Fast &amp; encrypted checkout via Razorpay official gateway
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Instant Confirmation
                </span>
              </div>

              {/* Payment Option Cards */}
              <div className="space-y-3">
                {/* 1. Razorpay All-in-One Gateway */}
                <div
                  onClick={() => setSelectedMethod('razorpay')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedMethod === 'razorpay'
                      ? 'border-[#5C1A32] bg-[#5C1A32]/5 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'razorpay'}
                    onChange={() => setSelectedMethod('razorpay')}
                    className="mt-1 accent-[#5C1A32]"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1B1512] flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#B8935A]" />
                        Razorpay Smart Checkout (Recommended)
                      </h3>
                      <span className="text-[10px] bg-[#5C1A32] text-white px-2 py-0.5 rounded font-bold uppercase">
                        Popular
                      </span>
                    </div>
                    <p className="text-xs text-[#736357]">
                      Pay via Google Pay, PhonePe, Paytm, Cards, NetBanking, or EMI in one unified
                      popup.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-neutral-600">
                      <span className="px-1.5 py-0.5 bg-neutral-100 rounded">UPI</span>
                      <span className="px-1.5 py-0.5 bg-neutral-100 rounded">Cards</span>
                      <span className="px-1.5 py-0.5 bg-neutral-100 rounded">NetBanking</span>
                      <span className="px-1.5 py-0.5 bg-neutral-100 rounded">Wallets</span>
                    </div>
                  </div>
                </div>

                {/* 2. UPI & QR */}
                <div
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedMethod === 'upi'
                      ? 'border-[#5C1A32] bg-[#5C1A32]/5 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'upi'}
                    onChange={() => setSelectedMethod('upi')}
                    className="mt-1 accent-[#5C1A32]"
                  />
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-[#1B1512] flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-[#5C1A32]" />
                      UPI Direct / Dynamic QR Code
                    </h3>
                    <p className="text-xs text-[#736357]">
                      Scan via GPay, PhonePe, BHIM, or Paytm app with zero extra surcharge.
                    </p>
                  </div>
                </div>

                {/* 3. Cards */}
                <div
                  onClick={() => setSelectedMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedMethod === 'card'
                      ? 'border-[#5C1A32] bg-[#5C1A32]/5 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'card'}
                    onChange={() => setSelectedMethod('card')}
                    className="mt-1 accent-[#5C1A32]"
                  />
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-[#1B1512] flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#5C1A32]" />
                      Credit &amp; Debit Cards
                    </h3>
                    <p className="text-xs text-[#736357]">
                      Visa, MasterCard, RuPay, Maestro, and American Express with 3D Secure OTP.
                    </p>
                  </div>
                </div>

                {/* 4. One-Click Instant Demo Payment */}
                <div
                  onClick={() => setSelectedMethod('demo')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedMethod === 'demo'
                      ? 'border-[#B8935A] bg-[#B8935A]/10 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'demo'}
                    onChange={() => setSelectedMethod('demo')}
                    className="mt-1 accent-[#B8935A]"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1B1512] flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#B8935A]" />
                        Instant 1-Click Verification (Demo &amp; Testing)
                      </h3>
                      <span className="text-[10px] bg-[#B8935A] text-white px-2 py-0.5 rounded font-bold uppercase">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-[#736357]">
                      Instantly verifies and generates a signed payment receipt with live order
                      tracking without requiring external OTP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Destination Snapshot */}
              <div className="pt-4 border-t border-[#5C1A32]/10 flex items-start gap-3 bg-[#FAF7F2] p-3.5 rounded-lg">
                <MapPin className="h-4 w-4 text-[#5C1A32] shrink-0 mt-0.5" />
                <div className="text-xs text-[#544B45]">
                  <span className="font-bold text-[#1B1512]">Dispatching To:</span>{' '}
                  {address.fullName} · {address.line1}, {address.city}, {address.state} -{' '}
                  {address.pincode} (Tel: {address.phone})
                </div>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs px-4 py-3 leading-relaxed">
                {error}
              </div>
            )}
          </div>

          {/* ── Right Column: Sticky Order Summary & Pay CTA ── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 bg-white rounded-xl border border-[#5C1A32]/20 shadow-md p-6 space-y-5">
              <div className="border-b border-[#5C1A32]/12 pb-3">
                <span className="text-[10px] tracking-widest uppercase font-bold text-[#B8935A] block">
                  PAYMENT SUMMARY
                </span>
                <h2 className="text-xl font-normal text-[#1B1512]" style={serif}>
                  Order Amount
                </h2>
              </div>

              {/* Mini Item Card */}
              <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[#FAF7F2] border border-[#5C1A32]/10">
                <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 border border-[#5C1A32]/20 bg-white">
                  <img
                    src={illustration.imageUrl}
                    alt={illustration.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-[#1B1512] truncate capitalize">
                    {orderDetails.garmentLabel ?? orderDetails.garment}
                  </h4>
                  <p className="text-[11px] text-[#736357] truncate">
                    Fabric: {orderDetails.fabricName} ({orderDetails.meters}m)
                  </p>
                  <p className="text-[10px] text-[#B8935A] font-semibold">
                    {orderDetails.isCustom ? 'Haute Couture Custom' : 'Direct Textile Purchase'}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#544B45]">
                  <span>Fabric Total</span>
                  <span className="font-semibold text-[#1B1512]">
                    ₹{orderDetails.fabricTotal ?? orderDetails.total}
                  </span>
                </div>

                {/* Base Stitching for Custom Outfits */}
                {orderDetails.isCustom && orderDetails.baseTailoringPrice ? (
                  <div className="flex items-center justify-between text-[#544B45]">
                    <span>Base Stitching ({orderDetails.productName || orderDetails.garment})</span>
                    <span className="font-semibold text-[#1B1512]">
                      ₹{orderDetails.baseTailoringPrice}
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
                          +₹{s.tailoringPrice}
                        </span>
                      </div>
                    ))}

                {orderDetails.accessoriesTotal && orderDetails.accessoriesTotal > 0 ? (
                  <div className="flex items-center justify-between text-[#544B45]">
                    <span>Atelier Embellishments</span>
                    <span className="font-semibold text-[#1B1512]">
                      +₹{orderDetails.accessoriesTotal}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-[#544B45]">
                  <span>Delivery &amp; Logistics</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 border-t border-emerald-100">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Promo Discount ({appliedCoupon?.code})
                    </span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Coupon / Promo Code Input Form */}
              <div className="pt-3 border-t border-[#5C1A32]/10">
                {appliedCoupon ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="font-bold font-mono tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[11px] block text-emerald-700">
                          {appliedCoupon.discountType === 'percentage'
                            ? `${appliedCoupon.discountValue}% Privileged Discount`
                            : `₹${appliedCoupon.discountValue} Flat Discount`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 text-emerald-700 hover:text-emerald-900 rounded-full hover:bg-emerald-100"
                      title="Remove coupon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="PROMO CODE (e.g. BRIDAL15)"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (couponMessage) setCouponMessage(null);
                        }}
                        className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#5C1A32]/25 rounded text-xs font-mono font-bold uppercase text-[#5C1A32] placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400 focus:outline-none focus:border-[#5C1A32]"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-xs"
                      >
                        Apply
                      </button>
                    </div>

                    {couponMessage && (
                      <p
                        className={`text-[11px] font-medium leading-tight ${
                          couponMessage.isError ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {couponMessage.text}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t-2 border-[#5C1A32]/20 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1B1512] block">
                    Total Amount
                  </span>
                  <span className="text-[10px] text-[#8A7968]">Clean inclusive price</span>
                </div>
                <div className="text-right">
                  {discountAmount > 0 && (
                    <span className="text-xs text-neutral-400 line-through block font-mono">
                      ₹{orderDetails.total.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-3xl font-normal text-[#5C1A32]" style={serif}>
                    ₹{effectiveTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {selectedMethod === 'demo' ? (
                  <button
                    onClick={handleDemoPay}
                    disabled={processing}
                    className="w-full py-3.5 px-6 rounded-lg bg-[#B8935A] hover:bg-[#9a7844] text-white text-sm font-bold uppercase tracking-wider shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {processing
                        ? 'Confirming Demo Order...'
                        : `Verify Demo Pay ₹${effectiveTotal}`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handlePay}
                    disabled={processing || !scriptReady}
                    className="w-full py-3.5 px-6 rounded-lg bg-[#5C1A32] hover:bg-[#431224] text-white text-sm font-bold uppercase tracking-wider shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Lock className="h-4 w-4" />
                    <span>
                      {!scriptReady
                        ? 'Loading Gateway...'
                        : processing
                          ? 'Opening Checkout...'
                          : `Pay ₹${effectiveTotal.toLocaleString('en-IN')}`}
                    </span>
                  </button>
                )}

                {/* Instant Demo Pay secondary button */}
                {selectedMethod !== 'demo' && (
                  <button
                    onClick={handleDemoPay}
                    disabled={processing}
                    className="w-full py-2 px-4 rounded-lg bg-[#FAF7F2] hover:bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#B8935A]" />
                    <span>1-Click Instant Demo Checkout</span>
                  </button>
                )}
              </div>

              {/* Security info */}
              <div className="pt-2 text-center text-[10px] text-[#8A7968] space-y-1">
                <p className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>256-bit encryption · Official Razorpay Test / Live API</span>
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
