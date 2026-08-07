import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ImagePlus } from 'lucide-react';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx / OrderTracking.tsx / CustomOutfit.tsx / ProductStyle.tsx / ProductAccessories.tsx)
//   ink      #1B1512  headings, primary text, grand-total panel
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink / rose)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for page title and totals.

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

// Fabric details forwarded from FabricDetail.tsx -> CustomOutfit.tsx ->
// ProductStyle.tsx -> ProductAccessories.tsx.
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

// Reference photo forwarded from ProductStyle.tsx -> ProductAccessories.tsx
// -> here. Carried through untouched and passed on to Order/Payment so it
// ends up on the saved order for AdminOrders/OrderTracking to display.
interface IncomingReferenceImage {
  dataUrl: string;
  fileName: string;
}

interface IncomingState {
  productName?: string;
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
  const accessories = state.accessories ?? [];
  const accessoriesTotal = state.accessoriesTotal ?? 0;
  const fabric = state.fabric ?? null;
  const referenceImage = state.referenceImage ?? null;
  const grandTotal = accessoriesTotal + (fabric?.fabricTotal ?? 0);

  const handleProceed = () => {
    void navigate('/order', {
      state: {
        productId,
        productName,
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

  return (
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] px-6 pt-16 pb-12">
      <div className="max-w-2xl mx-auto pt-10">
        <Link
          to={productId ? `/custom-outfit/${productId}/accessories` : '/custom-outfit'}
          className="inline-flex items-center gap-1.5 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl md:text-4xl text-[#1B1512] mb-2" style={serif}>
          Price Summary
        </h1>
        <p className="text-[#4A413B] mb-10">
          Here's a recap of your {productName.toLowerCase()} before checkout.
        </p>

        {fabric && (
          <div className="rounded-sm bg-white border border-[#5C1A32]/12 shadow-sm p-6 mb-6">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
              Fabric
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#4A413B]">Fabric</span>
                <span className="font-medium text-[#1B1512]">{fabric.fabricName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4A413B]">Meters</span>
                <span className="font-medium text-[#1B1512]">{fabric.meters} m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4A413B]">Price per meter</span>
                <span className="font-medium text-[#1B1512]">
                  {formatRupees(fabric.pricePerMeter)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#5C1A32]/10">
                <span className="text-[#2A211D] font-semibold">Fabric Total</span>
                <span className="font-semibold text-[#5C1A32]">
                  {formatRupees(fabric.fabricTotal)}
                </span>
              </div>
            </div>
          </div>
        )}

        {selections.length > 0 && (
          <div className="rounded-sm bg-white border border-[#5C1A32]/12 shadow-sm p-6 mb-6">
            <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
              Style Selected
            </h2>
            <div className="space-y-2">
              {selections.map((sel, idx) => (
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

        {/* Reference photo — only present if the client uploaded one on
            the style page. Carried through unchanged into /order state so
            it lands on the saved order for AdminOrders/OrderTracking. */}
        {referenceImage && (
          <div className="rounded-sm bg-white border border-[#5C1A32]/12 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ImagePlus className="h-4 w-4 text-[#B8935A]" />
              <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase">
                Reference Photo
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={referenceImage.dataUrl}
                alt="Reference upload preview"
                className="h-20 w-20 rounded-sm object-cover border border-[#5C1A32]/10 shrink-0"
              />
              <p className="text-sm text-[#4A413B] truncate">{referenceImage.fileName}</p>
            </div>
          </div>
        )}

        <div className="rounded-sm bg-white border border-[#5C1A32]/12 shadow-sm p-6 mb-6">
          <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[#1B1512] uppercase mb-4">
            Accessories &amp; Embellishments
          </h2>
          {accessories.length > 0 ? (
            <div className="space-y-2">
              {accessories.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-[#2A211D]">{a.label}</span>
                  <span className="font-medium text-[#5C1A32]">+{formatRupees(a.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#4A413B]/60">No add-ons selected.</p>
          )}
        </div>

        <div className="rounded-sm bg-[#1B1512] text-[#F6F1E7] p-6 mb-10 flex items-center justify-between">
          <span className="font-semibold">{fabric ? 'Grand Total' : 'Tailoring Total'}</span>
          <span className="text-2xl font-bold" style={serif}>
            {formatRupees(grandTotal)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleProceed}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1B1512] text-[#F6F1E7] font-semibold text-sm px-6 py-4 rounded-full hover:bg-[#5C1A32] transition-colors"
        >
          Proceed to Order
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
