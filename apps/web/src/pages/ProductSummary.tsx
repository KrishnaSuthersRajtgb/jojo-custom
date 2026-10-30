import { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  FileText,
  Clock,
  Sparkles,
  Scissors,
  CheckCircle,
} from 'lucide-react';

import { getCoutureSketchForGarment } from '../utils/coutureSketches';
import AmazonInvoiceModal from '../components/AmazonInvoiceModal';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface SelectionEntry {
  sectionId?: string;
  sectionLabel: string;
  optionLabel: string | null;
  subOptionLabel: string | null;
  tailoringPrice?: number;
}

interface AccessoryEntry {
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
  totalTailoring?: number;
  selections?: SelectionEntry[] | null;
  measurementValues?: Record<string, string> | null;
  accessories?: AccessoryEntry[];
  accessoriesTotal?: number;
  fabric?: IncomingFabric;
  referenceImage?: IncomingReferenceImage | null;
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function ProductSummary() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as IncomingState | null) ?? {};

  const productName = state.productName ?? productId ?? 'Item';
  const selections = state.selections ?? [];
  const baseTailoringPrice = state.baseTailoringPrice ?? 450;
  const styleTailoringTotal = selections.reduce((sum, s) => sum + (s.tailoringPrice ?? 0), 0);
  const totalTailoring = baseTailoringPrice + styleTailoringTotal;

  const accessories = state.accessories ?? [];
  const accessoriesTotal = state.accessoriesTotal ?? 0;
  const fabric = state.fabric ?? null;
  const referenceImage = state.referenceImage ?? null;
  const fabricTotal = fabric?.fabricTotal ?? 0;
  const grandTotal = accessoriesTotal + fabricTotal + totalTailoring;

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const coutureSketch = getCoutureSketchForGarment(
    productId,
    selections[0]?.subOptionLabel || selections[0]?.optionLabel || productName,
  );

  const handleProceed = () => {
    void navigate('/order', {
      state: {
        productId,
        productName,
        baseTailoringPrice,
        totalTailoring,
        selections,
        measurementValues: state.measurementValues ?? null,
        accessories,
        accessoriesTotal,
        fabric,
        referenceImage,
        grandTotal,
      },
    });
  };

  // Construct order object for the Amazon invoice preview with individual tailoring items
  const proformaOrder = {
    id: `PROFORMA-${Date.now().toString().slice(-6)}`,
    placedAt: new Date().toISOString(),
    paymentId: null,
    orderDetails: {
      fabricName: fabric?.fabricName ?? 'Selected Textile',
      garment: productName,
      meters: fabric?.meters ?? 3,
      pricePerMeter: fabric?.pricePerMeter ?? 600,
      fabricTotal,
      baseTailoringPrice,
      totalTailoring,
      total: grandTotal,
      accessories,
      selections,
    },
    address: {
      fullName: 'Atelier Patron',
      street: 'Complimentary Measurement Address',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600034',
      phone: '+91 94440 12345',
    },
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Stepper */}
        <div className="flex items-center justify-between pb-6 border-b border-[#5C1A32]/10 mb-8">
          <Link
            to={productId ? `/custom-outfit/${productId}/accessories` : '/custom-outfit'}
            className="inline-flex items-center gap-2 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Accessories
          </Link>

          <div className="flex items-center gap-2 text-xs text-[#8A7968]">
            <span>1. Silhouette</span>
            <span>&rarr;</span>
            <span>2. Embellishments</span>
            <span>&rarr;</span>
            <span className="font-semibold text-[#5C1A32] border-b-2 border-[#5C1A32] pb-0.5">
              3. Summary &amp; Invoice
            </span>
            <span>&rarr;</span>
            <span>4. Delivery</span>
          </div>
        </div>

        {/* 2-Column Haute Couture Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Dossier Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] text-xs font-semibold mb-3">
                <Scissors className="h-3.5 w-3.5 text-[#B8935A]" />
                Atelier Specification Dossier
              </div>
              <h1 className="text-3xl md:text-4xl text-[#1B1512] mb-3" style={serif}>
                Order Price &amp; Specification Summary
              </h1>
              <p className="text-[#4A413B] text-sm md:text-base leading-relaxed">
                Review your customized{' '}
                <span className="font-semibold text-[#1B1512]">{productName.toLowerCase()}</span>{' '}
                specification, fabric meterage, and artisanal handwork details before placing your
                order.
              </p>
            </div>

            {/* Fabric Specification Card */}
            {fabric && (
              <div className="rounded-xl bg-white border border-[#5C1A32]/15 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#5C1A32]/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full border border-black/10 shadow-inner shrink-0"
                      style={{ backgroundColor: fabric.fabricHex || '#7A1F2B' }}
                    />
                    <div>
                      <h2 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase">
                        Fabric Specification
                      </h2>
                      <div className="text-sm font-semibold text-[#1B1512]">
                        {fabric.fabricName}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F6F1E7] text-[#5C1A32]">
                    Tone: {fabric.fabricTone || 'Fine Silk'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-[#8A7968] block">Required Meterage</span>
                    <span className="font-semibold text-sm text-[#1B1512]">{fabric.meters} m</span>
                  </div>
                  <div>
                    <span className="text-[#8A7968] block">Price per Meter</span>
                    <span className="font-semibold text-sm text-[#1B1512]">
                      {formatRupees(fabric.pricePerMeter)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8A7968] block">Fabric Cost</span>
                    <span className="font-bold text-sm text-[#5C1A32] font-mono">
                      {formatRupees(fabric.fabricTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bespoke Tailoring & Silhouette Breakdown Card */}
            <div className="rounded-xl bg-white border border-[#5C1A32]/15 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#5C1A32]/10 pb-3">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-[#B8935A]" />
                  <h2 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase">
                    Bespoke Tailoring &amp; Silhouette Breakdown
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-[#5C1A32]">
                  {formatRupees(totalTailoring)}
                </span>
              </div>

              {/* Base Stitching Item */}
              <div className="bg-[#FAF7F2] rounded-lg p-3.5 border border-[#5C1A32]/10 flex items-center justify-between text-sm">
                <div>
                  <span className="text-[11px] text-[#8A7968] block uppercase tracking-wider font-semibold">
                    Master Pattern Drafting &amp; Base Tailoring
                  </span>
                  <span className="font-semibold text-[#1B1512] text-sm mt-0.5 block">
                    {productName} Precision Hand-Tailoring
                  </span>
                </div>
                <span className="font-mono font-semibold text-[#5C1A32]">
                  {formatRupees(baseTailoringPrice)}
                </span>
              </div>

              {/* Sub-division options with separate tailoring amount */}
              {selections.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-[#1B1512] uppercase tracking-wider block">
                    Itemized Sub-Division Customizations:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {selections.map((sel, idx) => (
                      <div
                        key={`${sel.sectionLabel}-${String(idx)}`}
                        className="bg-[#FAF7F2] rounded-lg p-3 border border-[#5C1A32]/10 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[11px] text-[#8A7968] block uppercase tracking-wider">
                            {sel.sectionLabel}
                          </span>
                          <span className="font-semibold text-[#1B1512] text-sm mt-0.5 block">
                            {sel.subOptionLabel ?? sel.optionLabel ?? 'Atelier Standard'}
                          </span>
                        </div>
                        <div className="text-right">
                          {sel.tailoringPrice ? (
                            <span className="font-mono text-xs font-bold text-[#5C1A32]">
                              +{formatRupees(sel.tailoringPrice)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8A7968] font-medium bg-neutral-100 px-1.5 py-0.5 rounded">
                              Base Included
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accessories & Embellishments */}
            <div className="rounded-xl bg-white border border-[#5C1A32]/15 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#5C1A32]/10 pb-3">
                <h2 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase">
                  Handcrafted Trims &amp; Embellishments
                </h2>
                <span className="text-xs text-[#5C1A32] font-semibold font-mono">
                  +{formatRupees(accessoriesTotal)}
                </span>
              </div>

              {accessories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessories.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#FAF7F2] border border-[#5C1A32]/10 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#B8935A]" />
                        <span className="font-medium text-[#1B1512]">{a.label}</span>
                      </div>
                      <span className="font-semibold text-[#5C1A32] font-mono">
                        +{formatRupees(a.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8A7968]">
                  Clean minimalist finishing selected (no additional trims).
                </p>
              )}
            </div>

            {/* Reference Upload Preview (if present) */}
            {referenceImage && (
              <div className="rounded-xl bg-white border border-[#5C1A32]/15 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ImagePlus className="h-4 w-4 text-[#B8935A]" />
                  <h2 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase">
                    Client Design Reference Attached
                  </h2>
                </div>
                <div className="flex items-center gap-4 bg-[#FAF7F2] p-3 rounded-lg border border-[#5C1A32]/10">
                  <img
                    src={referenceImage.dataUrl}
                    alt="Reference upload preview"
                    className="h-16 w-16 rounded-md object-cover border border-[#5C1A32]/20 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#1B1512] truncate max-w-xs">
                      {referenceImage.fileName}
                    </p>
                    <p className="text-xs text-[#8A7968]">
                      Our master designer will review this reference against your silhouette.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Craftsmanship & Delivery Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/60 p-4 flex items-start gap-3 text-xs text-emerald-950">
                <CheckCircle className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Complimentary Home Measurement:</span> Our fashion
                  consultant can visit your location in Chennai, Bangalore, or Coimbatore for
                  precision sizing.
                </div>
              </div>

              <div className="rounded-lg bg-amber-50/60 border border-amber-200/60 p-4 flex items-start gap-3 text-xs text-amber-950">
                <Clock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">5–7 Days Doorstep Delivery:</span> Dispatched in
                  deluxe moisture-proof garment box via BlueDart Couture Express with live tracking.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Commercial & Proforma Card (5 cols) */}
          <div className="lg:col-span-5 sticky top-8 space-y-6">
            <div className="rounded-xl bg-white border border-[#5C1A32]/15 shadow-lg overflow-hidden">
              {/* Couture Sketch Architectural Banner */}
              <div className="relative aspect-[3/4] max-h-[360px] w-full bg-[#F6F1E7] overflow-hidden border-b border-[#5C1A32]/10">
                <img
                  src={coutureSketch.imageUrl}
                  alt={coutureSketch.title}
                  className="w-full h-full object-cover object-top filter contrast-[1.03]"
                />
                <div className="absolute top-3 left-3 bg-[#1B1512]/80 backdrop-blur-sm text-[#F6F1E7] text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded">
                  {coutureSketch.badge}
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 text-white">
                  <div className="text-xs uppercase tracking-wider text-[#B8935A] font-semibold">
                    Atelier Architectural Blueprint
                  </div>
                  <div className="text-lg font-bold" style={serif}>
                    {coutureSketch.title}
                  </div>
                  <div className="text-xs text-neutral-300">{coutureSketch.subtitle}</div>
                </div>
              </div>

              {/* Pricing & Commercial Breakdown */}
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#5C1A32]/10 pb-3">
                  <h3 className="text-xs font-bold tracking-widest text-[#1B1512] uppercase">
                    Commercial Breakdown (GST Incl.)
                  </h3>
                  <span className="text-[11px] text-[#8A7968]">HSN 6211</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  {fabric && (
                    <div className="flex items-center justify-between text-[#4A413B]">
                      <span>
                        Fabric: {fabric.fabricName} ({fabric.meters}m)
                      </span>
                      <span className="font-mono text-[#1B1512]">
                        {formatRupees(fabric.fabricTotal)}
                      </span>
                    </div>
                  )}

                  {/* Base Tailoring */}
                  <div className="flex items-center justify-between text-[#4A413B]">
                    <span>Base Stitching ({productName})</span>
                    <span className="font-mono text-[#1B1512]">
                      {formatRupees(baseTailoringPrice)}
                    </span>
                  </div>

                  {/* Itemized Sub-Division Tailoring Charges */}
                  {selections
                    .filter((s) => (s.tailoringPrice ?? 0) > 0)
                    .map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-[#736357] pl-3 border-l-2 border-[#5C1A32]/25"
                      >
                        <span className="truncate max-w-[210px]">
                          + {s.subOptionLabel ?? s.optionLabel} ({s.sectionLabel})
                        </span>
                        <span className="font-mono text-[#5C1A32] font-semibold">
                          +{formatRupees(s.tailoringPrice ?? 0)}
                        </span>
                      </div>
                    ))}

                  <div className="flex items-center justify-between text-[#4A413B]">
                    <span>Embellishments &amp; Trims</span>
                    <span className="font-mono text-[#1B1512]">
                      {formatRupees(accessoriesTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#8A7968] pt-1 border-t border-dashed border-[#5C1A32]/10">
                    <span>Taxable Value:</span>
                    <span className="font-mono">{formatRupees(Math.round(grandTotal / 1.05))}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A7968]">
                    <span>Estimated 5% GST (CGST + SGST):</span>
                    <span className="font-mono">
                      {formatRupees(Math.round(grandTotal - grandTotal / 1.05))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                    <span>Insured Courier Shipping</span>
                    <span className="uppercase font-bold">Free</span>
                  </div>
                </div>

                {/* Grand Total Box */}
                <div className="rounded-xl bg-[#1B1512] text-[#F6F1E7] p-5 flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-xs text-[#B8935A] uppercase tracking-wider block font-semibold">
                      Total Payable
                    </span>
                    <span className="text-xs text-neutral-300">
                      All Taxes &amp; Sizing Included
                    </span>
                  </div>
                  <span className="text-2xl md:text-3xl font-bold text-white" style={serif}>
                    {formatRupees(grandTotal)}
                  </span>
                </div>

                {/* Amazon Invoice Action */}
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 border border-[#5C1A32]/30 hover:border-[#5C1A32] bg-[#FAF7F2] hover:bg-[#5C1A32]/5 text-[#5C1A32] font-semibold text-xs px-4 py-3 rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Preview Proforma Tax Invoice (Amazon Format)</span>
                </button>

                {/* Primary Proceed CTA */}
                <button
                  type="button"
                  onClick={handleProceed}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#5C1A32] hover:bg-[#431224] text-[#F6F1E7] font-semibold text-base px-6 py-4 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <span>Proceed to Delivery &amp; Fit</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amazon-Style Tax Invoice Modal */}
      <AmazonInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        order={proformaOrder}
      />
    </div>
  );
}
