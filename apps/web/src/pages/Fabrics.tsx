import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TONES, MATERIALS, FABRICS, type Tone } from "../data/fabrics";

// Same tokens as Home.tsx — ink / wine / brass / bone, Fraunces + Inter.
// See Home.tsx for the full token comment and the Google Fonts link to
// add once to index.html.
const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

// Small chevron used on every collapsible section header.
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-[#4A413B]/50 transition-transform shrink-0 ${
        open ? "rotate-180" : ""
      }`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Fabrics() {
  const navigate = useNavigate();
  const [selectedTones, setSelectedTones] = useState<Tone[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Each filter group opens/closes independently via its own down-chevron,
  // instead of one all-or-nothing "Filters" toggle. Both start open so the
  // page reads the same as before on first load.
  const [toneOpen, setToneOpen] = useState(true);
  const [materialOpen, setMaterialOpen] = useState(true);

  const toggleTone = (tone: Tone) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  };

  const clearTones = () => { setSelectedTones([]); };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(material)
        ? prev.filter((m) => m !== material)
        : [...prev, material]
    );
  };

  const clearMaterials = () => { setSelectedMaterials([]); };

  const filteredFabrics = useMemo(() => {
    return FABRICS.filter((f) => {
      const toneMatch =
        selectedTones.length === 0 || selectedTones.includes(f.tone);
      const materialMatch =
        selectedMaterials.length === 0 ||
        selectedMaterials.includes(f.material);
      return toneMatch && materialMatch;
    });
  }, [selectedTones, selectedMaterials]);

  const activeFilterCount = selectedTones.length + selectedMaterials.length;

  return (
    <div className="w-full bg-[#F6F1E7] min-h-screen">
      {/* Sticky under the navbar — stays put while the grid/filters scroll beneath it */}
      <section className="w-full px-6 pt-10 pb-6 sticky top-16 z-30 bg-[#F6F1E7] border-b border-[#5C1A32]/10">
        <div className="max-w-6xl mx-auto">
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] text-[#5C1A32] uppercase mb-3">
            The Swatch Library
          </span>
          <h1 className="text-4xl text-[#1B1512] mb-2" style={serif}>
            Fabric &amp; Material
          </h1>
          <p className="text-[#4A413B] text-sm">
            Filter by color tone and material to find your cloth.
          </p>
        </div>
      </section>

      <section className="w-full px-6 pb-16 pt-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
          {/* Filters dashboard — sticks just below the fixed header */}
         <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-[calc(4rem+10rem)]">
            <div className="bg-white border border-[#5C1A32]/12">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#5C1A32]/10">
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#1B1512]">
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <span className="text-xs font-medium bg-[#5C1A32]/10 text-[#5C1A32] rounded-full px-2.5 py-1">
                    {activeFilterCount} active
                  </span>
                )}
              </div>

              {/* Tone filter — independent accordion */}
              <div className="border-b border-[#5C1A32]/10">
                <button
                  type="button"
                  onClick={() => { setToneOpen((prev) => !prev); }}
                  aria-expanded={toneOpen}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <span className="text-[11px] font-semibold tracking-[0.15em] text-[#4A413B]/70 uppercase">
                    Color Tone
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedTones.length > 0 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); clearTones(); }}
                        role="button"
                        tabIndex={0}
                        className="text-xs text-[#5C1A32] hover:underline"
                      >
                        Clear
                      </span>
                    )}
                    <Chevron open={toneOpen} />
                  </div>
                </button>

                {toneOpen && (
                  <div className="px-5 pb-5 flex flex-wrap gap-2">
                    <button
                      onClick={clearTones}
                      aria-pressed={selectedTones.length === 0}
                      className={`flex items-center gap-2 border px-3 py-2 text-sm transition-colors w-full ${
                        selectedTones.length === 0
                          ? "border-[#5C1A32] bg-[#5C1A32]/5 text-[#5C1A32] font-semibold"
                          : "border-[#5C1A32]/15 text-[#4A413B] hover:border-[#5C1A32]"
                      }`}
                    >
                      All Tones
                    </button>
                    {TONES.map((t) => {
                      const checked = selectedTones.includes(t.key);
                      return (
                        <button
                          key={t.key}
                          onClick={() => { toggleTone(t.key); }}
                          aria-pressed={checked}
                          className={`flex items-center gap-2 border px-3 py-2 text-sm transition-colors w-full ${
                            checked
                              ? "border-[#5C1A32] bg-[#5C1A32]/5 text-[#5C1A32] font-semibold"
                              : "border-[#5C1A32]/15 text-[#4A413B] hover:border-[#5C1A32]"
                          }`}
                        >
                          <span className="flex -space-x-1 shrink-0">
                            {t.swatches.map((c, i) => (
                              <span
                                key={i}
                                className="h-3.5 w-3.5 rounded-full border border-white"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </span>
                          {t.label}
                          {checked && <span className="ml-auto text-[#5C1A32]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Material filter — independent accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => { setMaterialOpen((prev) => !prev); }}
                  aria-expanded={materialOpen}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <span className="text-[11px] font-semibold tracking-[0.15em] text-[#4A413B]/70 uppercase">
                    Material
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedMaterials.length > 0 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); clearMaterials(); }}
                        role="button"
                        tabIndex={0}
                        className="text-xs text-[#5C1A32] hover:underline"
                      >
                        Clear
                      </span>
                    )}
                    <Chevron open={materialOpen} />
                  </div>
                </button>

                {materialOpen && (
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-3 gap-y-2 max-h-72 overflow-y-auto pr-1">
                      {MATERIALS.map((material) => {
                        const checked = selectedMaterials.includes(material);
                        return (
                          <label
                            key={material}
                            className="flex items-center gap-2 text-sm text-[#2A211D] cursor-pointer hover:text-[#1B1512]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => { toggleMaterial(material); }}
                              className="h-4 w-4 shrink-0 rounded-none border-[#5C1A32]/30 text-[#5C1A32] focus:ring-[#5C1A32]"
                            />
                            <span className="truncate">{material}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {activeFilterCount > 0 && (
                <div className="p-5 pt-0">
                  <button
                    onClick={() => { clearTones(); clearMaterials(); }}
                    className="w-full text-center text-sm font-semibold text-[#5C1A32] border border-[#5C1A32]/30 py-2 hover:bg-[#5C1A32]/5 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0 w-full">
            <p className="text-sm text-[#4A413B]/70 mb-6">
              {filteredFabrics.length} fabric
              {filteredFabrics.length !== 1 ? "s" : ""} found
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredFabrics.map((fabric) => (
                <button
                  key={fabric.id}
                  onClick={() => { void navigate(`/fabrics/${fabric.tone}/${fabric.id}`); }}
                  className="group text-left bg-white border border-[#5C1A32]/12 hover:border-[#5C1A32]/35 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(27,21,18,0.25)] transition-all duration-200 overflow-hidden"
                >
                  {/* Swatch — the "cloth" itself, with a folded/pinked corner */}
                  <div className="relative h-36 w-full overflow-hidden">
                    <div
                      className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundColor: fabric.hex }}
                    />
                    {/* subtle inner shade so flat colors read as fabric, not paint */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.10) 100%)",
                      }}
                    />
                    {/* folded pinked-edge corner, echoing a real fabric swatch card */}
                    <div
                      className="absolute bottom-0 right-0 h-6 w-6 bg-[#F6F1E7] shadow-[-2px_-2px_4px_rgba(27,21,18,0.08)]"
                      style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
                    />
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-white/90 bg-black/20 backdrop-blur-sm px-2 py-1">
                      {fabric.tone}
                    </span>
                  </div>

                  {/* Card details */}
                  <div className="px-4 pt-3.5 pb-4 border-t border-[#5C1A32]/10">
                    <div
                      className="text-[15px] leading-snug text-[#1B1512] mb-1"
                      style={serif}
                    >
                      {fabric.name}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium tracking-wide text-[#4A413B]/70 bg-[#5C1A32]/6 px-2 py-0.5">
                        {fabric.material}
                      </span>
                      <span className="text-xs font-semibold text-[#5C1A32] whitespace-nowrap">
                        ₹{fabric.pricePerMeter}
                        <span className="text-[#4A413B]/50 font-normal">/m</span>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredFabrics.length === 0 && (
              <p className="text-sm text-[#4A413B]/50 text-center py-16">
                No fabrics found for this filter.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}