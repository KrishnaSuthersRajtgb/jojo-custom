import { useEffect, useMemo, useState } from "react";
import {
  Package,
  User,
  Receipt,
  Ruler,
  CheckCircle2,
  Clock,
  ChevronDown,
  ShieldCheck,
  Search,
  TrendingUp,
  Users,
  AlertTriangle,
  LayoutDashboard,
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

// Fulfilment stage of an order. Mirrors the steps shown to the customer
// in OrderTracking.tsx. Orders saved before this field existed won't have
// it, so callers should fall back to "placed".
type OrderStatus = "placed" | "packed" | "dispatched" | "delivered";

const ORDER_STATUS_STEPS: { value: OrderStatus; label: string }[] = [
  { value: "placed", label: "Order Placed" },
  { value: "packed", label: "Packed & Ready" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
];

// Same shape Payment.tsx writes under jojo_orders_<username>.
interface SavedOrder {
  id: string;
  orderDetails: OrderDetails;
  address: Address;
  paymentId: string | null;
  placedAt: string;
  status?: OrderStatus;
}

interface AdminOrderRow extends SavedOrder {
  username: string;
}

// Rewrites a single order's status inside the correct
// jojo_orders_<username> localStorage entry, leaving everything else in
// that array untouched.
function persistOrderStatus(
  username: string,
  orderId: string,
  status: OrderStatus
): boolean {
  const key = ORDERS_KEY_PREFIX + username;
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  try {
    const orders = JSON.parse(raw) as SavedOrder[];
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
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

type StatusFilter = "all" | "paid" | "pending";
type AdminSection = "dashboard" | "orders";

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

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
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
function loadAllOrders(): { rows: AdminOrderRow[]; malformedKeys: string[] } {
  const rows: AdminOrderRow[] = [];
  const malformedKeys: string[] = [];
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
      // the whole page, but surface it so an admin can investigate.
      malformedKeys.push(key);
    }
  }
  rows.sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
  return { rows, malformedKeys };
}

const NAV_ITEMS: { key: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: Package },
];

export default function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [malformedKeys, setMalformedKeys] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    const { rows, malformedKeys } = loadAllOrders();
    setOrders(rows);
    setMalformedKeys(malformedKeys);
  }, []);

  const uniqueCustomers = useMemo(
    () => new Set(orders.map((o) => o.username)).size,
    [orders]
  );

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.paymentId)
        .reduce((sum, o) => sum + o.orderDetails.total, 0),
    [orders]
  );

  const handleStatusChange = (order: AdminOrderRow, status: OrderStatus) => {
    const ok = persistOrderStatus(order.username, order.id, status);
    if (!ok) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id && o.username === order.username ? { ...o, status } : o
      )
    );
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const d = order.orderDetails;
      if (statusFilter === "paid" && !order.paymentId) return false;
      if (statusFilter === "pending" && order.paymentId) return false;
      if (!q) return true;
      const haystack = [
        order.username,
        order.address.fullName,
        order.address.city,
        d.fabricName,
        d.garmentLabel ?? d.garment,
        order.paymentId ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, search, statusFilter]);

  const statCards = (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8">
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
        <div className="flex items-center gap-1 mb-1">
          <Users className="h-3 w-3 text-[#4A413B]/50" />
          <p className="text-xs text-[#4A413B]/60">Customers</p>
        </div>
        <p className="text-2xl text-[#1B1512]" style={serif}>{uniqueCustomers}</p>
      </div>
      <div className="bg-[#F6F1E7] rounded-sm border border-[#5C1A32]/15 p-5">
        <div className="flex items-center gap-1 mb-1">
          <TrendingUp className="h-3 w-3 text-[#5C1A32]" />
          <p className="text-xs text-[#4A413B]/60">Revenue Collected</p>
        </div>
        <p className="text-2xl text-[#5C1A32]" style={serif}>
          {formatRupees(totalRevenue)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full flex bg-[#F6F1E7]">
      {/* Left sidebar nav */}
      <aside className="w-56 shrink-0 border-r border-[#5C1A32]/15 bg-[#F6F1E7] min-h-screen py-8 px-3 hidden md:block">
        <div className="flex items-center gap-2 px-3 mb-8">
          <ShieldCheck className="h-5 w-5 text-[#5C1A32]" />
          <span className="text-[#1B1512]" style={serif}>Admin</span>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium tracking-wide transition-colors ${
                  active
                    ? "bg-[#1B1512] text-[#F6F1E7]"
                    : "text-[#4A413B] hover:bg-[#5C1A32]/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {section === "dashboard" && (
          <section className="w-full px-6 py-10">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-6 w-6 text-[#5C1A32]" />
                <h1 className="text-3xl text-[#1B1512]" style={serif}>
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-[#4A413B] text-sm">
                Every order placed on this device, across all accounts.
              </p>

              {malformedKeys.length > 0 && (
                <div className="mt-4 flex items-start gap-2 bg-[#5C1A32]/5 border border-[#5C1A32]/25 text-[#5C1A32] rounded-sm px-4 py-3 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Couldn&apos;t parse {malformedKeys.length} order record
                    {malformedKeys.length > 1 ? "s" : ""} (
                    {malformedKeys.join(", ")}
                    ). They were skipped rather than crashing the page.
                  </span>
                </div>
              )}

              {statCards}

              <button
                type="button"
                onClick={() => setSection("orders")}
                className="mt-8 inline-flex items-center gap-2 bg-[#1B1512] text-[#F6F1E7] text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-[#5C1A32] transition-colors"
              >
                <Package className="h-4 w-4" />
                View all orders
              </button>
            </div>
          </section>
        )}

        {section === "orders" && (
          <>
            <section className="w-full px-6 py-10">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-6 w-6 text-[#5C1A32]" />
                  <h1 className="text-3xl text-[#1B1512]" style={serif}>
                    Orders
                  </h1>
                </div>
                <p className="text-[#4A413B] text-sm">
                  Every order placed on this device, across all accounts.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 text-[#4A413B]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by customer, fabric, city, payment id…"
                      className="w-full pl-9 pr-3 py-2.5 rounded-sm border border-[#5C1A32]/20 bg-[#F6F1E7] text-sm text-[#1B1512] focus:outline-none focus:ring-1 focus:ring-[#5C1A32] focus:border-[#5C1A32]"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(["all", "paid", "pending"] as StatusFilter[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2.5 rounded-sm text-sm font-medium capitalize transition-colors ${
                          statusFilter === s
                            ? "bg-[#1B1512] text-[#F6F1E7]"
                            : "bg-[#F6F1E7] border border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full px-6 pb-16">
              <div className="max-w-5xl mx-auto space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-[#F6F1E7] rounded-sm border border-[#5C1A32]/15 p-10 text-center">
                    <Package className="h-8 w-8 text-[#5C1A32]/25 mx-auto mb-3" />
                    <p className="text-[#4A413B]">
                      {orders.length === 0
                        ? "No orders found on this device yet."
                        : "No orders match your search/filter."}
                    </p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
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
                                  Order Status
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {ORDER_STATUS_STEPS.map((step) => {
                                    const current = (order.status ?? "placed") === step.value;
                                    return (
                                      <button
                                        key={step.value}
                                        type="button"
                                        onClick={() => handleStatusChange(order, step.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                          current
                                            ? "bg-[#1B1512] text-[#F6F1E7]"
                                            : "bg-[#5C1A32]/8 text-[#4A413B] hover:bg-[#5C1A32]/15"
                                        }`}
                                      >
                                        {step.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                                  Delivery Address
                                </h3>
                                <p className="text-sm text-[#2A211D]">
                                  {order.address.fullName} · {order.address.phone}
                                </p>
                                <p className="text-sm text-[#4A413B]">
                                  {order.address.line1}
                                  {order.address.line2
                                    ? `, ${order.address.line2}`
                                    : ""}
                                  , {order.address.city}, {order.address.state} -{" "}
                                  {order.address.pincode}
                                </p>
                              </div>

                              {d.selections && d.selections.length > 0 && (
                                <div>
                                  <h3 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                                    Style Selected
                                  </h3>
                                  <table className="w-full text-sm border-collapse">
                                    <tbody>
                                      {d.selections.map((sel, idx) => (
                                        <tr
                                          key={`${sel.sectionLabel}-${idx}`}
                                          className="border-b border-[#5C1A32]/10 last:border-0"
                                        >
                                          <td className="py-1.5 pr-2 text-[#4A413B] align-middle">
                                            {sel.sectionLabel}
                                          </td>
                                          <td className="py-1.5 pl-2 text-right font-medium text-[#1B1512] align-middle">
                                            {sel.subOptionLabel ?? sel.optionLabel ?? "—"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
                                <table className="w-full text-sm border-collapse">
                                  <tbody>
                                    <tr className="border-b border-[#5C1A32]/10">
                                      <td className="py-1.5 pr-2 text-[#4A413B] align-middle">
                                        {d.fabricName} ({d.meters}m ×{" "}
                                        {formatRupees(d.pricePerMeter)})
                                      </td>
                                      <td className="py-1.5 pl-2 text-right font-medium text-[#1B1512] align-middle whitespace-nowrap">
                                        {formatRupees(d.fabricTotal ?? d.total)}
                                      </td>
                                    </tr>
                                    {d.accessories &&
                                      d.accessories.length > 0 &&
                                      d.accessories.map((a) => (
                                        <tr key={a.id} className="border-b border-[#5C1A32]/10">
                                          <td className="py-1.5 pr-2 text-[#4A413B] align-middle">
                                            {a.label}
                                          </td>
                                          <td className="py-1.5 pl-2 text-right font-medium text-[#1B1512] align-middle whitespace-nowrap">
                                            +{formatRupees(a.price)}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                  <tfoot>
                                    <tr>
                                      <td className="pt-2 text-[#1B1512] font-bold align-middle">
                                        Total Paid
                                      </td>
                                      <td className="pt-2 text-right font-bold text-[#5C1A32] align-middle whitespace-nowrap">
                                        {formatRupees(d.total)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                                {order.paymentId && (
                                  <p className="text-xs text-[#4A413B]/60 mt-2">
                                    Payment ID: {order.paymentId} · Placed{" "}
                                    {formatDateTime(order.placedAt)}
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
                                  <table className="w-full text-sm border-collapse">
                                    <thead>
                                      <tr className="text-left text-[11px] uppercase tracking-wide text-[#4A413B]/50 border-b border-[#5C1A32]/10">
                                        <th className="py-2 pr-2 font-medium w-8">#</th>
                                        <th className="py-2 pr-2 font-medium">
                                          Measurement
                                        </th>
                                        <th className="py-2 pl-2 font-medium text-right w-24">
                                          Value
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(d.measurementValues).map(
                                        ([label, value], idx) => (
                                          <tr
                                            key={label}
                                            className="border-b border-[#5C1A32]/10 last:border-0"
                                          >
                                            <td className="py-2 pr-2 text-xs text-[#4A413B]/50 align-middle">
                                              {idx + 1}
                                            </td>
                                            <td className="py-2 pr-2 text-[#4A413B] align-middle">
                                              {label}
                                            </td>
                                            <td className="py-2 pl-2 text-right font-medium text-[#1B1512] align-middle whitespace-nowrap">
                                              {value && value.trim() !== ""
                                                ? value
                                                : "0.0"}{" "}
                                              in
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
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
          </>
        )}
      </div>
    </div>
  );
}