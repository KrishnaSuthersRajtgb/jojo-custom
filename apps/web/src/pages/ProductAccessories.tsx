import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Check, ShieldCheck } from 'lucide-react';

import { pricingService, PRICING_UPDATED_EVENT } from '../services/pricingService';
import { getCoutureSketchForGarment } from '../utils/coutureSketches';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface AccessoryOption {
  id: string;
  label: string;
  price: number;
}

interface IncomingFabric {
  fabricId: string;
  fabricName: string;
  fabricTone: string;
  fabricHex: string;
  pricePerMeter: number;
  garment: string;
  garmentLabel: string;
  meters: number;
  fabricTotal: number;
}

interface IncomingReferenceImage {
  dataUrl: string;
  fileName: string;
}

interface IncomingState {
  productName?: string;
  baseTailoringPrice?: number;
  selections?: unknown;
  measurementValues?: Record<string, string>;
  fabric?: IncomingFabric;
  referenceImage?: IncomingReferenceImage | null;
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function ProductAccessories() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state as IncomingState | null) ?? {};
  const fabric = incoming.fabric ?? null;
  const referenceImage = incoming.referenceImage ?? null;

  const [dynamicAccessories, setDynamicAccessories] = useState<AccessoryOption[]>(() => {
    return pricingService.getAccessories().filter((a) => a.active);
  });

  useEffect(() => {
    const handleUpdate = () => {
      setDynamicAccessories(pricingService.getAccessories().filter((a) => a.active));
    };
    window.addEventListener(PRICING_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(PRICING_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const accessories = dynamicAccessories;
  const productName = incoming.productName ?? productId ?? 'Item';
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const coutureSketch = getCoutureSketchForGarment(productId, productName);

  if (!productId || accessories.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#FAF7F2] px-6 py-16 flex items-center justify-center text-center">
        <div>
          <p className="text-[#4A413B] mb-4">We couldn't find that product specification.</p>
          <Link
            to="/custom-outfit"
            className="inline-flex items-center gap-2 text-[#5C1A32] font-semibold text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Custom Outfit
          </Link>
        </div>
      </div>
    );
  }

  const toggleAccessory = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedAccessories = accessories.filter((a) => selected[a.id]);
  const accessoriesOnlyTotal = selectedAccessories.reduce((sum, a) => sum + a.price, 0);
  const grandTotal = accessoriesOnlyTotal + (fabric?.fabricTotal ?? 0);

  const handleViewSummary = () => {
    void navigate(`/custom-outfit/${productId}/summary`, {
      state: {
        productId,
        productName,
        baseTailoringPrice: incoming.baseTailoringPrice,
        selections: incoming.selections ?? null,
        measurementValues: incoming.measurementValues ?? null,
        accessories: selectedAccessories,
        accessoriesTotal: accessoriesOnlyTotal,
        fabric,
        referenceImage,
      },
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb / Nav */}
        <div className="flex items-center justify-between pb-6 border-b border-[#5C1A32]/10 mb-8">
          <Link
            to={`/custom-outfit/${productId}`}
            className="inline-flex items-center gap-2 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cut &amp; Silhouette
          </Link>

          <div className="flex items-center gap-2 text-xs text-[#8A7968]">
            <span>1. Silhouette</span>
            <span>&rarr;</span>
            <span className="font-semibold text-[#5C1A32] border-b-2 border-[#5C1A32] pb-0.5">
              2. Embellishments
            </span>
            <span>&rarr;</span>
            <span>3. Summary</span>
            <span>&rarr;</span>
            <span>4. Delivery</span>
          </div>
        </div>

        {/* 2-Column Haute Couture Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Embellishments Selection Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] text-xs font-semibold mb-3">
                <Sparkles className="h-3.5 w-3.5 text-[#B8935A]" />
                Handcrafted Finishing
              </div>
              <h1 className="text-3xl md:text-4xl text-[#1B1512] mb-3" style={serif}>
                Accessories &amp; Embellishments
              </h1>
              <p className="text-[#4A413B] text-sm md:text-base leading-relaxed">
                Elevate your bespoke{' '}
                <span className="font-semibold text-[#1B1512]">{productName.toLowerCase()}</span>{' '}
                with traditional hand-embroidery, zardozi borders, piping edges, and custom
                artisanal trims.
              </p>
            </div>

            {/* Fabric Banner */}
            {fabric && (
              <div className="rounded-lg border border-[#5C1A32]/15 bg-white p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border border-black/10 shadow-inner flex items-center justify-center shrink-0"
                    style={{ backgroundColor: fabric.fabricHex || '#7A1F2B' }}
                  />
                  <div>
                    <div className="text-xs text-[#8A7968] uppercase font-semibold tracking-wider">
                      Selected Textile
                    </div>
                    <div className="text-sm font-semibold text-[#1B1512]">{fabric.fabricName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8A7968]">{fabric.meters} meters</div>
                  <div className="text-sm font-bold text-[#5C1A32] font-mono">
                    {formatRupees(fabric.fabricTotal)}
                  </div>
                </div>
              </div>
            )}

            {/* Accessories Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8A7968] font-medium px-1">
                <span>SELECT CRAFTSMANSHIP ADD-ONS ({selectedAccessories.length} selected)</span>
                {selectedAccessories.length > 0 && (
                  <button
                    onClick={() => setSelected({})}
                    className="text-[#5C1A32] hover:underline"
                  >
                    Clear selections
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {accessories.map((accessory) => {
                  const isChecked = Boolean(selected[accessory.id]);
                  return (
                    <label
                      key={accessory.id}
                      onClick={() => toggleAccessory(accessory.id)}
                      className={`relative flex items-center justify-between gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
                        isChecked
                          ? 'border-[#5C1A32] bg-[#5C1A32]/5 shadow-sm'
                          : 'border-neutral-200/80 hover:border-[#5C1A32]/40 bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-[#5C1A32] border-[#5C1A32] text-white'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#1B1512] block">
                            {accessory.label}
                          </span>
                          <span className="text-[11px] text-[#8A7968]">
                            Atelier hand-crafted trim
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#5C1A32] font-mono shrink-0">
                        +{formatRupees(accessory.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Guarantee note */}
            <div className="rounded-lg bg-amber-50/60 border border-amber-200/60 p-4 flex items-start gap-3 text-xs text-amber-900">
              <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Master Artisan Precision Guarantee:</span> All trims
                are individually color-matched to your fabric by our master drapers in Chennai with
                double-interlined hand stitching.
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Atelier Specification & Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-8 space-y-6">
            <div className="rounded-xl bg-white border border-[#5C1A32]/15 shadow-md overflow-hidden">
              {/* Illustration Preview */}
              <div className="relative aspect-[3/4] max-h-[380px] w-full bg-[#F6F1E7] overflow-hidden border-b border-[#5C1A32]/10">
                <img
                  src={coutureSketch.imageUrl}
                  alt={coutureSketch.title}
                  className="w-full h-full object-cover object-top filter contrast-[1.03]"
                />
                <div className="absolute top-3 left-3 bg-[#1B1512]/80 backdrop-blur-sm text-[#F6F1E7] text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded">
                  {coutureSketch.badge}
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
                  <div className="text-xs uppercase tracking-wider text-[#B8935A] font-medium">
                    Atelier Silhouette
                  </div>
                  <div className="text-lg font-bold" style={serif}>
                    {coutureSketch.title}
                  </div>
                  <div className="text-xs text-neutral-300">{coutureSketch.subtitle}</div>
                </div>
              </div>

              {/* Running Breakdown */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase border-b border-[#5C1A32]/10 pb-2">
                  Atelier Price Specification
                </h3>

                <div className="space-y-2 text-sm">
                  {fabric && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#4A413B]">
                        {fabric.fabricName} ({fabric.meters}m)
                      </span>
                      <span className="font-medium text-[#1B1512] font-mono">
                        {formatRupees(fabric.fabricTotal)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[#4A413B]">
                      Embellishments ({selectedAccessories.length})
                    </span>
                    <span className="font-medium text-[#5C1A32] font-mono">
                      {formatRupees(accessoriesOnlyTotal)}
                    </span>
                  </div>

                  {selectedAccessories.length > 0 && (
                    <div className="pt-2 pl-3 border-l-2 border-[#5C1A32]/20 space-y-1">
                      {selectedAccessories.map((a) => (
                        <div key={a.id} className="flex justify-between text-xs text-[#8A7968]">
                          <span>• {a.label}</span>
                          <span className="font-mono">+{formatRupees(a.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-emerald-700 pt-1">
                    <span>Doorstep Measurement &amp; Delivery</span>
                    <span className="font-bold uppercase tracking-wider">Complimentary</span>
                  </div>
                </div>

                {/* Grand Total Bar */}
                <div className="pt-4 border-t-2 border-[#1B1512] flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-[#8A7968] block">Running Total</span>
                    <span className="text-xs font-semibold text-[#1B1512]">
                      Includes 5% GST &amp; Tailoring
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-[#5C1A32]" style={serif}>
                    {formatRupees(grandTotal)}
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={handleViewSummary}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1B1512] hover:bg-[#5C1A32] text-[#F6F1E7] font-semibold text-sm px-6 py-4 rounded-xl shadow-lg transition-all duration-200 mt-2 hover:shadow-xl"
                >
                  <span>Review Price Summary</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-[11px] text-center text-[#8A7968]">
                  You can adjust measurements &amp; details in the next step before checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
