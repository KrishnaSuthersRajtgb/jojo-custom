import { useRef } from 'react';
import { Printer, X, Scissors, Ruler, Sparkles, CheckSquare, Shirt } from 'lucide-react';
import { getCoutureSketchForGarment } from '../utils/coutureSketches';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export interface JobCardOrder {
  id: string;
  placedAt: string;
  status?: string | undefined;
  paymentId?: string | null | undefined;
  trackingNumber?: string | undefined;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | undefined;
    city: string;
    state: string;
    pincode: string;
  };
  orderDetails: {
    garment: string;
    garmentLabel?: string | undefined;
    fabricId: string;
    fabricName: string;
    tone?: string | undefined;
    meters: number;
    pricePerMeter?: number | undefined;
    total: number;
    isCustom?: boolean | undefined;
    selections?:
      | Array<{
          sectionLabel: string;
          optionLabel: string | null;
          subOptionLabel: string | null;
        }>
      | null
      | undefined;
    accessories?:
      | Array<{
          id: string;
          label: string;
          price: number;
        }>
      | undefined;
    measurementValues?: Record<string, string> | null | undefined;
    bodyType?: string | null | undefined;
  };
}

interface AtelierJobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: JobCardOrder | null;
}

export default function AtelierJobCardModal({ isOpen, onClose, order }: AtelierJobCardModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const { orderDetails, address } = order;
  const illustration = getCoutureSketchForGarment(
    orderDetails.garment,
    orderDetails.selections?.[0]?.subOptionLabel ??
      orderDetails.selections?.[0]?.optionLabel ??
      undefined,
  );

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.placedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-[#5C1A32]/25 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-3.5 bg-[#1B1512] text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-[#B8935A]" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#E8DFC8]">
              Atelier Master Tailor Job Card &amp; Cutting Sheet
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#5C1A32] hover:bg-[#431224] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sheet (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Production Sheet Body */}
        <div
          ref={printableRef}
          className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-[#1B1512] print-sheet-container bg-white"
        >
          {/* Header */}
          <div className="border-b-2 border-[#1B1512] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] tracking-[0.25em] font-bold text-[#5C1A32] uppercase">
                JoJo Flora Couture Atelier
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1B1512]" style={serif}>
                MASTER TAILOR PRODUCTION WORK ORDER
              </h1>
              <p className="text-[11px] text-neutral-500">
                14/2, KNK Road, Nungambakkam, Chennai · Atelier Cutting Table Job Specification
              </p>
            </div>
            <div className="text-right border-l-2 sm:border-l-0 sm:border-r-0 pl-3 sm:pl-0 border-neutral-300">
              <div className="text-xs font-mono font-bold text-[#5C1A32]">
                ORDER REF: {order.id.slice(-10).toUpperCase()}
              </div>
              <div className="text-[11px] text-neutral-600">Date Commissioned: {formattedDate}</div>
              <div className="inline-block mt-1 px-2 py-0.5 rounded bg-neutral-100 font-mono text-[10px] font-bold uppercase text-neutral-800 border">
                STATUS: {order.status || 'Active Cutting'}
              </div>
            </div>
          </div>

          {/* Section 1: Client & Garment Specification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-neutral-200 rounded-lg p-4 bg-[#FAF7F2]/40 text-xs">
            {/* Left: Client & Delivery Info */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 block">
                Patron &amp; Delivery Destination
              </span>
              <p className="font-bold text-sm text-[#1B1512]">{address.fullName}</p>
              <p className="text-neutral-600 leading-snug">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
                <br />
                {address.city}, {address.state} - {address.pincode}
              </p>
              <p className="font-semibold text-neutral-700 pt-1">Client Phone: {address.phone}</p>
            </div>

            {/* Right: Garment & Fabric Specification */}
            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-neutral-200 sm:pl-4 pt-3 sm:pt-0">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#5C1A32] block">
                Textile &amp; Pattern Details
              </span>
              <p className="font-bold text-sm text-[#1B1512] capitalize flex items-center gap-1.5">
                <Shirt className="h-4 w-4 text-[#5C1A32]" />
                {orderDetails.garmentLabel ?? orderDetails.garment}
              </p>
              <p className="text-neutral-700">
                Fabric: <strong className="text-[#1B1512]">{orderDetails.fabricName}</strong> (
                {orderDetails.meters} Metres)
              </p>
              <p className="text-neutral-600">
                Textile Code: <span className="font-mono">{orderDetails.fabricId}</span> · Tone:{' '}
                <span className="capitalize">{orderDetails.tone || 'Custom'}</span>
              </p>
              {order.trackingNumber && (
                <p className="text-emerald-700 font-semibold font-mono text-[11px]">
                  BlueDart AWB: {order.trackingNumber}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Sketch + Measurement Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Couture Draft Illustration */}
            <div className="md:col-span-4 border border-neutral-200 rounded-lg p-3 text-center bg-white space-y-2">
              <div className="aspect-[3/4] max-h-52 w-full rounded overflow-hidden border border-neutral-100 bg-[#FAF7F2] mx-auto flex items-center justify-center">
                <img
                  src={illustration.imageUrl}
                  alt={illustration.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[11px] font-bold text-[#1B1512]">{illustration.title}</div>
              <div className="text-[9px] font-mono text-neutral-500 uppercase">
                {illustration.badge}
              </div>
            </div>

            {/* Right: Master Measurement Sheet */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-[#5C1A32]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1512]">
                    Bespoke Tailoring Measurement Chart
                  </h3>
                </div>
                {orderDetails.bodyType && (
                  <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded capitalize">
                    Body: {orderDetails.bodyType}
                  </span>
                )}
              </div>

              {orderDetails.measurementValues &&
              Object.keys(orderDetails.measurementValues).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(orderDetails.measurementValues).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2 rounded border border-neutral-200 bg-[#FAF7F2]/50 flex items-center justify-between"
                    >
                      <span className="text-[11px] text-neutral-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-bold text-sm text-[#5C1A32] font-mono">{val}"</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
                  <p className="font-semibold text-neutral-800 mb-1">
                    Standard Atelier Measurement Profile
                  </p>
                  <p className="text-[11px]">
                    Bust: 36" · Waist: 30" · Hip: 40" · Shoulder: 14.5" · Sleeve: 10" · Length: 15"
                  </p>
                </div>
              )}

              {/* Style Cuts Chosen */}
              {orderDetails.selections && orderDetails.selections.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                    Selected Pattern Cuts &amp; Silhouettes:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {orderDetails.selections.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-neutral-50 border border-neutral-200 text-[11px]"
                      >
                        <span className="text-neutral-500">{s.sectionLabel}:</span>{' '}
                        <strong className="text-neutral-800">
                          {s.subOptionLabel || s.optionLabel || 'Standard'}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Embellishments to Attach */}
              {orderDetails.accessories && orderDetails.accessories.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8935A] block mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Handcrafted Trims &amp; Embellishments to Mount:
                  </span>
                  <div className="space-y-1">
                    {orderDetails.accessories.map((acc) => (
                      <div
                        key={acc.id}
                        className="text-xs flex items-center justify-between border-b border-dashed border-neutral-200 py-1"
                      >
                        <span>• {acc.label}</span>
                        <span className="font-mono text-[11px] text-neutral-500">
                          Unit Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Artisan Production Checklist */}
          <div className="border border-neutral-300 rounded-lg p-4 bg-white text-xs space-y-3">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-700 text-[11px]">
              <CheckSquare className="h-3.5 w-3.5 text-[#5C1A32]" />
              <span>Production Stage Quality Checklist</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>1. Fabric Shrinkage &amp; Iron</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>2. Pattern Outline Cut</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>3. Zardozi Embroidery</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>4. Bodice Stitch &amp; Lining</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>5. Fitting Tolerance Check</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>6. Hand Hemming &amp; Tassels</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>7. Steam Press Finished</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                <input type="checkbox" className="accent-[#5C1A32]" />
                <span>8. Deluxe Box Packed</span>
              </label>
            </div>
          </div>

          {/* Section 4: Sign-off Signatures */}
          <div className="pt-4 border-t border-neutral-300 grid grid-cols-3 gap-6 text-xs text-center">
            <div>
              <div className="h-10 border-b border-dashed border-neutral-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Master Cutter Sign
              </span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-neutral-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Head Tailor Sign
              </span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-neutral-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Quality Inspection Seal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
