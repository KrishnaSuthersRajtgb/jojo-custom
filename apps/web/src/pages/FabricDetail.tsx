import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart, Scissors } from "lucide-react";
import { FABRICS, GARMENT_TYPES, type GarmentType } from "../data/fabrics";

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

  const applyMeters = (value: number) => {
    const next = Math.min(METER_MAX, Math.max(METER_MIN, +value.toFixed(1)));
    setMeters(next);
    setMetersInput(String(next));
  };

  const decreaseMeters = () => applyMeters(meters - 0.5);
  const increaseMeters = () => applyMeters(meters + 0.5);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyMeters(parseFloat(e.target.value));
  };

  const handlePresetClick = (value: number) => applyMeters(value);

  const handleMetersInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string and partial decimal input (e.g. "1.") while typing
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
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
    // Send the chosen fabric + garment + meters over to the Custom
    // Outfit flow so ProductStyle / Accessories / Summary can carry it
    // through to checkout alongside the tailoring style selections.
    const fabricDetails = {
      fabricId: fabric.id,
      fabricName: fabric.name,
      fabricTone: fabric.tone,
      fabricHex: fabric.hex,
      pricePerMeter: fabric.pricePerMeter,
      garment: selectedGarment.id,
      garmentLabel: selectedGarment.label,
      meters,
      fabricTotal: total,
    };
    void navigate("/custom-outfit", { state: { fabric: fabricDetails } });
  };

  // Fallbacks for optional spec fields — see data/fabrics.ts note
  const specs = [
    { label: "Fabric", value: fabric.material ?? "Fabric" },
    { label: "Tone", value: fabric.tone },
    { label: "Colour", value: fabric.colourName ?? fabric.tone },
    { label: "Width", value: fabric.width ?? "44 Inches" },
    { label: "Care", value: fabric.care ?? "Dry Clean" },
  ];

  const sliderFillPct =
    ((meters - METER_MIN) / (METER_MAX - METER_MIN)) * 100;

  return (
    // pt-16 clears the fixed h-16 Navbar (z-[60]) so this page's content
    // starts right below it instead of being pushed down the viewport or
    // hidden underneath it.
    <div className="w-full bg-[#F6F1E7] pt-16">
      <section className="w-full px-4 sm:px-6 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => { void navigate("/fabrics"); }}
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
                    {(fabric.material ?? "Fabric")} · {fabric.colourName ?? fabric.tone}
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
                      onClick={() => { handleSelectGarment(g); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedGarment.id === g.id
                          ? "bg-[#5C1A32] border-[#5C1A32] text-[#F6F1E7]"
                          : "border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]"
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
                <p className="text-sm font-semibold text-[#1B1512]">
                  How many meters do you need?
                </p>
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
                    background: `linear-gradient(to right, #5C1A32 0%, #5C1A32 ${sliderFillPct}%, rgba(92,26,50,0.15) ${sliderFillPct}%, rgba(92,26,50,0.15) 100%)`,
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
                    onClick={() => { handlePresetClick(p); }}
                    className={`px-3 py-1.5 rounded-sm border text-sm font-medium transition-colors ${
                      meters === p
                        ? "bg-[#B8935A] border-[#B8935A] text-[#1B1512]"
                        : "border-[#5C1A32]/20 text-[#4A413B] hover:border-[#5C1A32]"
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
                    ₹{fabric.pricePerMeter} × {meters}m
                  </p>
                  <p className="text-xs text-[#8A7E74]">+ Stitching charges apply</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-[#1B1512] text-[#F6F1E7] font-semibold py-3 px-4 hover:bg-[#5C1A32] transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Buy Now
                </button>
                <button
                  onClick={handleInHouse}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm border border-[#5C1A32] text-[#5C1A32] font-semibold py-3 px-4 hover:bg-[#5C1A32]/5 transition-colors"
                >
                  <Scissors className="h-4 w-4" />
                  Customize to JOJO
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}