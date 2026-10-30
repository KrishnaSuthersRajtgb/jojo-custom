import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Sparkles } from 'lucide-react';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export interface BannerConfig {
  active: boolean;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  linkUrl: string;
}

export const BANNER_STORAGE_KEY = 'jojo_site_popup_banner';

export const DEFAULT_BANNER: BannerConfig = {
  active: true,
  imageUrl: '/images/hero-model.jpg',
  title: 'Bespoke Haute Couture Atelier',
  subtitle: 'Complimentary Master Tailor Home Measurement in Chennai, Coimbatore & Bengaluru.',
  buttonText: 'Book A Fitting Visit',
  linkUrl: '/measurements',
};

export function getActiveBanner(): BannerConfig | null {
  try {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!raw) return DEFAULT_BANNER;
    const parsed = JSON.parse(raw) as BannerConfig;
    return parsed.active && parsed.imageUrl ? parsed : null;
  } catch {
    return DEFAULT_BANNER;
  }
}

export default function SitePopupBanner() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const checkBanner = () => {
      const config = getActiveBanner();
      if (config && config.active && config.imageUrl) {
        setBanner(config);
        // Small delay so page renders smoothly first
        timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
      } else {
        setBanner(null);
        setIsOpen(false);
      }
    };

    checkBanner();
    window.addEventListener('storage', checkBanner);
    window.addEventListener('jojo_banner_updated', checkBanner);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('storage', checkBanner);
      window.removeEventListener('jojo_banner_updated', checkBanner);
    };
  }, []);

  if (!isOpen || !banner) return null;

  const handleAction = () => {
    setIsOpen(false);
    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        void navigate(banner.linkUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />

      {/* Luxury Modal Container */}
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-lg shadow-2xl overflow-hidden border border-[#B8935A]/40 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors shadow-md"
          aria-label="Close promotion banner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Banner Media */}
        <div
          className="relative w-full h-56 sm:h-64 bg-black cursor-pointer overflow-hidden group"
          onClick={handleAction}
        >
          <img
            src={banner.imageUrl}
            alt={banner.title || 'JoJo Flora Promotion'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              // Fallback to hero model if custom URL fails to load
              (e.target as HTMLImageElement).src = '/images/hero-model.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B1512]/90 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3 bg-[#5C1A32] text-[#FAF7F2] text-[10px] tracking-[0.2em] uppercase font-bold px-2.5 py-1 rounded-sm shadow-sm flex items-center gap-1.5 border border-[#B8935A]/50">
            <Sparkles className="w-3 h-3 text-[#B8935A]" /> JoJo Flora Exclusive
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-3 bg-[#FAF7F2]">
          {banner.title && (
            <h3
              className="text-xl sm:text-2xl text-[#1B1512] font-normal tracking-wide"
              style={serif}
            >
              {banner.title}
            </h3>
          )}

          {banner.subtitle && (
            <p className="text-xs sm:text-sm text-[#4A413B] leading-relaxed max-w-sm mx-auto">
              {banner.subtitle}
            </p>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleAction}
              className="w-full sm:w-auto px-6 py-3 bg-[#5C1A32] hover:bg-[#431223] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.18em] rounded-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{banner.buttonText || 'Discover Now'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs text-[#4A413B]/70 hover:text-[#1B1512] uppercase tracking-wider font-medium cursor-pointer"
            >
              Continue to Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
