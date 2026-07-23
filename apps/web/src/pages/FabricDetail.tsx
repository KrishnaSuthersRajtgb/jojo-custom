import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart, Scissors } from "lucide-react";
import { FABRICS, GARMENT_TYPES, type GarmentType } from "../data/fabrics";

export default function FabricDetail() {
  const { tone, fabricId } = useParams<{ tone: string; fabricId: string }>();
  const navigate = useNavigate();

 const fabric = FABRICS.find((f) => f.id === fabricId && f.tone === tone);

  const defaultGarment = GARMENT_TYPES[0];
  if (!defaultGarment) {
    throw new Error("GARMENT_TYPES must contain at least one garment type.");
  }

  const [selectedGarment, setSelectedGarment] = useState<GarmentType>(
    defaultGarment
  );
  const [meters, setMeters] = useState(defaultGarment.defaultMeters);
  const [metersInput, setMetersInput] = useState(
    String(defaultGarment.defaultMeters)
  );

  // Guard: unknown fabric/tone combo in the URL -> send back to the fabrics dashboard
  if (!fabric) {
    return <Navigate to="/fabrics" replace />;
  }

  const total = meters * fabric.pricePerMeter;

  const handleSelectGarment = (garment: GarmentType) => {
    setSelectedGarment(garment);
    setMeters(garment.defaultMeters);
    setMetersInput(String(garment.defaultMeters));
  };

  const decreaseMeters = () => {
    setMeters((m) => {
      const next = Math.max(0.5, +(m - 0.5).toFixed(1));
      setMetersInput(String(next));
      return next;
    });
  };

  const increaseMeters = () => {
    setMeters((m) => {
      const next = +(m + 0.5).toFixed(1);
      setMetersInput(String(next));
      return next;
    });
  };

  const handleMetersInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string and partial decimal input (e.g. "1.") while typing
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setMetersInput(value);
    }
  };

  const commitMetersInput = () => {
    const parsed = parseFloat(metersInput);
    const next = isNaN(parsed) ? meters : Math.max(0.5, +parsed.toFixed(1));
    setMeters(next);
    setMetersInput(String(next));
  };

  const handleMetersInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleBuyNow = () => {
  // TODO: wire to actual checkout/order flow (e.g. POST /api/orders)
  const orderDetails = {
    fabricId: fabric.id,
    fabricName: fabric.name,
    tone: fabric.tone,
    garment: selectedGarment.id,
    meters,
    pricePerMeter: fabric.pricePerMeter,
    total,
  };
  console.log("Buy Now:", orderDetails);
  void navigate("/order", { state: orderDetails });
};

  const handleInHouse = () => {
    // TODO: wire to actual "Customize to JOJO" request flow
    console.log("Customize to JOJO:", {
      fabricId: fabric.id,
      garment: selectedGarment.id,
      meters,
      total,
    });
  };

  return (
    <div className="w-full">
      <section className="w-full px-6 py-10 bg-rose-50/40">
        <div className="max-w-3xl mx-auto">
          <button
  onClick={() => { void navigate("/fabrics"); }}
  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
>
            <ArrowLeft className="h-4 w-4" />
            Back to fabrics
          </button>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row">
          {/* Swatch strip */}
          <div className="flex sm:flex-col w-full sm:w-40 h-40 sm:h-auto shrink-0">
            <div
              className="flex-1"
              style={{ backgroundColor: fabric.hex, opacity: 0.9 }}
            />
            <div
              className="flex-1"
              style={{ backgroundColor: fabric.hex, opacity: 0.6 }}
            />
            <div
              className="flex-1"
              style={{ backgroundColor: fabric.hex, opacity: 0.35 }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <h1 className="text-3xl font-serif font-bold text-gray-900">
              {fabric.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              {fabric.description}
            </p>

            {/* Garment type picker */}
            <p className="text-xs font-bold tracking-wide text-gray-800 mb-2">
              WHAT WOULD YOU LIKE TO MAKE?
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {GARMENT_TYPES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { handleSelectGarment(g); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedGarment.id === g.id
                      ? "bg-fuchsia-800 border-fuchsia-800 text-white"
                      : "border-gray-200 text-gray-600 hover:border-fuchsia-800"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Meters stepper */}
            <p className="text-sm font-semibold text-gray-800 mb-2">
              How many meters?
            </p>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={decreaseMeters}
                className="h-9 w-9 rounded-full border border-fuchsia-800 text-fuchsia-800 flex items-center justify-center hover:bg-fuchsia-50"
                aria-label="Decrease meters"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={metersInput}
                  onChange={handleMetersInputChange}
                  onBlur={commitMetersInput}
                  onKeyDown={handleMetersInputKeyDown}
                  className="w-14 text-lg font-bold text-gray-900 text-center bg-transparent border-b border-transparent focus:border-fuchsia-800 focus:outline-none"
                  aria-label="Meters"
                />
                <span className="text-lg font-bold text-gray-900">m</span>
              </div>
              <button
                onClick={increaseMeters}
                className="h-9 w-9 rounded-full border border-fuchsia-800 text-fuchsia-800 flex items-center justify-center hover:bg-fuchsia-50"
                aria-label="Increase meters"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-500">
                Total: <span className="font-bold text-gray-900">₹{total}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBuyNow}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-800 to-pink-600 text-white font-semibold py-3 px-4 hover:opacity-95 transition-opacity"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy Now
              </button>
              <button
                onClick={handleInHouse}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-800 text-fuchsia-800 font-semibold py-3 px-4 hover:bg-fuchsia-50 transition-colors"
              >
                <Scissors className="h-4 w-4" />
                Customize to JOJO
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}