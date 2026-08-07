import { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx / OrderTracking.tsx / CustomOutfit.tsx / ProductStyle.tsx)
//   ink      #1B1512  headings, primary text
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink / rose)
//   brass    #B8935A  secondary accent
//   bone     #F6F1E7  page background
// Display face: Fraunces, for page titles and totals.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface AccessoryOption {
  id: string;
  label: string;
  price: number;
}

// Same add-on list is used for every product by default. Send over a
// product-specific list (like you did for Blouse Styles / Chudidhar
// Kurta Types) whenever an item needs different embellishment options,
// and add it to PRODUCT_ACCESSORIES below.
const DEFAULT_ACCESSORIES: AccessoryOption[] = [
  { id: 'zari-embroidery', label: 'Zari Embroidery', price: 800 },
  { id: 'mirror-work-border', label: 'Mirror Work Border', price: 650 },
  { id: 'hand-embroidery', label: 'Hand Embroidery', price: 1200 },
  { id: 'stone-work', label: 'Stone Work', price: 750 },
  { id: 'tassel-detailing', label: 'Tassel Detailing', price: 320 },
  { id: 'piping-edge', label: 'Piping Edge', price: 200 },
  { id: 'embroidered-belt', label: 'Embroidered Belt', price: 450 },
  { id: 'contrast-lining', label: 'Contrast Lining', price: 280 },
];

const PRODUCT_ACCESSORIES: Record<string, AccessoryOption[]> = {
  blouse: DEFAULT_ACCESSORIES,
  chudidhar: DEFAULT_ACCESSORIES,
  frocks: DEFAULT_ACCESSORIES,
  lehanga: DEFAULT_ACCESSORIES,
  'ready-to-wear-saree': DEFAULT_ACCESSORIES,
  pant: DEFAULT_ACCESSORIES,
  'over-coat': DEFAULT_ACCESSORIES,
};

// Fabric details forwarded from FabricDetail.tsx -> CustomOutfit.tsx ->
// ProductStyle.tsx. Carried through here untouched and passed on to the
// price summary page.
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

// Reference photo forwarded from ProductStyle.tsx. Carried through here
// untouched and passed on to ProductSummary.tsx -> Order.tsx ->
// Payment.tsx, so it ends up on the saved order for
// AdminOrders.tsx/OrderTracking.tsx to display.
interface IncomingReferenceImage {
  dataUrl: string;
  fileName: string;
}

// Whatever ProductStyle.tsx passed forward via router state — carried
// through here and on to the price summary page unchanged.
interface IncomingState {
  productName?: string;
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

  const accessories = productId ? PRODUCT_ACCESSORIES[productId] : undefined;
  const productName = incoming.productName ?? productId ?? 'Item';

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  if (!productId || !accessories) {
    return (
      <div className="w-full min-h-screen bg-[#F6F1E7] px-6 pt-16 pb-16 flex items-center justify-center text-center">
        <div>
          <p className="text-[#4A413B] mb-4">We couldn't find that product.</p>
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
    // pt-16 clears the fixed h-16 Navbar; min-h-screen keeps the bone
    // background filling the viewport instead of showing white below
    // shorter content.
    <div className="w-full min-h-screen bg-[#F6F1E7] px-6 pt-16 pb-12">
      <div className="max-w-3xl mx-auto pt-10">
        <Link
          to={`/custom-outfit/${productId}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#4A413B] hover:text-[#5C1A32] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl text-[#1B1512] mb-2" style={serif}>
              Accessories &amp; Embellishments
            </h1>
            <p className="text-[#4A413B]">
              Optional add-ons for your {productName.toLowerCase()} — select as many as you like.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-[#4A413B]/60 mb-1">
              {fabric ? 'Running total' : 'Tailoring total'}
            </div>
            <div className="text-2xl font-bold text-[#5C1A32]" style={serif}>
              {formatRupees(grandTotal)}
            </div>
            {fabric && (
              <div className="text-[11px] text-[#4A413B]/60 mt-0.5">
                incl. {formatRupees(fabric.fabricTotal)} fabric
              </div>
            )}
          </div>
        </div>

        {fabric && (
          <div className="mb-8 rounded-sm border border-[#5C1A32]/15 bg-white px-5 py-3 flex items-center justify-between text-sm">
            <span className="text-[#4A413B]">
              Fabric: <span className="font-semibold text-[#1B1512]">{fabric.fabricName}</span>
            </span>
            <span className="font-semibold text-[#5C1A32]">
              {fabric.meters}m · {formatRupees(fabric.fabricTotal)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accessories.map((accessory) => {
            const isChecked = Boolean(selected[accessory.id]);
            return (
              <label
                key={accessory.id}
                className={`flex items-center justify-between gap-3 rounded-sm border px-5 py-4 cursor-pointer transition-colors ${
                  isChecked
                    ? 'border-[#5C1A32] bg-[#5C1A32]/5'
                    : 'border-[#5C1A32]/12 hover:border-[#5C1A32]/30 bg-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      toggleAccessory(accessory.id);
                    }}
                    className="h-4 w-4 accent-[#5C1A32]"
                  />
                  <span className="text-sm font-medium text-[#1B1512]">{accessory.label}</span>
                </span>
                <span className="text-sm font-semibold text-[#5C1A32]">
                  +{formatRupees(accessory.price)}
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleViewSummary}
          className="mt-10 w-full inline-flex items-center justify-center gap-2 bg-[#1B1512] text-[#F6F1E7] font-semibold text-sm px-6 py-4 rounded-full hover:bg-[#5C1A32] transition-colors"
        >
          View Price Summary
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
