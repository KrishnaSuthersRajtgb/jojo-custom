import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Sparkles, Check } from 'lucide-react';
import SEOMeta from '../components/SEOMeta';
import { useCompare } from '../context/CompareContext';
import { pricingService } from '../services/pricingService';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export default function FabricCompare() {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  const handleSelectFabric = (fabricId: string, tone: string) => {
    void navigate(`/fabrics/${tone}/${fabricId}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1B1512] selection:bg-[#5C1A32] selection:text-[#FAF7F2] pb-24">
      <SEOMeta
        title="Compare Handloom Fabrics | JoJo Flora Couture"
        description="Compare pure Indian handloom silks, Banarasi weaves, and custom atelier swatches side-by-side."
      />

      {/* Top Banner Header */}
      <section className="w-full pt-12 pb-8 px-6 sm:px-10 lg:px-16 border-b border-[#5C1A32]/10 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <Link
              to="/fabrics"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#5C1A32] hover:underline uppercase tracking-wider"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Fabric Library</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="w-6 h-px bg-[#B8935A]" />
              <span className="text-[10px] font-bold tracking-[0.25em] text-[#B8935A] uppercase">
                ATELIER SPECIFICATION COMPARISON
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1B1512]"
              style={serif}
            >
              Fabric Comparison
            </h1>
            <p className="text-xs sm:text-sm text-[#544B45] max-w-xl font-light">
              Compare handloom weaves, tones, drape textures, and per-metre investments to choose
              the perfect foundation for your bespoke ensemble.
            </p>
          </div>

          {compareList.length > 0 && (
            <div className="flex items-center gap-3">
              {compareList.length < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    void navigate('/fabrics');
                  }}
                  className="px-4 py-2.5 bg-white border border-[#5C1A32]/25 hover:border-[#5C1A32] text-[#5C1A32] text-xs font-semibold uppercase tracking-wider rounded inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another Fabric</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearCompare}
                className="px-4 py-2.5 text-[#544B45] hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-10">
        {compareList.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-5 bg-white p-10 rounded-2xl border border-[#5C1A32]/10 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#5C1A32]/15 flex items-center justify-center mx-auto text-[#B8935A]">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-normal text-[#1B1512]" style={serif}>
              No Fabrics Selected
            </h2>
            <p className="text-xs text-[#544B45] leading-relaxed">
              Explore our curated library of handloom silks and select up to 3 fabrics to compare
              their weave, tone, and specifications side by side.
            </p>
            <div>
              <button
                type="button"
                onClick={() => {
                  void navigate('/fabrics');
                }}
                className="px-6 py-3 bg-[#5C1A32] hover:bg-[#451325] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded shadow-md transition-colors"
              >
                Explore Fabric Library
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#5C1A32]/15 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#5C1A32]/10 bg-[#FAF7F2]/50">
                    <th className="p-5 w-44 text-[11px] font-bold uppercase tracking-wider text-[#A89F95]">
                      Specification
                    </th>
                    {compareList.map((fabric) => (
                      <th key={fabric.id} className="p-5 min-w-[220px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-[#B8935A] font-bold">
                            SKU: {fabric.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCompare(fabric.id)}
                            className="p-1 text-[#A89F95] hover:text-rose-600 rounded transition-colors"
                            title="Remove from comparison"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#5C1A32]/10 text-xs">
                  {/* Row 1: Swatch Preview */}
                  <tr>
                    <td className="p-5 font-semibold text-[#544B45] bg-[#FAF7F2]/30">
                      Color Swatch
                    </td>
                    {compareList.map((fabric) => (
                      <td key={fabric.id} className="p-5">
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden shadow-inner border border-black/10">
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: fabric.hex }}
                          />
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.18) 100%)',
                            }}
                          />
                          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[10px]">
                            {fabric.hex.toUpperCase()}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Fabric Name */}
                  <tr>
                    <td className="p-5 font-semibold text-[#544B45] bg-[#FAF7F2]/30">
                      Fabric Name
                    </td>
                    {compareList.map((fabric) => (
                      <td key={fabric.id} className="p-5">
                        <span
                          className="text-base font-semibold text-[#1B1512] block"
                          style={serif}
                        >
                          {fabric.name}
                        </span>
                        {fabric.colourName && (
                          <span className="text-[11px] text-[#A89F95] block mt-0.5">
                            Tone shade: {fabric.colourName}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: Tone */}
                  <tr>
                    <td className="p-5 font-semibold text-[#544B45] bg-[#FAF7F2]/30">
                      Atelier Tone
                    </td>
                    {compareList.map((fabric) => (
                      <td key={fabric.id} className="p-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#5C1A32]/15 text-[#5C1A32] font-semibold text-[11px] uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-[#B8935A]" />
                          {fabric.tone}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: Material & Weave */}
                  <tr>
                    <td className="p-5 font-semibold text-[#544B45] bg-[#FAF7F2]/30">
                      Weave / Material
                    </td>
                    {compareList.map((fabric) => (
                      <td key={fabric.id} className="p-5">
                        <span className="font-semibold text-[#1B1512] text-xs">
                          {fabric.material}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Price Per Metre */}
                  <tr>
                    <td className="p-5 font-semibold text-[#544B45] bg-[#FAF7F2]/30">
                      Price / Metre
                    </td>
                    {compareList.map((fabric) => {
                      const finalPrice = pricingService.getFabricPrice(
                        fabric.id,
                        fabric.pricePerMeter,
                      );
                      return (
                        <td key={fabric.id} className="p-5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-[#5C1A32]" style={serif}>
                              ₹{finalPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-[#544B45]">/ metre</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row 6: Description */}
                  <tr>
                    <td className="p-5 font-semibold text-[#544B45] bg-[#FAF7F2]/30">
                      Description &amp; Texture
                    </td>
                    {compareList.map((fabric) => (
                      <td key={fabric.id} className="p-5 text-[#544B45] leading-relaxed font-light">
                        {fabric.description ||
                          'Pure bespoke handloom weave tailored to perfection.'}
                      </td>
                    ))}
                  </tr>

                  {/* Row 7: Action CTA */}
                  <tr className="bg-[#FAF7F2]/40">
                    <td className="p-5 font-semibold text-[#544B45] bg-[#FAF7F2]/60">
                      Select Fabric
                    </td>
                    {compareList.map((fabric) => (
                      <td key={fabric.id} className="p-5">
                        <button
                          type="button"
                          onClick={() => handleSelectFabric(fabric.id, fabric.tone)}
                          className="w-full py-3 px-4 bg-[#5C1A32] hover:bg-[#451325] text-[#FAF7F2] text-xs font-semibold tracking-wider uppercase rounded shadow-sm inline-flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Select This Fabric</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
