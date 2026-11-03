import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Tone, type Fabric } from '../data/fabrics';
import ColorWheel from '../components/ColorWheel';
import {
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  Heart,
  ZoomIn,
  Check,
  ArrowRight,
} from 'lucide-react';
import { pricingService, PRICING_UPDATED_EVENT } from '../services/pricingService';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import SEOMeta from '../components/SEOMeta';

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

export type PriceFilter = 'all' | 'under500' | '500-1000' | '1000-2000' | 'above2000';

export default function Fabrics() {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { compareList, addToCompare, removeFromCompare, isInCompare, maxCompareReached } =
    useCompare();
  const [selectedTone, setSelectedTone] = useState<Tone | 'all'>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>('all');
  const [zoomedFabric, setZoomedFabric] = useState<Fabric | null>(null);
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

  // Filter fabrics based on tone, material, custom color, search query, and price
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

      const price = pricingService.getFabricPrice(f.id, f.pricePerMeter);
      let priceMatch = true;
      if (selectedPrice === 'under500') priceMatch = price <= 500;
      else if (selectedPrice === '500-1000') priceMatch = price > 500 && price <= 1000;
      else if (selectedPrice === '1000-2000') priceMatch = price > 1000 && price <= 2000;
      else if (selectedPrice === 'above2000') priceMatch = price > 2000;

      return toneMatch && materialMatch && colorMatch && searchMatch && priceMatch;
    });
  }, [fabricsList, selectedTone, selectedMaterial, customColor, searchQuery, selectedPrice]);

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
      <SEOMeta
        title="Fabric Library | Pure Silk & Handloom Weaves | JoJo Flora"
        description="Explore pure Kanchipuram silks, Banarasi brocades, and fine handloom weaves curated for bespoke tailoring."
      />
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
        {/* ── Top Fabric Search, Live Tone & Price Filters (#19) ── */}
        <div className="mb-8 p-5 sm:p-6 bg-white border border-[#5C1A32]/12 rounded-2xl shadow-xs space-y-4">
          {/* 1. Styled Search Input at Top */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#544B45]/60" />
            <input
              type="text"
              placeholder="Search fabrics by name (e.g. Maroon Silk, Royal Blue, Ivory...)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-[#FAF7F2] border border-[#5C1A32]/15 rounded-xl text-sm placeholder:text-[#544B45]/50 text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:ring-1 focus:ring-[#5C1A32] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5C1A32] p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 2 & 3. Filter Pills for Tone & Price */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-[#5C1A32]/10">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Tone Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7968]">
                  Tone:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'warm', 'cool', 'neutral'] as const).map((tone) => {
                    const active = selectedTone === tone;
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setSelectedTone(tone)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                          active
                            ? 'bg-[#5C1A32] text-white shadow-xs'
                            : 'bg-[#FAF7F2] hover:bg-[#5C1A32]/10 text-[#1B1512] border border-[#5C1A32]/15'
                        }`}
                      >
                        {tone === 'all' ? 'All' : tone}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A7968]">
                  Price:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'under500', label: '≤₹500' },
                    { id: '500-1000', label: '₹500-1000' },
                    { id: '1000-2000', label: '₹1000-2000' },
                    { id: 'above2000', label: '₹2000+' },
                  ].map((tier) => {
                    const active = selectedPrice === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedPrice(tier.id as PriceFilter)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-[#B8935A] text-white shadow-xs'
                            : 'bg-[#FAF7F2] hover:bg-[#B8935A]/15 text-[#1B1512] border border-[#5C1A32]/15'
                        }`}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Count "Showing X of Y fabrics" */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#5C1A32] bg-[#5C1A32]/8 border border-[#5C1A32]/15 px-3 py-1.5 rounded-lg whitespace-nowrap">
                Showing {filteredFabrics.length} of {fabricsList.length} fabrics
              </span>
              {(selectedTone !== 'all' || selectedPrice !== 'all' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTone('all');
                    setSelectedPrice('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#5C1A32] hover:underline font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

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
              selectedPrice !== 'all' ||
              customColor !== null ||
              searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTone('all');
                  setSelectedMaterial('all');
                  setSelectedPrice('all');
                  setCustomColor(null);
                  setSearchQuery('');
                }}
                className="w-full py-2.5 text-xs font-semibold text-[#5C1A32] hover:bg-[#5C1A32]/5 border border-[#5C1A32]/20 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
              {filteredFabrics.map((fabric) => {
                const inCompare = isInCompare(fabric.id);
                return (
                  <div
                    key={fabric.id}
                    className="group text-left bg-white border border-[#5C1A32]/12 hover:border-[#B8935A] hover:shadow-[0_20px_40px_-15px_rgba(27,21,18,0.25)] transition-all duration-300 overflow-hidden flex flex-col rounded-lg"
                  >
                    {/* Swatch Canvas Preview */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        void navigate(`/fabrics/${fabric.tone}/${fabric.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          void navigate(`/fabrics/${fabric.tone}/${fabric.id}`);
                        }
                      }}
                      className="relative aspect-square w-full overflow-hidden bg-[#EFE9DF] cursor-pointer"
                    >
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

                      {/* Wishlist toggle button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleWishlist({
                            fabricId: fabric.id,
                            fabricName: fabric.name,
                            tone: fabric.tone,
                            hex: fabric.hex,
                            pricePerMeter: fabric.pricePerMeter,
                          });
                        }}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-[#1B1512] shadow-sm transition-all hover:scale-110 cursor-pointer"
                        aria-label={
                          isWishlisted(fabric.id) ? 'Remove from wishlist' : 'Add to wishlist'
                        }
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isWishlisted(fabric.id)
                              ? 'fill-red-600 text-red-600'
                              : 'text-[#1B1512]/70 hover:text-red-500'
                          }`}
                        />
                      </button>

                      {/* Hover Zoom Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedFabric(fabric);
                        }}
                        title="Zoom In"
                        aria-label={`Zoom in on ${fabric.name}`}
                        className="absolute bottom-3 right-3 z-10 p-1.5 rounded-full bg-[#1B1512]/70 text-white hover:bg-[#5C1A32] opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:scale-110 cursor-pointer"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Swatch Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          void navigate(`/fabrics/${fabric.tone}/${fabric.id}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            void navigate(`/fabrics/${fabric.tone}/${fabric.id}`);
                          }
                        }}
                        className="cursor-pointer"
                      >
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

                      <div>
                        <div className="pt-3.5 mt-3 border-t border-[#5C1A32]/10 flex items-end justify-between">
                          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#B8935A]">
                            {fabric.material}
                          </span>
                          <div className="text-right">
                            <span
                              className="block text-sm font-semibold text-[#5C1A32]"
                              style={serif}
                            >
                              ₹{pricingService.getFabricPrice(fabric.id, fabric.pricePerMeter)}
                            </span>
                            <span className="block text-[9px] tracking-wider uppercase text-[#544B45]/60">
                              per metre
                            </span>
                          </div>
                        </div>

                        {/* Compare Chip */}
                        <div className="pt-2.5 mt-2.5 border-t border-[#5C1A32]/10 flex items-center justify-between">
                          <button
                            type="button"
                            disabled={!inCompare && maxCompareReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCompare(fabric);
                            }}
                            title={
                              !inCompare && maxCompareReached
                                ? 'Maximum 3 fabrics reached. Remove one to compare this.'
                                : inCompare
                                  ? 'Remove from comparison'
                                  : 'Add to side-by-side comparison'
                            }
                            className={`w-full py-1.5 px-3 rounded text-[11px] font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all ${
                              inCompare
                                ? 'bg-[#5C1A32] text-[#FAF7F2] shadow-xs'
                                : maxCompareReached
                                  ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60'
                                  : 'bg-[#FAF7F2] hover:bg-[#5C1A32]/10 text-[#5C1A32] border border-[#5C1A32]/25'
                            }`}
                          >
                            {inCompare ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>In Compare</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-bold leading-none">⊕</span>
                                <span>Compare</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    setSelectedPrice('all');
                    setCustomColor(null);
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Fabric Zoom Modal (#7) ── */}
      {zoomedFabric && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setZoomedFabric(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#FAF7F2] rounded-2xl border border-[#5C1A32]/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setZoomedFabric(null)}
              className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
              aria-label="Close fabric preview"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Large Color Swatch */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundColor: zoomedFabric.hex }} />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 100%)',
                }}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/20 pointer-events-none" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-semibold uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-[#B8935A]" />
                <span className="capitalize">
                  {zoomedFabric.tone} Tone · {zoomedFabric.hex}
                </span>
              </div>
            </div>

            {/* Swatch Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.25em] text-[#B8935A] uppercase block">
                    {zoomedFabric.material}
                  </span>
                  <h3 className="text-2xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                    {zoomedFabric.name}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-bold text-[#5C1A32] block" style={serif}>
                    ₹{pricingService.getFabricPrice(zoomedFabric.id, zoomedFabric.pricePerMeter)}
                  </span>
                  <span className="text-[10px] text-[#544B45]/70 uppercase tracking-wider">
                    per metre
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#544B45] leading-relaxed">{zoomedFabric.description}</p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void toggleWishlist({
                      fabricId: zoomedFabric.id,
                      fabricName: zoomedFabric.name,
                      tone: zoomedFabric.tone,
                      hex: zoomedFabric.hex,
                      pricePerMeter: zoomedFabric.pricePerMeter,
                    });
                  }}
                  className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl border border-[#5C1A32]/25 text-[#5C1A32] hover:bg-[#5C1A32]/5 text-xs font-semibold uppercase tracking-wider transition-colors text-center cursor-pointer"
                >
                  {isWishlisted(zoomedFabric.id) ? '♥ In Wishlist' : '♡ Wishlist'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fabricId = zoomedFabric.id;
                    setZoomedFabric(null);
                    void navigate(`/fabric/${fabricId}`);
                  }}
                  className="w-full sm:w-auto flex-[2] py-3 px-6 rounded-xl bg-[#5C1A32] hover:bg-[#431224] text-white text-xs font-semibold uppercase tracking-wider transition-colors text-center shadow-md cursor-pointer"
                >
                  Select for Customization &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Bar (Visible when 2+ fabrics selected) */}
      {compareList.length >= 2 && (
        <aside
          aria-label="Fabric comparison bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1B1512]/95 backdrop-blur-md text-[#FAF7F2] border border-[#B8935A]/50 px-4 sm:px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[95vw]"
        >
          <div className="hidden sm:block text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B8935A] block">
              COMPARE ATELIER WEAVES
            </span>
            <span className="text-xs text-[#E8DFC8]">
              {compareList.length} of 3 fabrics selected
            </span>
          </div>

          {/* Thumbnails */}
          <div className="flex items-center gap-2">
            {compareList.map((f) => (
              <div
                key={f.id}
                className="relative group/thumb w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-white/20 shadow-sm"
              >
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: f.hex }}
                  title={`${f.name} (${f.material})`}
                />
                <button
                  type="button"
                  onClick={() => removeFromCompare(f.id)}
                  className="absolute inset-0 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                  title={`Remove ${f.name}`}
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>

          {/* CTA Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/compare', { state: { compareList } })}
              className="px-4 py-2 bg-[#B8935A] hover:bg-[#8C6524] text-[#1B1512] hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Compare Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
