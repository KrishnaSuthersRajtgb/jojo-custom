import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Address } from '../context/AddressContext';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink-600)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for page titles only.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface SelectionEntry {
  sectionLabel: string;
  optionLabel: string | null;
  subOptionLabel: string | null;
}

interface AccessoryEntry {
  id: string;
  label: string;
  price: number;
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
  productId?: string;
  productName?: string;
  selections?: SelectionEntry[] | null;
  accessories?: AccessoryEntry[];
  accessoriesTotal?: number;
  measurementValues?: Record<string, string> | null;
  bodyType?: string | null;
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
const RAZORPAY_KEY_ID = 'rzp_test_TGQs3nWcBn0Joq'; // TODO: replace with your Razorpay key

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

  useEffect(() => {
    void loadRazorpayScript().then(setScriptReady);
  }, []);

  // Guard: someone landed here directly without going through Order review
  if (!state) {
    return <Navigate to="/fabrics" replace />;
  }

  const { orderDetails, address } = state;

  const saveOrder = (razorpayPaymentId: string | null) => {
    const newOrder: SavedOrder = {
      id: razorpayPaymentId ?? `local_${String(Date.now())}`,
      orderDetails,
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
  };

  const handlePay = () => {
    if (!scriptReady) {
      setError('Payment gateway is still loading. Please try again in a moment.');
      return;
    }
    setError('');
    setProcessing(true);

    // NOTE: For production, create the order server-side first
    // (POST /api/razorpay/order with amount) and pass the returned
    // order_id below instead of omitting it. Omitting order_id only
    // works in Razorpay test mode.
    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID,
      amount: orderDetails.total * 100, // amount in paise
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
    rzp.on('payment.failed', () => {
      setError('Payment failed. Please try again.');
      setProcessing(false);
    });
    rzp.open();
  };

  if (paid) {
    return (
      // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
      // background filling the viewport instead of showing white below
      // shorter content.
      <div className="w-full min-h-screen bg-[#F6F1E7] pt-16">
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

  return (
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] pt-16">
      <section className="w-full px-6 pt-8 pb-6">
        <div className="max-w-xl mx-auto">
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
            <ShieldCheck className="h-6 w-6 text-[#5C1A32]" />
            <h1 className="text-4xl text-[#1B1512]" style={serif}>
              Payment
            </h1>
          </div>
          <p className="text-[#4A413B]">Secure checkout powered by Razorpay</p>
        </div>
      </section>

      <section className="w-full px-6 pb-16">
        <div className="max-w-xl mx-auto space-y-5">
          <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
              Amount To Pay
            </h2>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#4A413B]">
                {orderDetails.fabricName} · {orderDetails.garment}
              </span>
              <span className="text-xl font-bold text-[#5C1A32]" style={serif}>
                ₹{orderDetails.total}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-[#5C1A32]/10 text-sm text-[#4A413B]">
              Deliver to: <span className="font-medium text-[#1B1512]">{address.fullName}</span>,{' '}
              {address.city}, {address.state} - {address.pincode}
            </div>
          </div>

          {error && (
            <div className="rounded-sm bg-[#5C1A32]/5 border border-[#5C1A32]/30 text-[#5C1A32] text-sm px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={processing || !scriptReady}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-semibold py-3 hover:bg-[#5C1A32] transition-colors disabled:opacity-60"
          >
            {!scriptReady
              ? 'Loading payment gateway...'
              : processing
                ? 'Processing...'
                : `Pay ₹${orderDetails.total.toString()}`}
          </button>
        </div>
      </section>
    </div>
  );
}
