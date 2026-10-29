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
} from 'lucide-react';
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

type OrderStatus = 'placed' | 'packed' | 'dispatched' | 'delivered';

interface SavedOrder {
  id: string;
  orderDetails: OrderDetails;
  address: Address;
  paymentId: string | null;
  placedAt: string;
  status?: OrderStatus | undefined;
  trackingNumber?: string | undefined;
  courier?: string | undefined;
}

const COUTURE_STAGES: {
  key: OrderStatus | 'drafting' | 'crafting' | 'inspection';
  title: string;
  sub: string;
  icon: typeof Package;
}[] = [
  {
    key: 'placed',
    title: 'Order Placed & Verified',
    sub: 'Prepaid via Secure Gateway',
    icon: CheckCircle2,
  },
  {
    key: 'drafting',
    title: 'Pattern Drafting & Cutting',
    sub: 'Bespoke measurements mapped',
    icon: Scissors,
  },
  {
    key: 'crafting',
    title: 'Artisanal Embroidery & Stitching',
    sub: 'Zardozi borders & fine finishing',
    icon: Sparkles,
  },
  {
    key: 'packed',
    title: 'Quality Inspection & Steaming',
    sub: 'Packed in deluxe archival box',
    icon: Package,
  },
  {
    key: 'dispatched',
    title: 'Dispatched with BlueDart',
    sub: 'Tracking AWB #BLU-882941',
    icon: Truck,
  },
  {
    key: 'delivered',
    title: 'Delivered at Doorstep',
    sub: 'Signed & handed over',
    icon: ShieldCheck,
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
            status: (o.status || 'placed') as OrderStatus,
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

  const handleReviewSubmit = async (e: React.SubmitEvent) => {
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

  const getStageStatus = (stageKey: string, currentStatus?: OrderStatus) => {
    const status = currentStatus ?? 'placed';
    if (status === 'delivered') return 'completed';
    if (status === 'dispatched') {
      if (['placed', 'drafting', 'crafting', 'packed'].includes(stageKey)) return 'completed';
      if (stageKey === 'dispatched') return 'active';
      return 'pending';
    }
    if (status === 'packed') {
      if (['placed', 'drafting', 'crafting'].includes(stageKey)) return 'completed';
      if (stageKey === 'packed') return 'active';
      return 'pending';
    }
    // placed
    if (stageKey === 'placed') return 'completed';
    if (stageKey === 'drafting') return 'active';
    return 'pending';
  };

  const activeCoutureSketch = activeOrder
    ? getCoutureSketchForGarment(
        activeOrder.orderDetails.productId || activeOrder.orderDetails.garment,
        activeOrder.orderDetails.garment,
      )
    : null;

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] px-4 md:px-8 py-8">
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

                  {/* 6-Stage Live Journey Progress Timeline */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase flex items-center justify-between">
                      <span>Artisanal Journey Timeline</span>
                      <span className="text-[#8A7968] font-normal lowercase">
                        Status:{' '}
                        <strong className="text-[#5C1A32] capitalize">
                          {activeOrder.status || 'placed'}
                        </strong>
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {COUTURE_STAGES.map((stage, idx) => {
                        const stageStatus = getStageStatus(stage.key, activeOrder.status);
                        const Icon = stage.icon;

                        return (
                          <div
                            key={stage.key}
                            className={`p-3.5 rounded-xl border transition-all ${
                              stageStatus === 'completed'
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                : stageStatus === 'active'
                                  ? 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-400 text-amber-950'
                                  : 'bg-[#FAF7F2]/60 border-neutral-200 text-neutral-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono font-bold">
                                STAGE 0{idx + 1}
                              </span>
                              {stageStatus === 'completed' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" /> Done
                                </span>
                              ) : stageStatus === 'active' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded animate-pulse">
                                  Current Stage
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-neutral-400">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon
                                className={`h-4 w-4 ${
                                  stageStatus === 'completed'
                                    ? 'text-emerald-700'
                                    : stageStatus === 'active'
                                      ? 'text-amber-800'
                                      : 'text-neutral-400'
                                }`}
                              />
                              <h4 className="text-xs font-bold leading-tight">{stage.title}</h4>
                            </div>
                            <p className="text-[11px] opacity-80 leading-snug">
                              {stage.key === 'dispatched' && activeOrder.trackingNumber
                                ? `AWB #${activeOrder.trackingNumber} via ${activeOrder.courier || 'BlueDart'}`
                                : stage.sub}
                            </p>
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
                  <h4 className="font-bold text-lg text-neutral-900">Thank you for your review!</h4>
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
