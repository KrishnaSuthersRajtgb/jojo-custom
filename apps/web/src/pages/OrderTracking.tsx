import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Ruler,
  FileText,
  Truck,
  Sparkles,
  Scissors,
  Star,
  ShieldCheck,
  Send,
  Check,
  Lock,
  Share2,
} from 'lucide-react';
import SEOMeta from '../components/SEOMeta';
import { useAuth } from '../context/AuthContext';
import { orderApi, reviewApi } from '../services';
import type { Address } from '../context/AddressContext';
import AmazonInvoiceModal from '../components/AmazonInvoiceModal';
import { getCoutureSketchForGarment } from '../utils/coutureSketches';

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

type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'cutting'
  | 'stitching'
  | 'qc-check'
  | 'packed'
  | 'dispatched'
  | 'delivered';

interface StatusHistoryEntry {
  status: string;
  timestamp: string | Date;
  note?: string;
}

interface SavedOrder {
  id: string;
  orderDetails: OrderDetails;
  address: Address;
  paymentId: string | null;
  placedAt: string;
  status?: OrderStatus | undefined;
  statusHistory?: StatusHistoryEntry[] | undefined;
  trackingNumber?: string | undefined;
  courier?: string | undefined;
}

interface TimelineStepConfig {
  key: string;
  label: string;
  sub: string;
  aliases: string[];
  icon: typeof Package;
}

const TIMELINE_STEPS: TimelineStepConfig[] = [
  {
    key: 'confirmed',
    label: 'Confirmed',
    sub: 'Order verified & tailoring scheduled in atelier',
    aliases: ['confirmed', 'placed'],
    icon: CheckCircle2,
  },
  {
    key: 'cutting',
    label: 'Cutting',
    sub: 'Custom measurements mapped & fabric precision cut',
    aliases: ['cutting', 'drafting'],
    icon: Scissors,
  },
  {
    key: 'stitching',
    label: 'Stitching',
    sub: 'Artisanal tailoring, needlework & fine stitching',
    aliases: ['stitching', 'crafting'],
    icon: Sparkles,
  },
  {
    key: 'qc-check',
    label: 'QC Check',
    sub: 'Master tailor quality inspection & finishing',
    aliases: ['qc-check', 'packed', 'inspection'],
    icon: ShieldCheck,
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    sub: 'Safely packed in archival box & handed to courier',
    aliases: ['dispatched'],
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sub: 'Delivered & signed for at your destination',
    aliases: ['delivered'],
    icon: Package,
  },
];

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

function formatDateTime(isoOrDate: string | Date): string {
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(isoOrDate);
  }
}

export default function OrderTracking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<SavedOrder | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Review modal / state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('jojo_reviewed_orders');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const ordersKey = user?.username ? `jojo_orders_${user.username}` : 'jojo_orders_guest';

  // Load orders
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ordersKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedOrders(parsed as SavedOrder[]);
          setActiveOrder((prev) => prev ?? (parsed[0] as SavedOrder));
        }
      }
    } catch {
      // ignore
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
            status: (o.status || 'confirmed') as OrderStatus,
            statusHistory: Array.isArray(o.statusHistory)
              ? (o.statusHistory as StatusHistoryEntry[])
              : undefined,
            trackingNumber: o.trackingNumber,
            courier: o.courier,
          }));
          setSavedOrders(mapped);
          setActiveOrder((prev) => prev ?? (mapped[0] || null));
          localStorage.setItem(ordersKey, JSON.stringify(mapped));
        }
      })
      .catch(() => {
        // ignore fetch error
      });
  }, [ordersKey, user]);

  // Check if active order has already been reviewed in DB
  useEffect(() => {
    if (!activeOrder?.id) return;
    reviewApi
      .getReviews({ orderId: activeOrder.id })
      .then((res) => {
        if (res.data.length > 0) {
          setReviewedOrderIds((prev) => {
            if (!prev.includes(activeOrder.id)) {
              const next = [...prev, activeOrder.id];
              try {
                localStorage.setItem('jojo_reviewed_orders', JSON.stringify(next));
              } catch {
                // ignore storage error
              }
              return next;
            }
            return prev;
          });
        }
      })
      .catch(() => {
        // ignore review fetch error
      });
  }, [activeOrder?.id]);

  const isOrderReviewed = Boolean(activeOrder && reviewedOrderIds.includes(activeOrder.id));

  const handleReviewSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeOrder || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      await reviewApi.createReview({
        username: user?.username || activeOrder.address.fullName || 'Couture Patron',
        orderId: activeOrder.id,
        fabricId: activeOrder.orderDetails.fabricId,
        fabricName: activeOrder.orderDetails.fabricName,
        garment:
          activeOrder.orderDetails.garment ||
          activeOrder.orderDetails.productName ||
          'Custom Garment',
        rating: reviewRating,
        title: reviewTitle || `${reviewRating} Star Bespoke Review`,
        comment: reviewComment,
      });

      setReviewSubmitted(true);
      setReviewedOrderIds((prev) => {
        const next = [...prev, activeOrder.id];
        try {
          localStorage.setItem('jojo_reviewed_orders', JSON.stringify(next));
        } catch {
          // ignore storage error
        }
        return next;
      });
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSubmitted(false);
        setReviewComment('');
        setReviewTitle('');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeCoutureSketch = activeOrder
    ? getCoutureSketchForGarment(
        activeOrder.orderDetails.productId || activeOrder.orderDetails.garment,
        activeOrder.orderDetails.garment,
      )
    : null;

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] px-4 md:px-8 py-8">
      <SEOMeta
        title="Order Tracking | Customization Couture"
        description="Track your bespoke couture garment journey through pattern drafting, embroidery, inspection, and dispatch."
      />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#5C1A32]/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] text-xs font-semibold mb-2">
              <Package className="h-3.5 w-3.5 text-[#B8935A]" />
              Client Couture Concierge
            </div>
            <h1 className="text-3xl md:text-4xl text-[#1B1512]" style={serif}>
              Order Tracking &amp; Atelier Journey
            </h1>
            <p className="text-[#4A413B] text-sm mt-1">
              Follow your bespoke garment as our master artisans draft, hand-embroider, and inspect
              your cut.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/fabrics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#5C1A32]/20 text-[#5C1A32] hover:bg-[#5C1A32]/5 text-xs font-semibold transition-colors"
            >
              Browse Textile Library
            </Link>
          </div>
        </div>

        {savedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#5C1A32]/12 shadow-sm p-12 text-center max-w-xl mx-auto">
            <Package className="h-12 w-12 text-[#5C1A32]/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1B1512] mb-2" style={serif}>
              No Orders Found Yet
            </h3>
            <p className="text-sm text-[#4A413B] mb-6">
              You haven't placed an order yet. Select a pure handloom fabric and customize your
              silhouette with our atelier.
            </p>
            <button
              onClick={() => navigate('/fabrics')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5C1A32] text-white font-semibold px-6 py-3 text-sm hover:bg-[#431224] transition-colors"
            >
              Explore Pure Handlooms
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Order Selector Cards (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="text-xs font-bold tracking-wider uppercase text-[#8A7968]">
                Your Bespoke Ensembles ({savedOrders.length})
              </div>

              <div className="space-y-3">
                {savedOrders.map((order) => {
                  const isSelected = activeOrder?.id === order.id;
                  const details = order.orderDetails;
                  const sketch = getCoutureSketchForGarment(details.productId || details.garment);

                  return (
                    <div
                      key={order.id}
                      onClick={() => setActiveOrder(order)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-[#5C1A32] bg-white shadow-md'
                          : 'border-transparent bg-white hover:border-[#5C1A32]/30 shadow-sm'
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={sketch.imageUrl}
                          alt={details.fabricName}
                          className="w-14 h-16 rounded-md object-cover object-top border border-[#5C1A32]/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-sm font-bold text-[#1B1512] truncate">
                              {details.fabricName}
                            </h4>
                            <span className="text-sm font-bold text-[#5C1A32] font-mono shrink-0">
                              {formatRupees(details.total)}
                            </span>
                          </div>
                          <p className="text-xs text-[#8A7968] truncate mt-0.5">
                            {details.garment || 'Custom Garment'} · {details.meters || 3}m
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-[#8A7968]">{formatDate(order.placedAt)}</span>
                            <span className="font-semibold capitalize px-2 py-0.5 rounded-full bg-[#5C1A32]/10 text-[#5C1A32]">
                              {order.status || 'In Atelier'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Order Live Tracking Dashboard (8 cols) */}
            {activeOrder && (
              <div className="lg:col-span-8 space-y-6">
                {/* Active Order Card Header */}
                <div className="bg-white rounded-2xl border border-[#5C1A32]/15 shadow-md p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#5C1A32]/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#5C1A32] bg-[#5C1A32]/10 px-2.5 py-1 rounded">
                          ORDER #{activeOrder.id.slice(-8).toUpperCase()}
                        </span>
                        {activeOrder.paymentId && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Prepaid Verified
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-[#1B1512] mt-2" style={serif}>
                        {activeOrder.orderDetails.fabricName} · {activeOrder.orderDetails.garment}
                      </h2>
                      <p className="text-xs text-[#8A7968] mt-0.5">
                        Commissioned on {formatDate(activeOrder.placedAt)} · Delivery Destination:{' '}
                        {activeOrder.address.city}, {activeOrder.address.state}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* WhatsApp Share Button */}
                      <button
                        onClick={() => {
                          const garment =
                            activeOrder.orderDetails.garment ||
                            activeOrder.orderDetails.fabricName ||
                            'Custom Garment';
                          const status = activeOrder.status || 'In Atelier';
                          const total = activeOrder.orderDetails.total
                            ? formatRupees(activeOrder.orderDetails.total)
                            : '';
                          const orderId = activeOrder.id.slice(-8).toUpperCase();
                          const trackingMsg = activeOrder.trackingNumber
                            ? `\nTracking AWB: ${activeOrder.trackingNumber} (${activeOrder.courier || 'BlueDart'})`
                            : '';
                          const text = `Customization Couture Order Update:\nOrder ID: #${orderId}\nGarment: ${garment}\nStatus: ${status}\nTotal: ${total}${trackingMsg}\nTrack live: ${window.location.origin}/order-tracking`;
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                        title="Share Order via WhatsApp"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share on WhatsApp</span>
                      </button>

                      {/* Bill / Invoice Download */}
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#5C1A32]/10 border border-[#5C1A32]/25 text-[#5C1A32] text-xs font-semibold transition-colors shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Download Invoice / Bill
                      </button>

                      {/* Review Button - Strictly Available After Delivery & Only Once Per Order */}
                      {activeOrder.status?.toLowerCase() === 'delivered' ? (
                        isOrderReviewed ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-xs"
                            title="You have already submitted a review for this delivery"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Review Submitted</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowReviewModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#5C1A32] hover:bg-[#431224] text-white text-xs font-semibold transition-colors shadow-sm"
                          >
                            <Star className="h-3.5 w-3.5 fill-[#B8935A] text-[#B8935A]" />
                            Review Experience
                          </button>
                        )
                      ) : (
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100/90 border border-neutral-200 text-neutral-500 text-xs font-medium cursor-not-allowed select-none"
                          title="Reviews are unlocked once the product is delivered to your doorstep"
                        >
                          <Lock className="h-3.5 w-3.5 text-neutral-400" />
                          <span>Review on Delivery</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Animated Vertical Order Status Timeline */}
                  <div className="space-y-5 pt-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[#5C1A32]/10">
                      <div>
                        <h3
                          className="text-sm font-bold tracking-wider text-[#1B1512] uppercase"
                          style={serif}
                        >
                          Artisanal Journey Timeline
                        </h3>
                        <p className="text-xs text-[#8A7968] mt-0.5">
                          Live atelier milestones from fabric cutting to white-glove doorstep
                          delivery
                        </p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] border border-[#5C1A32]/20 uppercase tracking-wider">
                        Status: {activeOrder.status || 'Confirmed'}
                      </span>
                    </div>

                    <div className="relative pl-2 sm:pl-4 py-2 space-y-6">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const currentStatusNorm = (activeOrder.status || 'confirmed').toLowerCase();
                        let activeIdx = TIMELINE_STEPS.findIndex(
                          (s) =>
                            s.aliases.includes(currentStatusNorm) || s.key === currentStatusNorm,
                        );
                        if (activeIdx === -1) activeIdx = 0;

                        const isCompleted = currentStatusNorm === 'delivered' || idx < activeIdx;
                        const isActive = currentStatusNorm !== 'delivered' && idx === activeIdx;

                        const historyEntry = activeOrder.statusHistory?.find(
                          (h) =>
                            step.aliases.includes(h.status.toLowerCase()) ||
                            h.status.toLowerCase() === step.key,
                        );
                        const stepTimestamp =
                          historyEntry?.timestamp || (idx === 0 ? activeOrder.placedAt : null);
                        const adminNote = historyEntry?.note;
                        const isLast = idx === TIMELINE_STEPS.length - 1;
                        const StepIcon = step.icon;

                        return (
                          <div key={step.key} className="relative flex items-start gap-4">
                            {/* Connecting vertical line */}
                            {!isLast && (
                              <div
                                className={`absolute left-[17px] top-[34px] bottom-[-24px] w-[2px] transition-colors duration-500 ${
                                  isCompleted ? 'bg-[#5C1A32]' : 'bg-neutral-200'
                                }`}
                              />
                            )}

                            {/* Node Circle */}
                            <div className="relative z-10 shrink-0">
                              {isCompleted ? (
                                <div className="h-9 w-9 rounded-full bg-[#5C1A32] text-white flex items-center justify-center shadow-xs border-2 border-[#B8935A]">
                                  <Check className="h-4 w-4 text-[#B8935A] stroke-[3]" />
                                </div>
                              ) : isActive ? (
                                <div className="relative flex items-center justify-center">
                                  <span className="animate-ping absolute h-9 w-9 rounded-full bg-[#5C1A32]/40 opacity-75" />
                                  <div className="h-9 w-9 rounded-full bg-[#5C1A32] border-2 border-[#B8935A] flex items-center justify-center shadow-md shadow-[#5C1A32]/30">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#B8935A] animate-pulse" />
                                  </div>
                                </div>
                              ) : (
                                <div className="h-9 w-9 rounded-full border-2 border-neutral-300 bg-white flex items-center justify-center text-neutral-300">
                                  <span className="h-2 w-2 rounded-full bg-neutral-300" />
                                </div>
                              )}
                            </div>

                            {/* Step Details */}
                            <div className="flex-1 pt-1 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <StepIcon
                                    className={`h-4 w-4 ${
                                      isCompleted
                                        ? 'text-[#B8935A]'
                                        : isActive
                                          ? 'text-[#5C1A32]'
                                          : 'text-neutral-400'
                                    }`}
                                  />
                                  <h4
                                    className={`text-sm font-bold ${
                                      isCompleted || isActive
                                        ? 'text-[#1B1512]'
                                        : 'text-neutral-400'
                                    }`}
                                    style={serif}
                                  >
                                    {step.label}
                                  </h4>
                                  {isActive && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5C1A32] bg-[#5C1A32]/10 border border-[#5C1A32]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#5C1A32] animate-ping" />
                                      In Progress
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      Completed
                                    </span>
                                  )}
                                </div>

                                {stepTimestamp && (
                                  <span className="text-[11px] font-mono text-[#8A7968]">
                                    {formatDateTime(stepTimestamp)}
                                  </span>
                                )}
                              </div>

                              <p
                                className={`text-xs ${
                                  isCompleted || isActive ? 'text-[#544B45]' : 'text-neutral-400'
                                }`}
                              >
                                {step.key === 'dispatched' && activeOrder.trackingNumber
                                  ? `Dispatched via ${activeOrder.courier || 'BlueDart'} · AWB #${activeOrder.trackingNumber}`
                                  : step.sub}
                              </p>

                              {/* Admin note shown in small text if provided */}
                              {adminNote && (
                                <div className="mt-2 p-2.5 bg-[#FAF7F2] border border-[#B8935A]/30 rounded-lg text-xs text-[#5C1A32] flex items-start gap-2 shadow-2xs">
                                  <Sparkles className="h-3.5 w-3.5 text-[#B8935A] shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-[10px] uppercase tracking-wider text-[#8A7968] block">
                                      Atelier Note:
                                    </span>
                                    <span>{adminNote}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Courier & Logistics Tracking Card */}
                  <div className="rounded-xl bg-[#FAF7F2] border border-[#5C1A32]/12 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#5C1A32]/10 flex items-center justify-center shrink-0">
                        <Truck className="h-5 w-5 text-[#5C1A32]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1B1512]">
                          {activeOrder.courier || 'BlueDart Express Couture Courier'}
                        </div>
                        <div className="text-xs text-[#8A7968]">
                          Airway Bill:{' '}
                          <span className="font-mono font-bold text-[#1B1512]">
                            {activeOrder.trackingNumber ||
                              `BLU-${activeOrder.id.slice(-8).toUpperCase()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-[#8A7968] block">Estimated Doorstep Delivery</span>
                      <span className="font-bold text-[#5C1A32]">
                        Within 5–7 Days with Live SMS Alerts
                      </span>
                    </div>
                  </div>

                  {/* Garment Blueprint & Architectural Sketch Drawer */}
                  {activeCoutureSketch && (
                    <div className="border-t border-[#5C1A32]/10 pt-4">
                      <h4 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase mb-4">
                        Atelier Pattern Specification &amp; Drafting
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#FAF7F2] p-4 rounded-xl border border-[#5C1A32]/10">
                        <div className="md:col-span-4 aspect-[3/4] max-h-52 rounded-lg overflow-hidden border border-[#5C1A32]/20">
                          <img
                            src={activeCoutureSketch.imageUrl}
                            alt={activeCoutureSketch.title}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="md:col-span-8 space-y-2 text-xs">
                          <div className="font-bold text-sm text-[#1B1512]">
                            {activeCoutureSketch.title}
                          </div>
                          <p className="text-[#8A7968]">{activeCoutureSketch.subtitle}</p>

                          <div className="grid grid-cols-2 gap-2 pt-2 text-[#4A413B]">
                            <div className="bg-white p-2 rounded border border-neutral-200">
                              <span className="text-[10px] text-[#8A7968] block">
                                Tailored Meterage
                              </span>
                              <span className="font-semibold text-xs">
                                {activeOrder.orderDetails.meters || 3} meters
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-neutral-200">
                              <span className="text-[10px] text-[#8A7968] block">
                                Price Per Meter
                              </span>
                              <span className="font-semibold text-xs">
                                {formatRupees(activeOrder.orderDetails.pricePerMeter || 644)}
                              </span>
                            </div>
                          </div>

                          {activeOrder.orderDetails.measurementValues && (
                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C1A32]">
                                <Ruler className="h-3 w-3" />
                                Bespoke Measurement Profile Applied (Bust, Waist, Shoulder, Length)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inline Leave a Review Section when Delivered */}
                  {activeOrder.status?.toLowerCase() === 'delivered' && (
                    <div className="mt-8 rounded-xl border border-[#B8935A]/30 bg-gradient-to-br from-[#FAF7F2] to-amber-50/40 p-6 shadow-sm">
                      <div className="flex items-center justify-between pb-4 border-b border-[#5C1A32]/10 mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-[#B8935A] fill-[#B8935A]" />
                          <div>
                            <h3 className="font-bold text-base text-[#1B1512]" style={serif}>
                              Leave a Review for Your Bespoke Garment
                            </h3>
                            <p className="text-xs text-[#8A7968]">
                              Share your feedback on the cut, fabric, and handcraft quality
                            </p>
                          </div>
                        </div>
                        {isOrderReviewed && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Submitted
                          </span>
                        )}
                      </div>

                      {reviewSubmitted ? (
                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-1">
                          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                          <h4 className="font-bold text-sm text-emerald-900">
                            Review submitted — pending approval
                          </h4>
                          <p className="text-xs text-emerald-700">
                            Thank you! Your verified atelier feedback will appear once approved by
                            our curation team.
                          </p>
                        </div>
                      ) : isOrderReviewed ? (
                        <div className="p-4 rounded-lg bg-white/80 border border-neutral-200 text-center space-y-1">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                          <p className="text-xs font-semibold text-neutral-800">
                            You have already submitted a review for this order.
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Our atelier appreciates your patronage and verified critique.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#1B1512] mb-1">
                              Your Rating
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      star <= reviewRating
                                        ? 'text-[#B8935A] fill-[#B8935A]'
                                        : 'text-neutral-300'
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="text-xs font-medium text-[#5C1A32] ml-2">
                                {reviewRating} out of 5 stars
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#1B1512] mb-1">
                              Review Title
                            </label>
                            <input
                              type="text"
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                              placeholder="e.g., Exquisite drape and impeccable stitching"
                              className="w-full text-xs rounded-lg border border-neutral-300 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#1B1512] mb-1">
                              Your Comment *
                            </label>
                            <textarea
                              rows={3}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Describe the fabric texture, fit precision, and artisanal craftsmanship..."
                              className="w-full text-xs rounded-lg border border-neutral-300 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                              required
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="px-5 py-2 rounded-lg bg-[#5C1A32] hover:bg-[#431224] text-white text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                            >
                              <Star className="h-3.5 w-3.5 fill-[#B8935A] text-[#B8935A]" />
                              {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal - Strictly available only when order is delivered AND not already reviewed */}
      {showReviewModal &&
        activeOrder &&
        activeOrder.status?.toLowerCase() === 'delivered' &&
        !isOrderReviewed && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#B8935A] fill-[#B8935A]" />
                  <h3 className="font-bold text-lg text-[#1B1512]" style={serif}>
                    Review Your Atelier Experience
                  </h3>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-neutral-400 hover:text-black font-bold"
                >
                  &times;
                </button>
              </div>

              {reviewSubmitted ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-lg text-neutral-900">
                    Review submitted — pending approval
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Your feedback helps our master craftsmen maintain uncompromising quality.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Rating (1 to 5 Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= reviewRating
                                ? 'text-[#B8935A] fill-[#B8935A]'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-neutral-800 ml-2">
                        {reviewRating} out of 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Review Title
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Masterful fit and luxurious drape"
                      className="w-full text-xs p-3 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Your Feedback
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience regarding the fabric texture, tailoring precision, and delivery..."
                      className="w-full text-xs p-3 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#5C1A32] text-white text-xs font-semibold hover:bg-[#431224] transition-colors disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      {/* Amazon Invoice Modal */}
      {activeOrder && (
        <AmazonInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={activeOrder}
        />
      )}
    </div>
  );
}
