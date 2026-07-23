import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { Address } from "../context/AddressContext";

interface OrderDetails {
  fabricId: string;
  fabricName: string;
  tone: string;
  garment: string;
  meters: number;
  pricePerMeter: number;
  total: number;
}

interface PaymentState {
  orderDetails: OrderDetails;
  address: Address;
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
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
const RAZORPAY_KEY_ID = "rzp_test_TGQs3nWcBn0Joq"; // TODO: replace with your Razorpay key

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { resolve(true); };
    script.onerror = () => { resolve(false); };
    document.body.appendChild(script);
  });
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PaymentState | null;

  const [scriptReady, setScriptReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
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

  const handlePay = () => {
    if (!scriptReady) {
      setError("Payment gateway is still loading. Please try again in a moment.");
      return;
    }
    setError("");
    setProcessing(true);

    // NOTE: For production, create the order server-side first
    // (POST /api/razorpay/order with amount) and pass the returned
    // order_id below instead of omitting it. Omitting order_id only
    // works in Razorpay test mode.
    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID,
      amount: orderDetails.total * 100, // amount in paise
      currency: "INR",
      name: "JoJo Boutique",
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
        color: "#86198f", // fuchsia-800
      },
      handler: (response) => {
        setPaymentId(response.razorpay_payment_id);
        setPaid(true);
        setProcessing(false);
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
        },
      },
    };

    if (!window.Razorpay) {
      setError("Payment gateway failed to load. Please refresh and try again.");
      setProcessing(false);
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", () => {
      setError("Payment failed. Please try again.");
      setProcessing(false);
    });
    rzp.open();

  if (paid) {
    return (
      <div className="w-full">
        <section className="w-full px-6 py-20 bg-rose-50/40">
          <div className="max-w-md mx-auto text-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-fuchsia-800 to-pink-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Payment successful!
            </h1>
            <p className="text-gray-500 mb-1">
              Thank you for your order. We'll start preparing it right away.
            </p>
            {paymentId && (
              <p className="text-sm text-gray-400 mb-8">
                Payment ID: <span className="font-semibold text-gray-700">{paymentId}</span>
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { void navigate("/fabrics"); }}>
  Continue Shopping
</Button>
             <Button variant="ghost" onClick={() => { void navigate("/addresses"); }}>
  View Addresses
</Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="w-full px-6 py-10 bg-rose-50/40">
        <div className="max-w-xl mx-auto">
          <button
  onClick={() => { void navigate(-1); }}
  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-fuchsia-800" />
            <h1 className="text-4xl font-serif font-bold text-gray-900">
              Payment
            </h1>
          </div>
          <p className="text-gray-500">Secure checkout powered by Razorpay</p>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-xl mx-auto space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold tracking-wide text-gray-800 mb-4">
              AMOUNT TO PAY
            </h2>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">
                {orderDetails.fabricName} · {orderDetails.garment}
              </span>
              <span className="text-xl font-bold text-fuchsia-800">
                ₹{orderDetails.total}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
              Deliver to: <span className="font-medium text-gray-800">{address.fullName}</span>,{" "}
              {address.city}, {address.state} - {address.pincode}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={processing || !scriptReady}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-800 to-pink-600 text-white font-semibold py-3 hover:opacity-95 transition-opacity disabled:opacity-60"
          >
            {!scriptReady
              ? "Loading payment gateway..."
              : processing
              ? "Processing..."
              : `Pay ₹${orderDetails.total.toString()}`}
          </button>
        </div>
      </section>
    </div>
  );
}