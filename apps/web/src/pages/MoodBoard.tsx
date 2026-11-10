import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Palette, RefreshCw } from 'lucide-react';
import SEOMeta from '../components/SEOMeta';
import { moodboardApi, type MoodBoardItem } from '../services/api';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

const CURATED_FALLBACK_LOOKS: MoodBoardItem[] = [
  {
    _id: 'curated-1',
    id: 'curated-1',
    imageUrl:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
    caption: 'Royal Crimson Brocade Bridal Blouse',
    fabricName: 'Pure Katan Silk & Zari Weave',
    garmentType: 'blouse',
    priceRange: '₹3,500 - ₹5,200',
    fabricId: 'F01',
    active: true,
  },
  {
    _id: 'curated-2',
    id: 'curated-2',
    imageUrl:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
    caption: 'Emerald Temple Border Festive Lehanga Ensemble',
    fabricName: 'Raw Silk & Gold Foil Zari',
    garmentType: 'lehanga',
    priceRange: '₹8,500 - ₹12,000',
    fabricId: 'F02',
    active: true,
  },
  {
    _id: 'curated-3',
    id: 'curated-3',
    imageUrl:
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
    caption: 'Midnight Sapphire Ready-To-Wear Pleated Saree',
    fabricName: 'Georgette Silk with Mirror Borders',
    garmentType: 'ready-to-wear-saree',
    priceRange: '₹4,800 - ₹6,500',
    fabricId: 'F03',
    active: true,
  },
  {
    _id: 'curated-4',
    id: 'curated-4',
    imageUrl:
      'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=900&q=80',
    caption: 'Ivory & Mustard Handloom Anarkali Chudidhar',
    fabricName: 'Chanderi Silk Cotton Blend',
    garmentType: 'chudidhar',
    priceRange: '₹4,200 - ₹6,000',
    fabricId: 'F04',
    active: true,
  },
  {
    _id: 'curated-5',
    id: 'curated-5',
    imageUrl:
      'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=900&q=80',
    caption: 'Blush Rose Heirloom Silk Frock',
    fabricName: 'Tussar Handloom Silk with Scalloped Lace',
    garmentType: 'frocks',
    priceRange: '₹3,800 - ₹5,400',
    fabricId: 'F05',
    active: true,
  },
  {
    _id: 'curated-6',
    id: 'curated-6',
    imageUrl:
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80',
    caption: 'Tailored Imperial Velvet Over-Coat',
    fabricName: 'Micro-Velvet with Antique Brass Buttons',
    garmentType: 'over-coat',
    priceRange: '₹6,500 - ₹9,800',
    active: true,
  },
];

const GARMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Silhouettes' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'lehanga', label: 'Lehanga' },
  { value: 'ready-to-wear-saree', label: 'Ready-to-Wear Saree' },
  { value: 'chudidhar', label: 'Chudidhar' },
  { value: 'frocks', label: 'Frocks' },
  { value: 'over-coat', label: 'Over-Coat' },
  { value: 'pant', label: 'Pant' },
];

export default function MoodBoard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MoodBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const fetchLooks = async () => {
      try {
        const res = await moodboardApi.getItems(false);
        if (active) {
          if (res.data.length > 0) {
            setItems(res.data);
          } else {
            setItems(CURATED_FALLBACK_LOOKS);
          }
        }
      } catch {
        if (active) {
          setItems(CURATED_FALLBACK_LOOKS);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void fetchLooks();
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') return items;
    return items.filter((item) => item.garmentType.toLowerCase() === selectedFilter.toLowerCase());
  }, [items, selectedFilter]);

  const handleRecreateLook = (item: MoodBoardItem) => {
    if (item.fabricId) {
      void navigate(`/fabric/${item.fabricId}`);
    } else {
      void navigate('/fabrics');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1B1512] selection:bg-[#5C1A32] selection:text-[#FAF7F2] pb-24">
      <SEOMeta
        title="Style Inspirations & Outfit Mood Board | Customization Couture"
        description="Discover bespoke lookbook silhouettes, heirloom Indian weaves, and master-tailored ensemble pairings designed by Customization atelier."
      />

      {/* Hero Header */}
      <section className="w-full pt-16 pb-12 px-6 sm:px-10 lg:px-16 border-b border-[#5C1A32]/10 bg-gradient-to-b from-white to-[#FAF7F2]">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5C1A32]/5 border border-[#5C1A32]/15 text-[#5C1A32] text-[11px] font-semibold tracking-[0.2em] uppercase rounded-full">
            <Sparkles className="h-3 w-3 text-[#B8935A]" />
            Customization Couture Atelier Lookbook
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl text-[#1B1512] font-normal tracking-tight"
            style={serif}
          >
            Style Inspirations
          </h1>

          <p className="text-sm sm:text-base text-[#544B45] max-w-2xl mx-auto font-light leading-relaxed">
            Curated ensembles, master hand-cut silhouettes, and bespoke Indian silk inspirations.
            Select any look to begin customizing your perfect fit.
          </p>

          {/* Garment Silhouette Filters */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            {GARMENT_FILTER_OPTIONS.map((opt) => {
              const active = selectedFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedFilter(opt.value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                    active
                      ? 'bg-[#5C1A32] text-[#FAF7F2] shadow-sm'
                      : 'bg-white/80 hover:bg-white text-[#544B45] border border-[#5C1A32]/15 hover:border-[#5C1A32]/40'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Gallery Area */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-12">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-[#B8935A] mx-auto" />
            <p className="text-sm text-[#544B45]">Curating bespoke lookbook silhouettes...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-4 bg-white p-10 rounded-2xl border border-[#5C1A32]/10 shadow-xs">
            <Palette className="h-12 w-12 text-[#B8935A] mx-auto opacity-70" />
            <h3 className="text-xl font-normal text-[#1B1512]" style={serif}>
              No Silhouettes Found
            </h3>
            <p className="text-xs text-[#544B45] leading-relaxed">
              We currently don't have inspirations under this specific silhouette filter. Browse our
              full lookbook collection or start custom tailoring from our fabric catalog.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className="px-5 py-2.5 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold tracking-wider uppercase rounded hover:bg-[#451325] transition-colors"
              >
                View All Looks
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigate('/fabrics');
                }}
                className="px-5 py-2.5 bg-[#FAF7F2] border border-[#5C1A32]/25 text-[#5C1A32] text-xs font-semibold tracking-wider uppercase rounded hover:bg-[#5C1A32]/5 transition-colors"
              >
                Browse Fabrics
              </button>
            </div>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
            {filteredItems.map((item, idx) => (
              <div
                key={item._id || item.id || idx}
                className="break-inside-avoid bg-white rounded-xl border border-[#5C1A32]/10 shadow-xs overflow-hidden group hover:shadow-xl hover:border-[#B8935A]/50 transition-all duration-300 flex flex-col"
              >
                {/* Lookbook Image Container */}
                <div className="relative overflow-hidden bg-[#1B1512]/5">
                  <img
                    src={item.imageUrl}
                    alt={item.caption}
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Silhoutte Pill Badge */}
                  {item.garmentType && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#5C1A32] shadow-xs">
                        {item.garmentType}
                      </span>
                    </div>
                  )}

                  {/* Price Tag Pill */}
                  {item.priceRange && (
                    <div className="absolute bottom-4 right-4">
                      <span className="px-3 py-1 rounded text-xs font-semibold bg-[#5C1A32]/90 backdrop-blur-xs text-[#FAF7F2] shadow-xs">
                        {item.priceRange}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3
                      className="text-xl font-normal text-[#1B1512] group-hover:text-[#5C1A32] transition-colors leading-snug"
                      style={serif}
                    >
                      {item.caption}
                    </h3>

                    {item.fabricName && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8935A]" />
                        <span className="text-xs text-[#544B45] font-light italic">
                          Recommended Weave: {item.fabricName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#5C1A32]/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRecreateLook(item)}
                      className="w-full py-3 px-4 bg-[#5C1A32] group-hover:bg-[#451325] text-[#FAF7F2] text-xs font-semibold tracking-[0.16em] uppercase rounded flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
                    >
                      <span>Recreate This Look</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
