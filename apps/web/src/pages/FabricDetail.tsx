import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingCart, Scissors, Star } from 'lucide-react';
import { FABRICS, GARMENT_TYPES, type GarmentType } from '../data/fabrics';
import { pricingService, PRICING_UPDATED_EVENT } from '../services/pricingService';
import { reviewApi, type ReviewItem, type ReviewStats } from '../services/api';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx) ─────────────
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink-600)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for the fabric name only.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

const METER_PRESETS = [1, 2, 3, 5, 7, 10];
const METER_MIN = 0.5;
const METER_MAX = 20;

export default function FabricDetail() {
  const { tone, fabricId } = useParams<{ tone: string; fabricId: string }>();
  const navigate = useNavigate();
  const [, setPriceTick] = useState(0);

  useEffect(() => {
    const handlePriceUpdate = () => {
      setPriceTick((t) => t + 1);
    };
    window.addEventListener(PRICING_UPDATED_EVENT, handlePriceUpdate);
    window.addEventListener('storage', handlePriceUpdate);
    return () => {
      window.removeEventListener(PRICING_UPDATED_EVENT, handlePriceUpdate);
      window.removeEventListener('storage', handlePriceUpdate);
    };
  }, []);

  const fabric = FABRICS.find((f) => f.id === fabricId && f.tone === tone);

  const defaultGarment = GARMENT_TYPES[0];
  if (!defaultGarment) {
    throw new Error('GARMENT_TYPES must contain at least one garment type.');
  }

  const [selectedGarment, setSelectedGarment] = useState<GarmentType>(defaultGarment);
  const [meters, setMeters] = useState(defaultGarment.defaultMeters);
  const [metersInput, setMetersInput] = useState(String(defaultGarment.defaultMeters));

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!fabricId) return;
    setLoadingReviews(true);
    reviewApi
      .getReviews({ fabricId })
      .then((res) => {
        setReviews(res.data);
        if (res.stats) setReviewStats(res.stats);
      })
      .catch((err: unknown) => {
        console.error('Failed to load reviews for fabric:', err);
      })
      .finally(() => {
        setLoadingReviews(false);
      });
  }, [fabricId]);

  // Guard: unknown fabric/tone combo in the URL -> send back to the fabrics dashboard
  if (!fabric) {
    return <Navigate to="/fabrics" replace />;
  }

  const effectivePrice = pricingService.getFabricPrice(fabric.id, fabric.pricePerMeter);
  const total = meters * effectivePrice;

  const handleSelectGarment = (garment: GarmentType) => {
    setSelectedGarment(garment);
    setMeters(garment.defaultMeters);
    setMetersInput(String(garment.defaultMeters));
  };

  const applyMeters = (value: number) => {
    const next = Math.min(METER_MAX, Math.max(METER_MIN, +value.toFixed(1)));
    setMeters(next);
    setMetersInput(String(next));
  };

  const decreaseMeters = () => {
    applyMeters(meters - 0.5);
  };
  const increaseMeters = () => {
    applyMeters(meters + 0.5);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyMeters(parseFloat(e.target.value));
  };

  const handlePresetClick = (value: number) => {
    applyMeters(value);
  };

  const handleMetersInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string and partial decimal input (e.g. "1.") while typing
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMetersInput(value);
    }
  };

  const commitMetersInput = () => {
    const parsed = parseFloat(metersInput);
    if (isNaN(parsed)) {
      setMetersInput(String(meters));
      return;
    }
    applyMeters(parsed);
  };

  const handleMetersInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleBuyNow = () => {
    const orderDetails = {
      fabricId: fabric.id,
      fabricName: fabric.name,
      tone: fabric.tone,
      garment: selectedGarment.id,
      meters,
      pricePerMeter: effectivePrice,
      total,
    };
    console.log('Buy Now:', orderDetails);
    void navigate('/order', { state: orderDetails });
  };

  const handleInHouse = () => {
    // Send the chosen fabric + garment + meters over to the Custom
    // Outfit flow so ProductStyle / Accessories / Summary can carry it
    // through to checkout alongside the tailoring style selections.
    const fabricDetails = {
      fabricId: fabric.id,
      fabricName: fabric.name,
      fabricTone: fabric.tone,
      fabricHex: fabric.hex,
      pricePerMeter: effectivePrice,
      garment: selectedGarment.id,
      garmentLabel: selectedGarment.label,
      meters,
      fabricTotal: total,
    };
    // Skip the "/custom-outfit" product picker grid entirely and go
    // straight to that garment's style/measurements page (matches the
    // route + state shape CustomOutfit.tsx's handleContinue navigates to).
    void navigate(`/custom-outfit/${selectedGarment.id}`, {
      state: { productName: selectedGarment.label, fabric: fabricDetails },
    });
  };

  // Fallbacks for optional spec fields — see data/fabrics.ts note
  const specs = [
    { label: 'Fabric', value: fabric.material },
    { label: 'Tone', value: fabric.tone },
    { label: 'Colour', value: fabric.colourName ?? fabric.tone },
    { label: 'Width', value: fabric.width ?? '44 Inches' },
    { label: 'Care', value: fabric.care ?? 'Dry Clean' },
  ];

  const sliderFillPct = ((meters - METER_MIN) / (METER_MAX - METER_MIN)) * 100;

  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-6">
      <section className="w-full px-4 sm:px-6 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => {
              void navigate('/fabrics');
            }}
            className="inline-flex items-center gap-1.5 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to fabrics
          </button>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto bg-white rounded-sm border border-[#5C1A32]/12 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* ── LEFT COLUMN: hero, description, specs, garment picker ── */}
            <div className="lg:w-1/2 lg:border-r border-[#5C1A32]/12">
              <div
                className="relative w-full h-48 sm:h-56 lg:h-64 flex items-end"
                style={{
                  background: `linear-gradient(135deg, ${fabric.hex} 0%, ${fabric.hex}CC 55%, #1B1512 100%)`,
                }}
              >
                <div className="relative z-10 p-5 sm:p-6">
                  <h1
                    className="text-2xl sm:text-3xl lg:text-4xl italic text-[#F6F1E7] drop-shadow-sm"
                    style={serif}
                  >
                    {fabric.name}
                  </h1>
                  <p className="text-sm text-[#F6F1E7]/85 mt-1">
                    {fabric.material} · {fabric.colourName ?? fabric.tone}
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-sm text-[#4A413B] mb-6">{fabric.description}</p>

                {/* Spec tag row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 mb-8">
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-sm bg-[#F6F1E7] border border-[#5C1A32]/10 px-3 py-2 text-center"
                    >
                      <p className="text-[10px] font-semibold tracking-[0.15em] text-[#4A413B] uppercase">
                        {s.label}
                      </p>
                      <p className="text-sm font-semibold text-[#1B1512] mt-0.5 capitalize truncate">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Garment type picker */}
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-2">
                  What would you like to make?
                </p>
                <div className="flex flex-wrap gap-2">
                  {GARMENT_TYPES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        handleSelectGarment(g);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedGarment.id === g.id
                          ? 'bg-[#5C1A32] border-[#5C1A32] text-[#F6F1E7]'
                          : 'border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: meters slider, presets, price, actions ── */}
            <div className="lg:w-1/2 p-5 sm:p-6 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#1B1512]">How many meters do you need?</p>
                <span className="text-sm font-semibold text-[#5C1A32] whitespace-nowrap ml-2">
                  {meters}m selected
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <button
                  onClick={decreaseMeters}
                  className="h-9 w-9 shrink-0 rounded-full border border-[#5C1A32] text-[#5C1A32] flex items-center justify-center hover:bg-[#5C1A32]/5"
                  aria-label="Decrease meters"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <input
                  type="range"
                  min={METER_MIN}
                  max={METER_MAX}
                  step={0.5}
                  value={meters}
                  onChange={handleSliderChange}
                  className="flex-1 h-1.5 rounded-full bg-[#5C1A32]/15 appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#5C1A32]
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow
                    [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-[#5C1A32] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                  style={{
                    background: `linear-gradient(to right, #5C1A32 0%, #5C1A32 ${String(sliderFillPct)}%, rgba(92,26,50,0.15) ${String(sliderFillPct)}%, rgba(92,26,50,0.15) 100%)`,
                  }}
                  aria-label="Meters slider"
                />

                <button
                  onClick={increaseMeters}
                  className="h-9 w-9 shrink-0 rounded-full border border-[#5C1A32] text-[#5C1A32] flex items-center justify-center hover:bg-[#5C1A32]/5"
                  aria-label="Increase meters"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-between text-xs text-[#8A7E74] mb-6 px-10 sm:px-12">
                <span>{METER_MIN}m</span>
                <span>5m</span>
                <span>10m</span>
                <span>{METER_MAX}m</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {METER_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      handlePresetClick(p);
                    }}
                    className={`px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors ${
                      meters === p
                        ? 'bg-[#B8935A] border-[#B8935A] text-[#1B1512]'
                        : 'border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]'
                    }`}
                  >
                    {p}m
                  </button>
                ))}

                {/* Manual entry for fine-grained values (e.g. 2.5m) */}
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-sm border border-[#5C1A32]/20">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={metersInput}
                    onChange={handleMetersInputChange}
                    onBlur={commitMetersInput}
                    onKeyDown={handleMetersInputKeyDown}
                    className="w-10 text-sm font-medium text-[#1B1512] text-center bg-transparent focus:outline-none"
                    aria-label="Custom meters"
                  />
                  <span className="text-sm text-[#4A413B]">m</span>
                </div>
              </div>

              {/* Total price panel */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-[#F6F1E7] border border-[#5C1A32]/12 px-4 py-4 mb-6">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] text-[#4A413B] uppercase">
                    Total Price
                  </p>
                  <p className="text-2xl font-bold text-[#5C1A32]" style={serif}>
                    ₹{total}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#4A413B]">
                    ₹{effectivePrice} × {meters}m
                  </p>
                  <p className="text-xs text-[#8A7E74]">+ Stitching charges apply</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B1512] text-[#F6F1E7] font-semibold py-3.5 px-4 hover:bg-[#5C1A32] transition-colors shadow-md"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Buy Now
                </button>
                <button
                  onClick={handleInHouse}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#5C1A32] text-[#5C1A32] font-semibold py-3.5 px-4 hover:bg-[#5C1A32]/5 transition-colors shadow-sm"
                >
                  <Scissors className="h-4 w-4" />
                  Customize to JOJO
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── 10 RELATED FABRIC SUGGESTIONS ──────────────── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#5C1A32]/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] text-xs font-semibold mb-2">
              Curated Swatch Matrix
            </div>
            <h2 className="text-2xl sm:text-3xl text-[#1B1512]" style={serif}>
              10 Related Fabrics You May Adore
            </h2>
            <p className="text-sm text-[#4A413B]">
              Hand-picked weaves sharing {fabric.tone} undertones and luxurious draping qualities.
            </p>
          </div>
          <button
            onClick={() => navigate('/fabrics')}
            className="text-xs font-semibold text-[#5C1A32] hover:underline shrink-0"
          >
            Explore all {FABRICS.length} fabrics &rarr;
          </button>
        </div>

        {/* 10 Suggestions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {FABRICS.filter((f) => f.id !== fabric.id)
            .sort((a, b) => {
              if (a.tone === fabric.tone && b.tone !== fabric.tone) return -1;
              if (b.tone === fabric.tone && a.tone !== fabric.tone) return 1;
              if (a.material === fabric.material && b.material !== fabric.material) return -1;
              return 0;
            })
            .slice(0, 10)
            .map((related) => {
              const relPrice = pricingService.getFabricPrice(related.id, related.pricePerMeter);
              return (
                <div
                  key={related.id}
                  onClick={() => navigate(`/fabrics/${related.tone}/${related.id}`)}
                  className="group bg-white rounded-xl border border-[#5C1A32]/12 overflow-hidden hover:border-[#5C1A32] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <div
                    className="relative aspect-square w-full"
                    style={{ backgroundColor: related.hex }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded">
                      {related.tone}
                    </span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        className="text-xs font-semibold text-[#1B1512] group-hover:text-[#5C1A32] truncate"
                        style={serif}
                      >
                        {related.name}
                      </h4>
                      <p className="text-[10px] text-[#8A7968]">{related.material}</p>
                    </div>
                    <div className="pt-2 mt-2 border-t border-[#5C1A32]/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5C1A32] font-mono">
                        ₹{relPrice}/m
                      </span>
                      <span className="text-[10px] font-semibold text-[#5C1A32] opacity-0 group-hover:opacity-100 transition-opacity">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ──────────────── CUSTOMER REVIEWS & RATINGS SECTION ──────────────── */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#5C1A32]/10">
        <div className="bg-white rounded-2xl border border-[#5C1A32]/15 shadow-sm p-6 sm:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#5C1A32]/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B8935A]">
                  Verified Atelier Reviews
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl text-[#1B1512]" style={serif}>
                Client Experiences with {fabric.name}
              </h3>
              <p className="text-xs text-[#4A413B] mt-1">
                Authentic feedback from couture patrons on texture, drape, colorfastness, and
                hand-feel.
              </p>
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-4 bg-[#FAF7F2] p-4 rounded-xl border border-[#5C1A32]/10 shrink-0">
              <div className="text-3xl font-black text-[#5C1A32]" style={serif}>
                {reviews.length > 0
                  ? (
                      reviewStats?.average ??
                      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                    ).toFixed(1)
                  : '5.0'}
              </div>
              <div>
                <div className="flex items-center gap-1 text-[#B8935A]">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avg =
                      reviews.length > 0
                        ? (reviewStats?.average ??
                          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
                        : 5;
                    return (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(avg)
                            ? 'fill-[#B8935A] text-[#B8935A]'
                            : 'text-neutral-300'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-[11px] text-[#8A7968]">
                  {reviews.length > 0
                    ? `Based on ${reviews.length} verified patron review${reviews.length > 1 ? 's' : ''}`
                    : 'Awaiting first verified review'}
                </div>
              </div>
            </div>
          </div>

          {/* Real Verified Reviews List */}
          {loadingReviews ? (
            <div className="text-center py-10 text-xs text-[#8A7968]">
              Loading verified patron feedback...
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-5 rounded-xl bg-[#FAF7F2] border border-[#5C1A32]/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1B1512]">{rev.username}</span>
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                          ✓ Verified Purchase
                        </span>
                      )}
                      {rev.orderId && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          Ref: {rev.orderId.slice(0, 14)}
                        </span>
                      )}
                    </div>
                    <span className="text-[#8A7968]">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= rev.rating
                              ? 'fill-[#B8935A] text-[#B8935A]'
                              : 'text-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                    <h5 className="font-bold text-xs text-[#1B1512]">{rev.title}</h5>
                  </div>

                  <p className="text-xs text-[#4A413B] leading-relaxed">{rev.comment}</p>
                  {rev.garment && (
                    <div className="text-[10px] text-[#8A7968] italic">
                      Tailored as:{' '}
                      <span className="font-semibold text-[#5C1A32] capitalize">{rev.garment}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-[#FAF7F2] border border-[#5C1A32]/10 space-y-2">
              <Star className="h-6 w-6 text-[#B8935A] mx-auto opacity-60" />
              <h4 className="text-sm font-semibold text-[#1B1512]">
                Be the First to Review {fabric.name}
              </h4>
              <p className="text-xs text-[#736357] max-w-md mx-auto">
                Patrons who order and receive garments crafted from this textile can share their
                authentic fit and texture review directly after delivery.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
