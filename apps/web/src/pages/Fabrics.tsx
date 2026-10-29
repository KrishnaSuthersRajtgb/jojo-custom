import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Tone } from '../data/fabrics';
import ColorWheel from '../components/ColorWheel';
import { SlidersHorizontal, X, Search, RotateCcw } from 'lucide-react';
import { pricingService, PRICING_UPDATED_EVENT } from '../services/pricingService';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

// How close (in RGB Euclidean distance) a fabric's hex must be to the hovered wheel color
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

// Popular material quick filters matching the mockup pills
const POPULAR_MATERIALS = [
  'Silk',
  'Georgette',
  'Cotton',
  'Linen',
  'Khadi',
  'Chanderi',
  'Raw Silk',
  'Poplin',
  'Crepe',
  'Chiffon',
];

export default function Fabrics() {
  const navigate = useNavigate();
  const [selectedTone, setSelectedTone] = useState<Tone | 'all'>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [fabricsList, setFabricsList] = useState(() => pricingService.getAllFabrics());
  const [, setPriceTick] = useState(0);

  useEffect(() => {
    const handlePriceUpdate = () => {
      setFabricsList(pricingService.getAllFabrics());
      setPriceTick((t) => t + 1);
    };
    if (typeof pricingService.refreshFromApi === 'function') {
      pricingService
        .refreshFromApi()
        .then(() => {
          setFabricsList(pricingService.getAllFabrics());
        })
        .catch(() => {
          /* offline fallback */
        });
    }
    window.addEventListener(PRICING_UPDATED_EVENT, handlePriceUpdate);
    window.addEventListener('storage', handlePriceUpdate);
    return () => {
      window.removeEventListener(PRICING_UPDATED_EVENT, handlePriceUpdate);
      window.removeEventListener('storage', handlePriceUpdate);
    };
  }, []);

  // Filter fabrics based on tone, material, custom color, and search query
  const filteredFabrics = useMemo(() => {
    return fabricsList.filter((f) => {
      const toneMatch = selectedTone === 'all' || f.tone === selectedTone;
      const materialMatch =
        selectedMaterial === 'all' ||
        f.material.toLowerCase() === selectedMaterial.toLowerCase() ||
        f.name.toLowerCase().includes(selectedMaterial.toLowerCase());
      const colorMatch =
        !customColor || colorDistance(f.hex, customColor) <= CUSTOM_COLOR_MATCH_THRESHOLD;
      const searchMatch =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        f.material.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return toneMatch && materialMatch && colorMatch && searchMatch;
    });
  }, [fabricsList, selectedTone, selectedMaterial, customColor, searchQuery]);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const matchedIds = new Set(filteredFabrics.map((f) => f.id));
    const firstMatched = filteredFabrics[0];
    const targetTone = firstMatched?.tone;
    const targetMaterial = firstMatched?.material;

    return fabricsList
      .filter((f) => !matchedIds.has(f.id))
      .sort((a, b) => {
        if (targetTone && a.tone === targetTone && b.tone !== targetTone) return -1;
        if (targetTone && b.tone === targetTone && a.tone !== targetTone) return 1;
        if (targetMaterial && a.material === targetMaterial && b.material !== targetMaterial)
          return -1;
        return 0;
      })
      .slice(0, 10);
  }, [searchQuery, filteredFabrics, fabricsList]);

  return (
    <div className="w-full bg-[#FAF7F2] text-[#1B1512] min-h-screen">
      {/* ---------------- 1. DARK WOOD SWATCH HERO (From Mockup input_file_4.png) ---------------- */}
      <section className="relative w-full min-h-[380px] sm:min-h-[460px] bg-[#13100E] flex items-center overflow-hidden">
        {/* Background Image: swatches on dark walnut wood with tailor shears & chalk */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/fabric-swatches.jpg"
            alt="Hand-selected fabric swatches on artisan bench"
            className="w-full h-full object-cover object-center opacity-45 brightness-75 scale-105"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#13100E] via-[#13100E]/40 to-[#13100E]/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20 w-full">
          <div className="max-w-2xl space-y-4">
            <span className="text-[11px] font-semibold tracking-[0.28em] text-[#B8935A] uppercase block">
              THE SWATCH LIBRARY
            </span>

            <h1
              className="text-white text-4xl sm:text-5xl md:text-6xl font-normal leading-[1.08] tracking-tight"
              style={serif}
            >
              Cloth with <br />
              <span className="italic text-[#EFE4D2]">a lineage.</span>
            </h1>

            <p className="text-[#FAF7F2]/80 text-sm sm:text-base leading-relaxed font-light pt-2">
              Silks from Kanchipuram, cottons from Chanderi, georgettes from Surat — every fabric
              chosen by hand.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- 2. MAIN BROWSE SECTION WITH VERTICAL SIDEBAR ---------------- */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* =============================================================== */}
          {/* VERTICAL CURATION SIDEBAR (Scrollable & Responsive)            */}
          {/* =============================================================== */}
          <aside className="w-full lg:w-72 shrink-0 bg-white border border-[#5C1A32]/12 rounded-xl p-4 sm:p-5 shadow-xs lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] overflow-y-auto space-y-5">
            {/* Sidebar Title & Results Badge */}
            <div className="border-b border-[#5C1A32]/10 pb-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#B8935A] font-semibold block">
                  ATELIER ARCHIVE
                </span>
                <h2 className="text-lg font-normal text-[#1B1512]" style={serif}>
                  Filter Fabrics
                </h2>
              </div>
              <span className="px-2.5 py-1 bg-[#5C1A32]/5 border border-[#5C1A32]/15 rounded text-[11px] font-semibold text-[#5C1A32]">
                {filteredFabrics.length}
              </span>
            </div>

            {/* Quick Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#544B45]/50" />
                <input
                  type="text"
                  placeholder="Search weave or color..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#FAF7F2] border border-[#5C1A32]/15 rounded-lg text-xs placeholder:text-[#544B45]/50 text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Section 1: Color Palette Tones (Compact 2x2 Grid) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#A89F95]">
                  COLOR PALETTE
                </span>
                {selectedTone !== 'all' && (
                  <button
                    onClick={() => setSelectedTone('all')}
                    className="text-[10px] text-[#5C1A32] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'All', desc: `${fabricsList.length}`, dots: [] },
                  { id: 'warm', label: 'Warm', desc: 'Reds/Golds', dots: ['#7A1F2B', '#B5822A'] },
                  { id: 'cool', label: 'Cool', desc: 'Blues/Teals', dots: ['#2C5F8A', '#3A7CA5'] },
                  {
                    id: 'neutral',
                    label: 'Neutral',
                    desc: 'Beiges/Grays',
                    dots: ['#EFE9DF', '#CFC6BC'],
                  },
                ].map((item) => {
                  const active = selectedTone === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTone(item.id as Tone | 'all')}
                      className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between ${
                        active
                          ? 'bg-[#5C1A32]/8 border-[#5C1A32] text-[#5C1A32] shadow-2xs font-semibold'
                          : 'bg-white border-[#5C1A32]/10 hover:border-[#5C1A32]/30 text-[#1B1512]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold">{item.label}</span>
                        {item.dots.length > 0 && (
                          <div className="flex items-center -space-x-1">
                            {item.dots.map((dot, idx) => (
                              <span
                                key={idx}
                                className="h-2 w-2 rounded-full border border-white"
                                style={{ backgroundColor: dot }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#544B45]/70 mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Material Weaves (Vertical List with Scrollbar) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#A89F95]">
                  WEAVE & MATERIAL
                </span>
                {selectedMaterial !== 'all' && (
                  <button
                    onClick={() => setSelectedMaterial('all')}
                    className="text-[10px] text-[#5C1A32] hover:underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedMaterial('all')}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                    selectedMaterial === 'all'
                      ? 'bg-[#1B1512] text-[#FAF7F2] font-semibold shadow-2xs'
                      : 'hover:bg-[#FAF7F2] text-[#1B1512]'
                  }`}
                >
                  <span>All Weaves</span>
                  <span className="text-[10px] opacity-70">{fabricsList.length}</span>
                </button>
                {POPULAR_MATERIALS.map((mat) => {
                  const active = selectedMaterial.toLowerCase() === mat.toLowerCase();
                  const count = fabricsList.filter(
                    (f) =>
                      f.material.toLowerCase() === mat.toLowerCase() ||
                      f.name.toLowerCase().includes(mat.toLowerCase()),
                  ).length;
                  return (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setSelectedMaterial(active ? 'all' : mat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                        active
                          ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-2xs'
                          : 'hover:bg-[#FAF7F2] text-[#1B1512]'
                      }`}
                    >
                      <span>{mat}</span>
                      <span
                        className={`text-[10px] ${
                          active ? 'text-[#FAF7F2]/80' : 'text-[#544B45]/60'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Precision Color Wheel Toggle */}
            <div className="border-t border-[#5C1A32]/10 pt-4">
              <button
                type="button"
                onClick={() => setShowColorWheel((prev) => !prev)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                  showColorWheel || customColor
                    ? 'bg-[#5C1A32]/10 border-[#5C1A32] text-[#5C1A32]'
                    : 'bg-white border-[#5C1A32]/20 hover:border-[#5C1A32]/50 text-[#1B1512]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#B8935A]" />
                  <span>{customColor ? 'Custom Color Active' : 'Precision Color Wheel'}</span>
                </div>
                {customColor && (
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: customColor }}
                  />
                )}
              </button>

              {/* Color Wheel Panel */}
              {showColorWheel && (
                <div className="mt-3 p-3 bg-[#FAF7F2] border border-[#5C1A32]/15 rounded-lg flex flex-col items-center relative animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => setShowColorWheel(false)}
                    className="absolute top-2 right-2 p-1 text-[#544B45] hover:text-[#1B1512]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="text-[9px] font-semibold tracking-[0.2em] text-[#5C1A32] uppercase mb-2">
                    SPECTRAL PICKER
                  </span>
                  <ColorWheel
                    selectedHex={customColor}
                    onSelect={(hex) => setCustomColor(hex)}
                    onClear={() => setCustomColor(null)}
                  />
                </div>
              )}
            </div>

            {/* Reset All Filters button if active */}
            {(selectedTone !== 'all' ||
              selectedMaterial !== 'all' ||
              customColor !== null ||
              searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTone('all');
                  setSelectedMaterial('all');
                  setCustomColor(null);
                  setSearchQuery('');
                }}
                className="w-full py-2.5 text-xs font-semibold text-[#5C1A32] hover:bg-[#5C1A32]/5 border border-[#5C1A32]/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </aside>

          {/* =============================================================== */}
          {/* RIGHT MAIN CATALOG GRID                                         */}
          {/* =============================================================== */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white border border-[#5C1A32]/12 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#544B45]">
                <span className="font-semibold text-[#1B1512]">Showing:</span>
                <span className="font-semibold text-[#5C1A32]">
                  {filteredFabrics.length} of {fabricsList.length} swatches
                </span>
                {selectedMaterial !== 'all' && (
                  <span className="px-2 py-0.5 bg-[#5C1A32]/10 text-[#5C1A32] rounded text-[11px] font-medium">
                    Weave: {selectedMaterial}
                  </span>
                )}
                {selectedTone !== 'all' && (
                  <span className="px-2 py-0.5 bg-[#B8935A]/15 text-[#8E6D38] rounded text-[11px] font-medium capitalize">
                    Tone: {selectedTone}
                  </span>
                )}
              </div>

              <div className="text-xs text-[#544B45]/70 italic hidden sm:block">
                Direct mill curation & bespoke master tailoring
              </div>
            </div>

            {/* High-Couture Fabric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filteredFabrics.map((fabric) => (
                <button
                  key={fabric.id}
                  onClick={() => {
                    void navigate(`/fabrics/${fabric.tone}/${fabric.id}`);
                  }}
                  className="group text-left bg-white border border-[#5C1A32]/12 hover:border-[#B8935A] hover:shadow-[0_20px_40px_-15px_rgba(27,21,18,0.25)] transition-all duration-300 overflow-hidden flex flex-col rounded-lg"
                >
                  {/* Swatch Canvas Preview */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#EFE9DF]">
                    <div
                      className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                      style={{ backgroundColor: fabric.hex }}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.15) 100%)',
                      }}
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/20 pointer-events-none" />

                    {/* Tone badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 bg-[#1B1512]/60 backdrop-blur-sm rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B8935A]" />
                      <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white">
                        {fabric.tone}
                      </span>
                    </div>
                  </div>

                  {/* Swatch Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        className="text-base font-normal text-[#1B1512] group-hover:text-[#5C1A32] transition-colors line-clamp-1"
                        style={serif}
                      >
                        {fabric.name}
                      </h3>
                      <p className="text-xs text-[#544B45] line-clamp-2 mt-1 font-light leading-relaxed">
                        {fabric.description}
                      </p>
                    </div>

                    <div className="pt-3.5 mt-3 border-t border-[#5C1A32]/10 flex items-end justify-between">
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#B8935A]">
                        {fabric.material}
                      </span>
                      <div className="text-right">
                        <span className="block text-sm font-semibold text-[#5C1A32]" style={serif}>
                          ₹{pricingService.getFabricPrice(fabric.id, fabric.pricePerMeter)}
                        </span>
                        <span className="block text-[9px] tracking-wider uppercase text-[#544B45]/60">
                          per metre
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 10 Related Fabric Suggestions when searching */}
            {searchQuery.trim() && searchSuggestions.length > 0 && (
              <div className="pt-8 border-t border-[#5C1A32]/15 mt-8 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B8935A] block">
                      RELATED WEAVE SUGGESTIONS
                    </span>
                    <h3 className="text-xl font-normal text-[#1B1512]" style={serif}>
                      10 Related Fabrics You May Like
                    </h3>
                    <p className="text-xs text-[#544B45]">
                      Hand-matched swatches complementary to your search for "{searchQuery}".
                    </p>
                  </div>
                  <span className="text-xs text-[#5C1A32] font-semibold">10 recommendations</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {searchSuggestions.map((sug) => {
                    const price = pricingService.getFabricPrice(sug.id, sug.pricePerMeter);
                    return (
                      <button
                        key={sug.id}
                        onClick={() => navigate(`/fabrics/${sug.tone}/${sug.id}`)}
                        className="group text-left bg-white border border-[#5C1A32]/12 hover:border-[#5C1A32] hover:shadow-md transition-all rounded-lg overflow-hidden flex flex-col"
                      >
                        <div
                          className="relative aspect-square w-full"
                          style={{ backgroundColor: sug.hex }}
                        >
                          <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded">
                            {sug.tone}
                          </span>
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div
                              className="text-xs font-semibold text-[#1B1512] group-hover:text-[#5C1A32] truncate"
                              style={serif}
                            >
                              {sug.name}
                            </div>
                            <div className="text-[10px] text-[#8A7968]">{sug.material}</div>
                          </div>
                          <div className="pt-2 mt-1 border-t border-[#5C1A32]/10 flex items-center justify-between">
                            <span className="text-xs font-bold text-[#5C1A32] font-mono">
                              ₹{price}/m
                            </span>
                            <span className="text-[10px] font-semibold text-[#5C1A32]">
                              View &rarr;
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredFabrics.length === 0 && (
              <div className="text-center py-20 bg-white border border-[#5C1A32]/10 rounded-xl my-6 p-6">
                <p className="text-base font-normal text-[#1B1512]" style={serif}>
                  No fabrics match your current selection.
                </p>
                <p className="text-xs text-[#544B45]/70 mt-1">
                  Try selecting a different material, resetting palette, or clearing the search
                  term.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTone('all');
                    setSelectedMaterial('all');
                    setCustomColor(null);
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-lg"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
