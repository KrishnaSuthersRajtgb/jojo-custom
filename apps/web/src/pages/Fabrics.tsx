import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TONES, MATERIALS, FABRICS, type Tone } from "../data/fabrics";

export default function Fabrics() {
  const navigate = useNavigate();
  const [selectedTones, setSelectedTones] = useState<Tone[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    <div className="w-full">
      <section className="w-full px-6 py-14 bg-rose-50/40">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            Fabric &amp; Material
          </h1>
          <p className="text-gray-500">
            Filter by color tone and material to find your fabric
          </p>
        </div>
      </section>

      <section className="w-full px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Filters dashboard */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-6 rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              {/* Header / mobile toggle */}
              <button
                type="button"
                onClick={() => { setFiltersOpen((prev) => !prev); }}
                aria-expanded={filtersOpen}
                className="w-full flex items-center justify-between p-5 lg:cursor-default lg:pointer-events-none"
              >
                <h2 className="text-sm font-serif font-bold text-gray-900">
                  Filters
                </h2>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <span className="text-xs font-medium bg-fuchsia-50 text-fuchsia-800 rounded-full px-2.5 py-1">
                      {activeFilterCount} active
                    </span>
                  )}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform lg:hidden ${
                      filtersOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {/* Collapsible on mobile, always visible at lg+ */}
              <div
                className={`${
                  filtersOpen ? "block" : "hidden"
                } lg:block px-5 pb-5 space-y-6`}
              >
              {/* Tone filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold tracking-wide text-gray-800">
                    COLOR TONE
                  </h3>
                  {selectedTones.length > 0 && (
                    <button
                      onClick={clearTones}
                      className="text-xs text-fuchsia-800 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Responsive: wraps into a chip grid on small/medium, stacks on the sidebar at lg+ */}
                <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-2">
                  <button
                    onClick={clearTones}
                    aria-pressed={selectedTones.length === 0}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                      selectedTones.length === 0
                        ? "border-fuchsia-800 bg-fuchsia-50 text-fuchsia-800 font-semibold"
                        : "border-gray-200 text-gray-600 hover:border-fuchsia-800"
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
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? "border-fuchsia-800 bg-fuchsia-50 text-fuchsia-800 font-semibold"
                            : "border-gray-200 text-gray-600 hover:border-fuchsia-800"
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
                        {checked && (
                          <span className="ml-auto text-fuchsia-800">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Material filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold tracking-wide text-gray-800">
                    MATERIAL
                  </h3>
                  {selectedMaterials.length > 0 && (
                    <button
                      onClick={clearMaterials}
                      className="text-xs text-fuchsia-800 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-1">
                  {MATERIALS.map((material) => {
                    const checked = selectedMaterials.includes(material);
                    return (
                      <label
                        key={material}
                        className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => { toggleMaterial(material); }}
                          className="h-4 w-4 rounded border-gray-300 text-fuchsia-800 focus:ring-fuchsia-800"
                        />
                        {material}
                      </label>
                    );
                  })}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => { clearTones(); clearMaterials(); }}
                  className="w-full text-center text-sm font-semibold text-fuchsia-800 border border-fuchsia-800/30 rounded-xl py-2 hover:bg-fuchsia-50 transition-colors"
                >
                  Clear all filters
                </button>
              )}
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-6">
              {filteredFabrics.length} fabric
              {filteredFabrics.length !== 1 ? "s" : ""} found
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredFabrics.map((fabric) => (
                <button
                  key={fabric.id}
                  onClick={() => { void navigate(`/fabrics/${fabric.tone}/${fabric.id}`); }}
                  className="text-left rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div
                    className="h-24 w-full"
                    style={{ backgroundColor: fabric.hex }}
                  />
                  <div className="p-3">
                    <div className="text-sm font-semibold text-gray-900">
                      {fabric.name}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                      {fabric.material}
                    </div>
                    <div className="text-xs font-medium text-fuchsia-800">
                      ₹{fabric.pricePerMeter}/m
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredFabrics.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-16">
                No fabrics found for this filter.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}