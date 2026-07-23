import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  ArrowLeft,
  Ruler,
  Scissors,
  MapPin,
  Home,
  Briefcase,
  Pencil,
} from "lucide-react";
import { useAddresses, type AddressType } from "../context/AddressContext";

const TYPE_META: Record<AddressType, { label: string; icon: typeof Home }> = {
  home: { label: "Home", icon: Home },
  work: { label: "Work", icon: Briefcase },
  other: { label: "Other", icon: MapPin },
};

interface OrderDetails {
  fabricId: string;
  fabricName: string;
  tone: string;
  garment: string;
  meters: number;
  pricePerMeter: number;
  total: number;
}

export default function Order() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderDetails = location.state as OrderDetails | null;
  const { defaultAddress } = useAddresses();

  // Guard: someone landed on /order directly without going through Buy Now
  if (!orderDetails) {
    return <Navigate to="/fabrics" replace />;
  }

  const handlePlaceOrder = () => {
    if (!defaultAddress) {
      void navigate("/addresses");
      return;
    }
    void navigate("/payment", { state: { orderDetails, address: defaultAddress } });
  };

  return (
    <div className="w-full">
      <section className="w-full px-6 py-10 bg-rose-50/40">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => { void navigate(-1); }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-6 w-6 text-fuchsia-800" />
            <h1 className="text-4xl font-serif font-bold text-gray-900">
              Review Your Order
            </h1>
          </div>
          <p className="text-gray-500">
            Confirm the details before placing your order
          </p>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-wide text-gray-800">
                DELIVERY ADDRESS
              </h2>
              {defaultAddress && (
                <button
                  onClick={() => { void navigate("/addresses"); }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-fuchsia-800 hover:underline"
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
                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-gray-800 mb-2">
                      <TypeIcon className="h-3.5 w-3.5" />
                      {TYPE_META[defaultAddress.type].label.toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900">{defaultAddress.fullName}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {defaultAddress.line1}
                      {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}
                      {defaultAddress.landmark ? `, Near ${defaultAddress.landmark}` : ""}
                      <br />
                      {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{defaultAddress.phone}</p>
                  </div>
                );
              })()
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 px-4 py-4">
                <p className="text-sm text-gray-500">
                  No delivery address saved yet.
                </p>
                <Button size="sm" onClick={() => { void navigate("/addresses"); }}>
                  Add Address
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xs font-bold tracking-wide text-gray-800 mb-4">
                ORDER SUMMARY
              </h2>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Scissors className="h-4 w-4" />
                Fabric
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {orderDetails.fabricName}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Garment</span>
              <span className="text-sm font-semibold text-gray-900 capitalize">
                {orderDetails.garment}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Ruler className="h-4 w-4" />
                Meters
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {orderDetails.meters}m
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Price per meter</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{orderDetails.pricePerMeter}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-xl font-bold text-fuchsia-800">
                ₹{orderDetails.total}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={handlePlaceOrder}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-800 to-pink-600 text-white font-semibold py-3 hover:opacity-95 transition-opacity"
            >
              {defaultAddress ? "Place Order" : "Add an address to continue"}
            </button>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}