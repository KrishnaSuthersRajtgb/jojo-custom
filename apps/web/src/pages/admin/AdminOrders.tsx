import { useEffect, useState } from "react";
import {
  Package,
  User,
  Receipt,
  Ruler,
  CheckCircle2,
  Clock,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import type { Address } from "../context/AddressContext";

// ── Design tokens (same family as Home.jsx) ────────────────────────────────
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

// Same shape Payment.tsx writes under jojo_orders_<username>.
interface SavedOrder {
  id: string;
  orderDetails: OrderDetails;
  address: Address;
  paymentId: string | null;
  placedAt: string;
}

interface AdminOrderRow extends SavedOrder {
  username: string;
}

// Mirrors BODY_TYPE_LABELS in OrderTracking.tsx — duplicated locally
// since these are plain page-local constants, not shared exports.
const BODY_TYPE_LABELS: Record<string, string> = {
  invertedTriangle: "The Inverted Triangle",
  column: "The Column",
  rectangle: "The Rectangle",
  apple: "The Apple",
  pear: "The Pear",
  hourglass: "The Hour Glass",
};

const ORDERS_KEY_PREFIX = "jojo_orders_";

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Reads every jojo_orders_<username> key present in this browser's
// localStorage and flattens them into one list, tagging each order with
// which user placed it. NOTE: this only sees orders placed on THIS
// device/browser — there's no backend order store yet, so orders placed
// by a customer on their own device won't appear here unless viewed on
// the same browser profile.
function loadAllOrders(): AdminOrderRow[] {
  const rows: AdminOrderRow[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(ORDERS_KEY_PREFIX)) continue;
    const username = key.slice(ORDERS_KEY_PREFIX.length);
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const orders = JSON.parse(raw) as SavedOrder[];
      orders.forEach((order) => rows.push({ ...order, username }));
    } catch {
      // Skip a malformed entry for this one user rather than failing
      // the whole page.
    }
  }
  return rows.sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setOrders(loadAllOrders());
  }, []);

  const totalRevenue = orders
    .filter((o) => o.paymentId)
    .reduce((sum, o) => sum + o.orderDetails.total, 0);

  return (
    <div className="w-full bg-[#F6F1E7]">
      <section className="w-full px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-[#5C1A32]" />
            <h1 className="text-3xl text-[#1B1512]" style={serif}>
              Admin · All Orders
            </h1>
          </div>
          <p className="text-[#4A413B] text-sm">
            Every order placed on this device, across all accounts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-[#F6F1E7] rounded-sm border border-[#5C1A32]/15 p-5">
              <p className="text-xs text-[#4A413B]/60 mb-1">Total Orders</p>
              <p className="text-2xl text-[#1B1512]" style={serif}>{orders.length}</p>
            </div>
            <div className="bg-[#F6F1E7] rounded-sm border border-[#5C1A32]/15 p-5">
              <p className="text-xs text-[#4A413B]/60 mb-1">Paid Orders</p>
              <p className="text-2xl text-[#1B1512]" style={serif}>
                {orders.filter((o) => o.paymentId).length}
              </p>
            </div>
            <div className="bg-[#F6F1E7] rounded-sm border border-[#5C1A32]/15 p-5">
              <p className="text-xs text-[#4A413B]/60 mb-1">Revenue Collected</p>
              <p className="text-2xl text-[#5C1A32]" style={serif}>
                {formatRupees(totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-6 pb-16">
        <div className="max-w-5xl mx-auto space-y-4">
          {orders.length === 0 ? (
            <div className="bg-[#F6F1E7] rounded-sm border border-[#5C1A32]/15 p-10 text-center">
              <Package className="h-8 w-8 text-[#5C1A32]/25 mx-auto mb-3" />
              <p className="text-[#4A413B]">No orders found on this device yet.</p>
            </div>
          ) : (
            orders.map((order) => {
              const isOpen = expandedId === order.id;
              const d = order.orderDetails;
              return (
                <div
                  key={order.id}
                  className="bg-[#F6F1E7] rounded-sm border border-[#5C1A32]/15 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#1B1512] truncate">
                          {d.fabricName} · {d.garmentLabel ?? d.garment}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4A413B] bg-[#5C1A32]/10 rounded-full px-2 py-0.5">
                          <User className="h-3 w-3" />
                          {order.username}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A413B]/60 mt-0.5">
                        Placed {formatDate(order.placedAt)} · Deliver to{" "}
                        {order.address.fullName}, {order.address.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {order.paymentId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5C1A32] bg-[#5C1A32]/5 border border-[#5C1A32]/15 rounded-full px-2.5 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B8935A] bg-[#B8935A]/10 border border-[#B8935A]/25 rounded-full px-2.5 py-1">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                      <span className="text-lg text-[#5C1A32]" style={serif}>
                        {formatRupees(d.total)}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#4A413B]/50 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#5C1A32]/10 px-5 py-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Left: delivery, style, body type, invoice */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                            Delivery Address
                          </h3>
                          <p className="text-sm text-[#2A211D]">
                            {order.address.fullName} · {order.address.phone}
                          </p>
                          <p className="text-sm text-[#4A413B]">
                            {order.address.line1}
                            {order.address.line2 ? `, ${order.address.line2}` : ""},{" "}
                            {order.address.city}, {order.address.state} -{" "}
                            {order.address.pincode}
                          </p>
                        </div>

                        {d.selections && d.selections.length > 0 && (
                          <div>
                            <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                              Style Selected
                            </h3>
                            <div className="space-y-1">
                              {d.selections.map((sel, idx) => (
                                <div
                                  key={`${sel.sectionLabel}-${idx}`}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-[#4A413B]">{sel.sectionLabel}</span>
                                  <span className="font-medium text-[#1B1512]">
                                    {sel.subOptionLabel ?? sel.optionLabel ?? "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {d.bodyType && (
                          <div>
                            <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                              Body Type
                            </h3>
                            <span className="inline-flex items-center text-sm font-semibold text-[#5C1A32] bg-[#5C1A32]/5 border border-[#5C1A32]/15 rounded-full px-3 py-1.5">
                              {BODY_TYPE_LABELS[d.bodyType] ?? d.bodyType}
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Receipt className="h-3.5 w-3.5 text-[#5C1A32]" />
                            <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                              Invoice
                            </h3>
                          </div>
                          <div className="flex items-center justify-between text-sm py-1 border-b border-[#5C1A32]/10">
                            <span className="text-[#4A413B]">
                              {d.fabricName} ({d.meters}m × {formatRupees(d.pricePerMeter)})
                            </span>
                            <span className="font-medium text-[#1B1512]">
                              {formatRupees(d.fabricTotal ?? d.total)}
                            </span>
                          </div>
                          {d.accessories &&
                            d.accessories.length > 0 &&
                            d.accessories.map((a) => (
                              <div
                                key={a.id}
                                className="flex items-center justify-between text-sm py-1 border-b border-[#5C1A32]/10"
                              >
                                <span className="text-[#4A413B]">{a.label}</span>
                                <span className="font-medium text-[#1B1512]">
                                  +{formatRupees(a.price)}
                                </span>
                              </div>
                            ))}
                          <div className="flex items-center justify-between text-sm pt-2 font-bold">
                            <span className="text-[#1B1512]">Total Paid</span>
                            <span className="text-[#5C1A32]">
                              {formatRupees(d.total)}
                            </span>
                          </div>
                          {order.paymentId && (
                            <p className="text-xs text-[#4A413B]/60 mt-2">
                              Payment ID: {order.paymentId}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: size details */}
                      {d.measurementValues &&
                        Object.keys(d.measurementValues).length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Ruler className="h-3.5 w-3.5 text-[#5C1A32]" />
                              <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                                Size Details Used
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {Object.entries(d.measurementValues).map(
                                ([label, value], idx) => (
                                  <div key={label} className="flex items-center gap-2 text-sm">
                                    <span className="w-4 text-xs text-[#4A413B]/50">
                                      {idx + 1}
                                    </span>
                                    <span className="flex-1 text-[#4A413B]">{label}</span>
                                    <span className="font-medium text-[#1B1512]">
                                      {value && value.trim() !== "" ? value : "0.0"} in
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}