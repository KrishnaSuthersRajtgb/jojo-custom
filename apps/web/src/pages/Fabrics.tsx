import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TONES, MATERIALS, FABRICS, type Tone } from '../data/fabrics';
import ColorWheel from '../components/ColorWheel';

// Same tokens as Home.tsx — ink / wine / brass / bone, Fraunces + Inter.
// See Home.tsx for the full token comment and the Google Fonts link to
// add once to index.html.
const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

// --- Custom color matching helpers -----------------------------------
// How close (in RGB Euclidean distance, max ~441) a fabric's hex must be
// to the hovered wheel color to count as a match. Lower = stricter.
const CUSTOM_COLOR_MATCH_THRESHOLD = 90;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function colorDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
// -----------------------------------------------------------------------

// Small chevron used on every collapsible section header.
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-[#4A413B]/50 transition-transform shrink-0 ${
        open ? 'rotate-180' : ''
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

// Master toggle icon for the whole filter panel — three straight lines,
// no rotation/morphing, just a static hamburger.
function Hamburger() {
  return (
    <svg
      className="h-5 w-5 text-[#1B1512]"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
    </svg>
  );
}

// Close (X) icon shown inside the mobile drawer header.
function CloseIcon() {
  return (
    <svg
      className="h-5 w-5 text-[#1B1512]"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#5C1A32]' : 'bg-[#5C1A32]/15'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

export default function Fabrics() {
  const navigate = useNavigate();
  const [selectedTones, setSelectedTones] = useState<Tone[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Custom color filter — the wheel is always visible inline under the
  // tone swatches (no button, no popover). Hovering over it sets
  // customColor live; moving off keeps the last hovered color until
  // "Clear" is pressed.
  const [customColor, setCustomColor] = useState<string | null>(null);

  // Each filter group opens/closes independently via its own down-chevron,
  // instead of one all-or-nothing "Filters" toggle. Both start open so the
  // page reads the same as before on first load.
  const [toneOpen, setToneOpen] = useState(true);
  const [materialOpen, setMaterialOpen] = useState(true);

  // Master toggle for the filter panel. On mobile (<lg) this drives a
  // slide-in drawer from the left, like the reference hamburger menu —
  // closed by default there. On desktop (lg+) the panel is always a static
  // sidebar, so this flag has no visual effect above the lg breakpoint.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleTone = (tone: Tone) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone],
    );
  };

  const clearTones = () => {
    setSelectedTones([]);
  };

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(material) ? prev.filter((m) => m !== material) : [...prev, material],
    );
  };

  const clearMaterials = () => {
    setSelectedMaterials([]);
  };

  const filteredFabrics = useMemo(() => {
    return FABRICS.filter((f) => {
      const toneMatch = selectedTones.length === 0 || selectedTones.includes(f.tone);
      const materialMatch =
        selectedMaterials.length === 0 || selectedMaterials.includes(f.material);
      const colorMatch =
        !customColor || colorDistance(f.hex, customColor) <= CUSTOM_COLOR_MATCH_THRESHOLD;
      return toneMatch && materialMatch && colorMatch;
    });
  }, [selectedTones, selectedMaterials, customColor]);

  const activeFilterCount = selectedTones.length + selectedMaterials.length + (customColor ? 1 : 0);

  // Shared body for the filter panel — same JSX rendered inside the static
  // desktop sidebar and the mobile slide-in drawer, so filter logic and
  // markup never diverge between breakpoints.
  const filterPanelBody = (
    <>
      {/* Tone filter — independent accordion */}
      <div className="border-b border-[#5C1A32]/10">
        <button
          type="button"
          onClick={() => {
            setToneOpen((prev) => !prev);
          }}
          aria-expanded={toneOpen}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-[11px] font-semibold tracking-[0.15em] text-[#4A413B]/70 uppercase">
            Color Tone
          </span>
          <div className="flex items-center gap-2">
            {selectedTones.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearTones();
                }}
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
          <div className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearTones}
                aria-pressed={selectedTones.length === 0}
                className={`flex items-center gap-2 border px-3 py-2 text-sm transition-colors flex-1 min-w-[45%] justify-center ${
                  selectedTones.length === 0
                    ? 'border-[#5C1A32] bg-[#5C1A32]/5 text-[#5C1A32] font-semibold'
                    : 'border-[#5C1A32]/15 text-[#4A413B] hover:border-[#5C1A32]'
                }`}
              >
                All Tones
              </button>
              {TONES.map((t) => {
                const checked = selectedTones.includes(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      toggleTone(t.key);
                    }}
                    aria-pressed={checked}
                    className={`flex items-center gap-2 border px-3 py-2 text-sm transition-colors flex-1 min-w-[45%] ${
                      checked
                        ? 'border-[#5C1A32] bg-[#5C1A32]/5 text-[#5C1A32] font-semibold'
                        : 'border-[#5C1A32]/15 text-[#4A413B] hover:border-[#5C1A32]'
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

            {/* Color wheel — shown directly, no button/popover. Hovering
                over it filters live; the swatch/hex readout and Clear link
                sit underneath it. */}
            <div className="mt-4 pt-4 border-t border-[#5C1A32]/10 flex flex-col items-center">
              <ColorWheel
                selectedHex={customColor}
                onSelect={(hex) => {
                  setCustomColor(hex);
                }}
                onClear={() => {
                  setCustomColor(null);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Material filter — independent accordion */}
      <div>
        <button
          type="button"
          onClick={() => {
            setMaterialOpen((prev) => !prev);
          }}
          aria-expanded={materialOpen}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-[11px] font-semibold tracking-[0.15em] text-[#4A413B]/70 uppercase">
            Material
          </span>
          <div className="flex items-center gap-2">
            {selectedMaterials.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearMaterials();
                }}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-3 gap-y-3 max-h-72 overflow-y-auto pr-1">
              {MATERIALS.map((material) => {
                const checked = selectedMaterials.includes(material);
                return (
                  <div
                    key={material}
                    className="flex items-center justify-between gap-2 text-sm text-[#2A211D]"
                  >
                    <span className="truncate">{material}</span>
                    <Toggle
                      checked={checked}
                      onChange={() => {
                        toggleMaterial(material);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="p-5 pt-0">
          <button
            onClick={() => {
              clearTones();
              clearMaterials();
              setCustomColor(null);
            }}
            className="w-full text-center text-sm font-semibold text-[#5C1A32] border border-[#5C1A32]/30 py-2 hover:bg-[#5C1A32]/5 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );

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
          {/* --- Mobile: hamburger bar that opens the slide-in drawer --- */}
          <div className="w-full lg:hidden bg-white border border-[#5C1A32]/12">
            <div className="flex items-center justify-between p-5">
              <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#1B1512]">
                Filters
              </h2>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <span className="text-xs font-medium bg-[#5C1A32]/10 text-[#5C1A32] rounded-full px-2.5 py-1">
                    {activeFilterCount} active
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFiltersOpen(true);
                  }}
                  aria-expanded={filtersOpen}
                  aria-label="Open filters"
                  className="p-1"
                >
                  <Hamburger />
                </button>
              </div>
            </div>
          </div>

          {/* --- Mobile: dark backdrop behind the drawer, tap to close --- */}
          <div
            onClick={() => {
              setFiltersOpen(false);
            }}
            className={`lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
              filtersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden="true"
          />

          {/* --- Mobile: drawer itself, slides in from the left --- */}
          <div
            className={`lg:hidden fixed top-0 left-0 h-full w-[80%] max-w-xs bg-white z-50 shadow-xl transform transition-transform duration-300 ease-out overflow-y-auto ${
              filtersOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#5C1A32]/10">
              <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#1B1512]">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                }}
                aria-label="Close filters"
                className="p-1"
              >
                <CloseIcon />
              </button>
            </div>
            {filterPanelBody}
          </div>

          {/* --- Desktop: static sidebar, always visible, unchanged behavior --- */}
          <aside className="hidden lg:block w-72 shrink-0 lg:sticky lg:top-[calc(4rem+10rem)]">
            <div className="bg-white border border-[#5C1A32]/12">
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
              {filterPanelBody}
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0 w-full">
            <p className="text-sm text-[#4A413B]/70 mb-6">
              {filteredFabrics.length} fabric
              {filteredFabrics.length !== 1 ? 's' : ''} found
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFabrics.map((fabric) => (
                <button
                  key={fabric.id}
                  onClick={() => {
                    void navigate(`/fabrics/${fabric.tone}/${fabric.id}`);
                  }}
                  className="group text-left bg-white border border-[#5C1A32]/10 hover:border-[#B8935A]/50 hover:shadow-[0_18px_36px_-18px_rgba(27,21,18,0.35)] transition-all duration-300 overflow-hidden"
                >
                  {/* Swatch mounted with a bone-colored mat, like a real
                      fabric sample card, instead of a full-bleed tile. */}
                  <div className="p-3 pb-0">
                    <div className="relative h-40 w-full overflow-hidden">
                      <div
                        className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        style={{ backgroundColor: fabric.hex }}
                      />
                      {/* subtle inner shade so flat colors read as fabric, not paint */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.16) 100%)',
                        }}
                      />
                      {/* fine inner frame, like a mounted swatch under glass */}
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/25" />
                      {/* refined tone marker — a small dot + letterspaced label, no heavy badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/95 ring-1 ring-black/10" />
                        <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]">
                          {fabric.tone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card details */}
                  <div className="px-6 pt-5 pb-6">
                    <div className="text-[17px] leading-snug text-[#1B1512] mb-1.5" style={serif}>
                      {fabric.name}
                    </div>
                    <p className="text-xs text-[#4A413B]/60 leading-relaxed mb-4 line-clamp-2">
                      {fabric.description}
                    </p>

                    {/* brass hairline, in place of the old material chip's
                        block background — a quieter, more premium divider */}
                    <div className="h-px bg-gradient-to-r from-[#B8935A]/60 via-[#5C1A32]/10 to-transparent mb-4" />

                    <div className="flex items-end justify-between gap-2">
                      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#B8935A]">
                        {fabric.material}
                      </span>
                      <span className="text-right leading-none">
                        <span
                          className="block text-base font-semibold text-[#5C1A32]"
                          style={serif}
                        >
                          ₹{fabric.pricePerMeter}
                        </span>
                        <span className="block text-[9px] tracking-[0.1em] uppercase text-[#4A413B]/40 mt-1">
                          per metre
                        </span>
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
