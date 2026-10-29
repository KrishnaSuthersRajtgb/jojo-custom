import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shirt,
  Layers,
  Sparkles,
  Crown,
  PackageCheck,
  Ruler,
  Package,
  ArrowRight,
  Check,
} from 'lucide-react';

// ── Design tokens (matches Home.tsx / Navbar.tsx / Footer.tsx / FabricDetail.tsx / Order.tsx / Payment.tsx / OrderTracking.tsx)
//   ink      #1B1512  headings, primary text, selected-card background
//   wine     #5C1A32  primary accent (replaces fuchsia-800 / pink / rose)
//   brass    #B8935A  secondary accent — icon tiles
//   bone     #F6F1E7  page background
// Display face: Fraunces, for the page title only.

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface Product {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// Fabric details forwarded from FabricDetail.tsx's "Customize to JOJO"
// button (see navigate("/custom-outfit", { state: { fabric } })).
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

interface CustomOutfitState {
  fabric?: IncomingFabric;
}

const PRODUCTS: Product[] = [
  {
    id: 'blouse',
    name: 'Blouse',
    description: 'Fitted or designer-back blouses, tailored to your size.',
    icon: <Shirt className="h-6 w-6" />,
  },
  {
    id: 'chudidhar',
    name: 'Chudidhar',
    description: 'Classic or Anarkali-style sets stitched to measure.',
    icon: <Layers className="h-6 w-6" />,
  },
  {
    id: 'frocks',
    name: 'Frocks',
    description: 'Everyday and party frocks in your choice of fabric.',
    icon: <Sparkles className="h-6 w-6" />,
  },
  {
    id: 'lehanga',
    name: 'Lehanga',
    description: 'Festive lehangas with custom embroidery options.',
    icon: <Crown className="h-6 w-6" />,
  },
  {
    id: 'ready-to-wear-saree',
    name: 'Ready to Wear Saree',
    description: 'Pre-stitched sarees, ready in your exact size.',
    icon: <PackageCheck className="h-6 w-6" />,
  },
  {
    id: 'pant',
    name: 'Pant',
    description: 'Palazzos, straight pants, and more, made to fit.',
    icon: <Ruler className="h-6 w-6" />,
  },
  {
    id: 'over-coat',
    name: 'Over Coat',
    description: 'Layered over-coats tailored for a sharp silhouette.',
    icon: <Package className="h-6 w-6" />,
  },
];

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function CustomOutfit() {
  const navigate = useNavigate();
  const location = useLocation();
  const fabric = (location.state as CustomOutfitState | null)?.fabric ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProduct = PRODUCTS.find((p) => p.id === selectedId) ?? null;

  const handleContinue = () => {
    if (!fabric) {
      void navigate('/fabrics');
      return;
    }
    if (!selectedProduct) return;
    void navigate(`/custom-outfit/${selectedProduct.id}`, {
      state: { productName: selectedProduct.name, fabric },
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl text-[#1B1512] mb-2" style={serif}>
            Customize Your Outfit
          </h1>
          <p className="text-[#4A413B] max-w-xl mx-auto">
            Pick what you'd like to have tailored. You can add your measurements and fabric choice
            in the next step.
          </p>
        </div>

        {fabric && (
          <div className="mb-8 max-w-xl mx-auto rounded-sm border border-[#5C1A32]/15 bg-white px-5 py-3 flex items-center justify-between text-sm">
            <span className="text-[#4A413B]">
              Fabric selected:{' '}
              <span className="font-semibold text-[#1B1512]">{fabric.fabricName}</span>
            </span>
            <span className="font-semibold text-[#5C1A32]">
              {fabric.meters}m · {formatRupees(fabric.fabricTotal)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {PRODUCTS.map((product) => {
            const isSelected = product.id === selectedId;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setSelectedId(product.id);
                }}
                aria-pressed={isSelected}
                className={`group relative text-left rounded-sm p-6 flex flex-col transition-all border ${
                  isSelected
                    ? 'bg-[#1B1512] border-transparent text-[#F6F1E7] shadow-md'
                    : 'bg-white border-[#5C1A32]/12 hover:shadow-md hover:border-[#5C1A32]/30 text-[#1B1512]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 h-6 w-6 rounded-full bg-[#F6F1E7]/15 flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`h-12 w-12 rounded-sm flex items-center justify-center mb-4 ${
                    isSelected ? 'bg-[#F6F1E7]/15 text-[#B8935A]' : 'bg-[#5C1A32]/8 text-[#5C1A32]'
                  }`}
                >
                  {product.icon}
                </div>
                <h3 className="text-base font-semibold mb-1">{product.name}</h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isSelected ? 'text-[#F6F1E7]/75' : 'text-[#4A413B]'
                  }`}
                >
                  {product.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!fabric ? false : !selectedProduct}
            className={`inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full transition-colors ${
              !fabric || selectedProduct
                ? 'bg-[#1B1512] text-[#F6F1E7] hover:bg-[#5C1A32]'
                : 'bg-[#5C1A32]/10 text-[#4A413B]/50 cursor-not-allowed'
            }`}
          >
            {!fabric
              ? 'Select a fabric first'
              : selectedProduct
                ? `Continue with ${selectedProduct.name}`
                : 'Select an item to continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
