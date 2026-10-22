import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Package,
  ArrowLeft,
  Ruler,
  Receipt,
  User,
  ImagePlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services';
import type { Address } from '../context/AddressContext';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink-600)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Status colors (green = paid, amber = pending) are kept as-is since
// they carry semantic meaning independent of the brand palette.
// Display face: Fraunces, for page/card titles.

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

// Reference photo carried through from ProductStyle.tsx all the way to
// the saved order via ProductAccessories.tsx / ProductSummary.tsx /
// Order.tsx / Payment.tsx.
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
  productId?: string;
  productName?: string;
  selections?: SelectionEntry[] | null;
  accessories?: AccessoryEntry[];
  accessoriesTotal?: number;
  measurementValues?: Record<string, string> | null;
  bodyType?: string | null;
  referenceImage?: ReferenceImage | null;
}

// Mirrors the labels in BodyTypeSelector.tsx / MeasurementSidebar.tsx —
// duplicated here (not imported) since those files export components,
// not the label map, and this page shouldn't depend on their internals.
const BODY_TYPE_LABELS: Record<string, string> = {
  invertedTriangle: 'The Inverted Triangle',
  column: 'The Column',
  rectangle: 'The Rectangle',
  apple: 'The Apple',
  pear: 'The Pear',
  hourglass: 'The Hour Glass',
};

// Fulfilment stage of an order, set by the admin dashboard
// (AdminDashboard.tsx writes this same field into the saved order).
// Orders saved before this field existed won't have it, so we fall back
// to "placed" wherever it's read.
type OrderStatus = 'placed' | 'packed' | 'dispatched' | 'delivered';

const STATUS_ORDER: OrderStatus[] = ['placed', 'packed', 'dispatched', 'delivered'];

// Static copy for each stage of the timeline. The live "done / current /
// pending" state is computed from the order's status, not hardcoded here.
const TIMELINE_STEP_INFO: { title: string; dayLabel: string; description: string }[] = [
  {
    title: 'Order Placed',
    dayLabel: 'Today',
    description: 'Payment confirmed',
  },
  {
    title: 'Packed & Ready',
    dayLabel: 'Day 1',
    description: 'Fabric packed for shipment',
  },
  {
    title: 'Dispatched',
    dayLabel: 'Day 2–3',
    description: 'On its way to you',
  },
  {
    title: 'Delivered',
    dayLabel: 'Day 4–5',
    description: 'Arrived at your doorstep',
  },
];

interface OrderTrackingState {
  orderDetails: OrderDetails;
  address: Address;
  paymentId?: string | null;
  status?: OrderStatus;
}

// A completed order as saved by Payment.tsx on successful checkout, and
// later updated by the admin dashboard as it moves through fulfilment.
interface SavedOrder {
  id: string;
  orderDetails: OrderDetails;
  address: Address;
  paymentId: string | null;
  placedAt: string;
  status?: OrderStatus;
}

type StepStatus = 'done' | 'current' | 'pending';

interface TimelineStep {
  title: string;
  dayLabel: string;
  description: string;
  status: StepStatus;
}

// Builds the 4-step timeline from whatever status is currently stored on
// the order (defaulting to "placed" for orders saved before admin status
// tracking existed).
function buildTimelineSteps(status: OrderStatus | undefined): TimelineStep[] {
  const currentIndex = STATUS_ORDER.indexOf(status ?? 'placed');
  // Once the order has reached the final stage (Delivered), that step is
  // complete, not "in progress" — there's nothing left to progress to.
  const isFinalStage = currentIndex === STATUS_ORDER.length - 1;
  return TIMELINE_STEP_INFO.map((info, index) => {
    let stepStatus: StepStatus;
    if (index < currentIndex || (index === currentIndex && isFinalStage)) {
      stepStatus = 'done';
    } else if (index === currentIndex) {
      stepStatus = 'current';
    } else {
      stepStatus = 'pending';
    }
    return { ...info, status: stepStatus };
  });
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function OrderTracking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Present right after a successful payment (Payment.tsx navigates here
  // with this state). Absent when arriving via Navbar's "My Orders" link.
  const freshOrder = location.state as OrderTrackingState | null;

  // Same key Payment.tsx writes to.
  const ordersKey = `jojo_orders_${user?.username ?? 'guest'}`;
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);

  // Which order's timeline is currently shown. Starts as the fresh
  // post-payment order if there is one; otherwise null, which shows the
  // My Orders list first.
  const [activeOrder, setActiveOrder] = useState<OrderTrackingState | SavedOrder | null>(
    freshOrder,
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ordersKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        setSavedOrders(Array.isArray(parsed) ? (parsed as SavedOrder[]) : []);
      }
    } catch {
      setSavedOrders([]);
    }

    orderApi
      .getUserOrders(user?.username)
      .then((res) => {
        if (res.data.length > 0) {
          const mapped: SavedOrder[] = res.data.map((o) => ({
            id: o.id,
            orderDetails: o.orderDetails as unknown as OrderDetails,
            address: o.address as unknown as Address,
            paymentId: o.paymentId,
            placedAt: o.placedAt,
            status: o.status as OrderStatus,
          }));
          setSavedOrders(mapped);
          localStorage.setItem(ordersKey, JSON.stringify(mapped));
        }
      })
      .catch(() => {
        // Keep cached orders on failure
      });
  }, [ordersKey, user]);

  // --- My Orders list (no order currently selected) ---------------------
  if (!activeOrder) {
    return (
      // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
      // background filling the viewport instead of showing white below
      // shorter content.
      <div className="w-full min-h-screen bg-[#F6F1E7] pt-16">
        <section className="w-full px-6 pt-8 pb-6">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-6 w-6 text-[#5C1A32]" />
              <h1 className="text-3xl text-[#1B1512]" style={serif}>
                My Orders
              </h1>
            </div>
            <p className="text-[#4A413B]">Your past orders and their payment status.</p>
          </div>
        </section>

        <section className="w-full px-6 pb-16">
          <div className="max-w-xl mx-auto space-y-4">
            {savedOrders.length === 0 ? (
              <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-8 text-center">
                <p className="text-[#4A413B] mb-4">You haven't placed any orders yet.</p>
                <button
                  onClick={() => {
                    void navigate('/fabrics');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-semibold px-5 py-2.5 hover:bg-[#5C1A32] transition-colors"
                >
                  Browse Fabrics
                </button>
              </div>
            ) : (
              savedOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setActiveOrder(order);
                  }}
                  className="w-full text-left bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-5 hover:border-[#5C1A32]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#1B1512]">
                        {order.orderDetails.fabricName} · {order.orderDetails.garment}
                      </p>
                      <p className="text-xs text-[#4A413B]/60 mt-0.5">
                        Placed {formatDate(order.placedAt)}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-[#5C1A32] shrink-0" style={serif}>
                      {formatRupees(order.orderDetails.total)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {order.paymentId ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          Payment successful
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">Payment pending</span>
                      </>
                    )}
                    {order.orderDetails.measurementValues &&
                      Object.keys(order.orderDetails.measurementValues).length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5C1A32] bg-[#5C1A32]/8 rounded-full px-2 py-0.5 ml-1">
                          <Ruler className="h-3 w-3" />
                          Size saved
                        </span>
                      )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  // --- Timeline for the selected / fresh order ---------------------------
  const { orderDetails, paymentId, status } = activeOrder;
  const cameFromList = !freshOrder;
  const timelineSteps = buildTimelineSteps(status);

  return (
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] pt-16">
      <section className="w-full px-6 pt-8 pb-6">
        <div className="max-w-4xl mx-auto">
          {cameFromList && (
            <button
              onClick={() => {
                setActiveOrder(null);
              }}
              className="inline-flex items-center gap-1.5 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Orders
            </button>
          )}

          <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h1 className="text-2xl text-[#1B1512]" style={serif}>
                Order Timeline
              </h1>
              {paymentId ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  Payment pending
                </span>
              )}
            </div>
            <p className="text-sm text-[#4A413B] mb-6">
              {orderDetails.fabricName} · {orderDetails.garment} ·{' '}
              {formatRupees(orderDetails.total)}
            </p>

            <ol>
              {timelineSteps.map((step, index) => {
                const isLast = index === timelineSteps.length - 1;
                const isDone = step.status === 'done';
                const isCurrent = step.status === 'current';

                return (
                  <li key={step.title} className="relative pl-0">
                    <div className="flex gap-4">
                      {/* Icon + connecting line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={
                            'h-9 w-9 rounded-full flex items-center justify-center shrink-0 ' +
                            (isDone
                              ? 'bg-[#1B1512]'
                              : isCurrent
                                ? 'border-2 border-[#5C1A32] bg-white'
                                : 'border-2 border-[#5C1A32]/15 bg-white')
                          }
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-[#F6F1E7]" />
                          ) : (
                            <div
                              className={
                                'h-2.5 w-2.5 rounded-full ' +
                                (isCurrent ? 'bg-[#5C1A32]' : 'bg-[#5C1A32]/15')
                              }
                            />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={
                              'w-0.5 flex-1 min-h-[2.5rem] ' +
                              (isDone ? 'bg-[#1B1512]' : 'bg-[#5C1A32]/15')
                            }
                          />
                        )}
                      </div>

                      {/* Text content */}
                      <div className={isLast ? 'pb-0' : 'pb-8'}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={
                              (isDone || isCurrent ? 'text-[#1B1512]' : 'text-[#4A413B]') +
                              ' font-semibold'
                            }
                            style={serif}
                          >
                            {step.title}
                          </span>
                          <span className="text-xs font-medium text-[#4A413B] bg-[#5C1A32]/8 rounded-full px-2 py-0.5">
                            {step.dayLabel}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-medium text-[#5C1A32] bg-[#5C1A32]/10 rounded-full px-2 py-0.5">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#4A413B] mt-1">{step.description}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section className="w-full px-6 pb-6">
        {/* Two columns: order info (style, body type, reference photo,
            invoice) on the left, size details — the longest section —
            pinned to the right so it gets its own column instead of
            stretching the page length underneath everything else. */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Left column: style + body type + reference photo + invoice */}
          <div className="space-y-5">
            {/* Style selected — only present for "Customize to JOJO" orders */}
            {orderDetails.selections && orderDetails.selections.length > 0 && (
              <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
                <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
                  Style Selected
                </h2>
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

            {/* Body type used for this order */}
            {orderDetails.bodyType && (
              <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-[#B8935A]" />
                  <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                    Body Type
                  </h2>
                </div>
                <span className="inline-flex items-center text-sm font-semibold text-[#5C1A32] bg-[#5C1A32]/8 rounded-full px-3 py-1.5">
                  {BODY_TYPE_LABELS[orderDetails.bodyType] ?? orderDetails.bodyType}
                </span>
              </div>
            )}

            {/* Reference photo — only present if the client uploaded one
                on the style page. */}
            {orderDetails.referenceImage && (
              <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImagePlus className="h-4 w-4 text-[#B8935A]" />
                  <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                    Reference Photo
                  </h2>
                </div>
                <img
                  src={orderDetails.referenceImage.dataUrl}
                  alt="Reference upload"
                  className="h-32 w-32 rounded-sm object-cover border border-[#5C1A32]/10"
                />
              </div>
            )}

            {/* Invoice */}
            <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-4 w-4 text-[#B8935A]" />
                <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                  Invoice
                </h2>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#5C1A32]/10">
                <span className="text-sm text-[#4A413B]">
                  {orderDetails.fabricName} ({orderDetails.meters}m ×{' '}
                  {formatRupees(orderDetails.pricePerMeter)})
                </span>
                <span className="text-sm font-semibold text-[#1B1512]">
                  {formatRupees(orderDetails.fabricTotal ?? orderDetails.total)}
                </span>
              </div>

              {orderDetails.accessories && orderDetails.accessories.length > 0 && (
                <>
                  {orderDetails.accessories.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between py-2 border-b border-[#5C1A32]/10"
                    >
                      <span className="text-sm text-[#4A413B]">{a.label}</span>
                      <span className="text-sm font-semibold text-[#1B1512]">
                        +{formatRupees(a.price)}
                      </span>
                    </div>
                  ))}
                </>
              )}

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-bold text-[#1B1512]">Total Paid</span>
                <span className="text-lg font-bold text-[#5C1A32]" style={serif}>
                  {formatRupees(orderDetails.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Right column: size details — the longest section, given its
              own column so it doesn't stack under everything else and
              stretch the page length. */}
          {orderDetails.measurementValues &&
            Object.keys(orderDetails.measurementValues).length > 0 && (
              <div className="bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm overflow-hidden lg:sticky lg:top-24">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#5C1A32]/10">
                  <Ruler className="h-4 w-4 text-[#B8935A]" />
                  <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                    Size Details Used
                  </h2>
                </div>
                <div className="p-6 space-y-3 max-h-[28rem] overflow-y-auto">
                  {Object.entries(orderDetails.measurementValues).map(([label, value], idx) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-semibold text-[#B8935A]">{idx + 1}</span>
                      <span className="flex-1 text-sm text-[#2A211D]">{label}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-14 rounded-sm border border-[#5C1A32]/20 px-2 py-1.5 text-sm text-center text-[#1B1512] font-medium">
                          {value && value.trim() !== '' ? value : '0.0'}
                        </span>
                        <span className="text-xs text-[#4A413B]/60">in</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </section>

      <section className="w-full px-6 pb-10">
        <div className="max-w-4xl mx-auto flex gap-3">
          {cameFromList && (
            <button
              onClick={() => {
                setActiveOrder(null);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm border border-[#5C1A32] text-[#5C1A32] font-semibold py-3 hover:bg-[#5C1A32]/5 transition-colors"
            >
              Back to My Orders
            </button>
          )}
          <button
            onClick={() => {
              void navigate('/');
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-semibold py-3 hover:bg-[#5C1A32] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </section>
    </div>
  );
}
